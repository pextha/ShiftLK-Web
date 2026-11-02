import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { validateSriLankanPhone } from '../../utils/phoneValidator';
import { buildWhatsAppOrderMessage, getWhatsAppUrl } from '../../utils/whatsapp';
import { deliveryService } from '../delivery/delivery.service';
import { generateNextOrderCode } from '../../utils/orderCode';
import { toPublicOrderDto } from '../../utils/serializers';
import { z } from 'zod';
import { createOrderSchema } from './orders.schema';

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class OrdersService {
  async createOrder(input: CreateOrderInput) {
    // 1. Honeypot check
    if (input._hp && input._hp.trim().length > 0) {
      throw new AppError('SPAM_DETECTED', 'Invalid request', 400);
    }

    // 2. Validate Sri Lankan Phone
    const phoneValidation = validateSriLankanPhone(input.phone);
    if (!phoneValidation.isValid) {
      throw new AppError('INVALID_PHONE', phoneValidation.error || 'Invalid phone number', 400);
    }

    // 3. Find and validate district
    const zone = await prisma.deliveryZone.findUnique({
      where: { district: input.district },
    });

    if (!zone || !zone.isActive) {
      throw new AppError(
        'INVALID_DISTRICT',
        `District "${input.district}" is not a recognized delivery destination`,
        400
      );
    }

    // 4. Validate and price all products against database
    let subtotal = 0;
    let totalWeightKg = 0;
    let hasBodyStickers = false;

    const validatedItems: Array<{
      productId: string;
      qty: number;
      unitPrice: number;
      unitCost: number;
      productName: string;
      partNumber: string;
      brandName: string;
      condition: string;
    }> = [];

    for (const item of input.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          category: true,
          brand: true,
          translations: true,
        },
      });

      if (!product || !product.isActive) {
        throw new AppError('PRODUCT_NOT_AVAILABLE', `Product ${item.productId} is no longer available`, 400);
      }

      // Check stock sufficiency without deducting
      if (product.stockQty < item.qty) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Insufficient stock for "${product.slug}". Available: ${product.stockQty}, Requested: ${item.qty}`,
          400
        );
      }

      if (product.category?.slug === 'body-stickers') {
        hasBodyStickers = true;
      }

      const unitPrice = Number(product.sellingPrice);
      const unitCost = Number(product.costPrice);
      const itemWeight = Number(product.weightKg || 1.0) * item.qty;

      subtotal += unitPrice * item.qty;
      totalWeightKg += itemWeight;

      const trans =
        product.translations.find((t) => t.language === input.locale) ||
        product.translations.find((t) => t.language === 'en') ||
        product.translations[0];

      validatedItems.push({
        productId: product.id,
        qty: item.qty,
        unitPrice,
        unitCost,
        productName: trans ? trans.name : product.slug,
        partNumber: product.partNumber,
        brandName: product.brand ? product.brand.name : '',
        condition: product.condition,
      });
    }

    // 5. Compute server-side shipping fee
    const deliveryCost = deliveryService.calculateShipping(zone, totalWeightKg, hasBodyStickers);
    const grandTotal = subtotal + deliveryCost;

    // 6. Atomic Transaction: generate order code and insert order + items
    const createdOrder = await prisma.$transaction(async (tx) => {
      const orderCode = await generateNextOrderCode(tx);

      const order = await tx.order.create({
        data: {
          orderCode,
          customerName: input.customerName.trim(),
          phone: phoneValidation.formattedInternational,
          address: input.address.trim(),
          district: input.district.trim(),
          deliveryCost,
          subtotal,
          total: grandTotal,
          status: 'PENDING',
          customerLanguage: input.locale,
          notes: input.notes ? input.notes.trim() : null,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost, // Snapshot stored for admin reporting
            })),
          },
        },
      });

      return order;
    });

    // 7. Generate localized WhatsApp message
    const firstItem = validatedItems[0];
    const whatsAppMessage = buildWhatsAppOrderMessage({
      orderCode: createdOrder.orderCode,
      productName: validatedItems.length === 1 ? firstItem.productName : `${firstItem.productName} + ${validatedItems.length - 1} more items`,
      partNumber: firstItem.partNumber,
      brand: firstItem.brandName,
      condition: firstItem.condition,
      quantity: firstItem.qty,
      unitPrice: firstItem.unitPrice,
      district: input.district,
      deliveryCost,
      total: grandTotal,
      customerName: input.customerName,
      phone: phoneValidation.formattedLocal,
      address: input.address,
      notes: input.notes,
      locale: input.locale,
    });

    const whatsAppUrl = getWhatsAppUrl(whatsAppMessage);

    return {
      orderCode: createdOrder.orderCode,
      subtotal,
      deliveryCost,
      total: grandTotal,
      status: createdOrder.status,
      whatsAppUrl,
      whatsAppMessage,
    };
  }

  async getOrderByCodeAndPhone(orderCode: string, phoneInput: string) {
    const phoneValidation = validateSriLankanPhone(phoneInput);
    if (!phoneValidation.isValid) {
      throw new AppError('INVALID_PHONE', 'Valid Sri Lankan phone number is required to verify order', 400);
    }

    const normalizedCode = orderCode.trim().toUpperCase();

    const order = await prisma.order.findUnique({
      where: { orderCode: normalizedCode },
      include: {
        items: {
          include: {
            product: {
              include: { translations: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', `Order with code "${normalizedCode}" was not found`, 404);
    }

    // Security check: phone number must match
    if (order.phone !== phoneValidation.formattedInternational) {
      throw new AppError('PHONE_MISMATCH', 'The provided phone number does not match this order', 403);
    }

    return toPublicOrderDto(order);
  }
}

export const ordersService = new OrdersService();
