import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { validateSriLankanPhone } from '../../utils/phoneValidator';
import { buildWhatsAppOrderMessage, getWhatsAppUrl } from '../../utils/whatsapp';
import { formatLKR } from '../../utils/currency';
import { deliveryService } from '../delivery/delivery.service';
import { generateNextOrderCode } from '../../utils/orderCode';
import { toPublicOrderDto } from '../../utils/serializers';
import { normalizeStoredImageUrl } from '../../lib/r2';
import { z } from 'zod';
import { createOrderSchema } from './orders.schema';

type CreateOrderInput = z.infer<typeof createOrderSchema>;

const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const RESERVATION_EXTENSION_MS = 5 * 60 * 1000; // +5 minutes

export class OrdersService {
  constructor() {
    // Periodic background sweep every 30s to release expired stock reservations
    const timer = setInterval(() => {
      this.releaseExpiredReservations().catch(() => {});
    }, 30_000);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  /**
   * Finds all ACTIVE reservations past expiresAt, marks them EXPIRED, and restores product.stockQty
   */
  async releaseExpiredReservations(): Promise<number> {
    const now = new Date();
    const expiredList = await prisma.stockReservation.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: now },
      },
    });

    if (expiredList.length === 0) return 0;

    let releasedCount = 0;
    for (const resItem of expiredList) {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.stockReservation.updateMany({
          where: { id: resItem.id, status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });

        if (claimed.count > 0) {
          await tx.$executeRawUnsafe(
            'UPDATE products SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE id = ?',
            resItem.qty,
            resItem.productId
          );
          releasedCount++;
        }
      });
    }

    return releasedCount;
  }

  /**
   * Temporarily deducts stock for 10 minutes when a customer enters the Direct Buy form
   */
  async createReservation(productId: string, qty: number) {
    await this.releaseExpiredReservations();

    return prisma.$transaction(async (tx) => {
      const [lockedProd] = (await tx.$queryRawUnsafe(
        'SELECT id, slug, stock_qty, is_active FROM products WHERE id = ? FOR UPDATE',
        productId
      )) as Array<{ id: string; slug: string; stock_qty: number; is_active: number | boolean }>;

      if (!lockedProd || !lockedProd.is_active) {
        throw new AppError('PRODUCT_NOT_AVAILABLE', 'This product is no longer available', 400);
      }

      if (Number(lockedProd.stock_qty) < qty) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Insufficient stock available. Available: ${lockedProd.stock_qty}, Requested: ${qty}`,
          400
        );
      }

      await tx.$executeRawUnsafe(
        'UPDATE products SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE id = ?',
        qty,
        productId
      );

      const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

      const reservation = await tx.stockReservation.create({
        data: {
          productId,
          qty,
          status: 'ACTIVE',
          expiresAt,
        },
      });

      return {
        reservationId: reservation.id,
        productId,
        qty,
        remainingStock: Number(lockedProd.stock_qty) - qty,
        expiresAt: reservation.expiresAt.toISOString(),
        serverTime: new Date().toISOString(),
        durationSeconds: Math.floor(RESERVATION_DURATION_MS / 1000),
      };
    });
  }

  /**
   * Extends an active stock reservation by +5 minutes
   */
  async extendReservation(reservationId: string) {
    await this.releaseExpiredReservations();

    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation || reservation.status !== 'ACTIVE') {
        throw new AppError(
          'RESERVATION_EXPIRED',
          'Your stock reservation has already expired. Please re-open the order form.',
          400
        );
      }

      if (reservation.extendedCount >= 3) {
        throw new AppError(
          'MAX_EXTENSIONS_REACHED',
          'Maximum time extensions reached for this reservation.',
          400
        );
      }

      const baseTime = Math.max(reservation.expiresAt.getTime(), Date.now());
      const newExpiresAt = new Date(baseTime + RESERVATION_EXTENSION_MS);

      const updated = await tx.stockReservation.update({
        where: { id: reservationId },
        data: {
          expiresAt: newExpiresAt,
          extendedCount: { increment: 1 },
        },
      });

      return {
        reservationId: updated.id,
        expiresAt: updated.expiresAt.toISOString(),
        extendedCount: updated.extendedCount,
        serverTime: new Date().toISOString(),
      };
    });
  }

  /**
   * Releases an active stock reservation immediately (e.g. customer cancels or timer hits 00:00)
   */
  async releaseReservation(reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation || reservation.status !== 'ACTIVE') {
        return { released: false, productId: reservation?.productId };
      }

      const claimed = await tx.stockReservation.updateMany({
        where: { id: reservationId, status: 'ACTIVE' },
        data: { status: 'RELEASED' },
      });

      if (claimed.count > 0) {
        await tx.$executeRawUnsafe(
          'UPDATE products SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE id = ?',
          reservation.qty,
          reservation.productId
        );
      }

      const updatedProd = await tx.product.findUnique({
        where: { id: reservation.productId },
        select: { stockQty: true },
      });

      return {
        released: claimed.count > 0,
        productId: reservation.productId,
        restoredQty: reservation.qty,
        currentStock: updatedProd?.stockQty ?? 0,
      };
    });
  }

  async createOrder(input: CreateOrderInput) {
    // 0. Clean up any expired reservations first
    await this.releaseExpiredReservations();

    // 1. Honeypot check
    if (input._hp && input._hp.trim().length > 0) {
      throw new AppError('SPAM_DETECTED', 'Invalid request', 400);
    }

    // 2. Validate Sri Lankan Phone (Primary + Optional Secondary)
    const phoneValidation = validateSriLankanPhone(input.phone);
    if (!phoneValidation.isValid) {
      throw new AppError('INVALID_PHONE', phoneValidation.error || 'Invalid phone number', 400);
    }

    let formattedSecondaryPhone: string | null = null;
    let localSecondaryPhone: string | null = null;
    if (input.secondaryPhone && input.secondaryPhone.trim().length > 0) {
      const secValidation = validateSriLankanPhone(input.secondaryPhone.trim());
      if (!secValidation.isValid) {
        throw new AppError(
          'INVALID_SECONDARY_PHONE',
          secValidation.error || 'Invalid secondary phone number',
          400
        );
      }
      formattedSecondaryPhone = secValidation.formattedInternational;
      localSecondaryPhone = secValidation.formattedLocal;
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

    // Check active reservation if provided
    const activeReservation = input.reservationId
      ? await prisma.stockReservation.findFirst({
          where: {
            id: input.reservationId,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
          },
        })
      : null;

    // 4. Merge duplicate productId items and batch-fetch products in one query
    const mergedItemsMap = new Map<string, number>();
    for (const item of input.items) {
      mergedItemsMap.set(item.productId, (mergedItemsMap.get(item.productId) || 0) + item.qty);
    }
    const mergedItems = Array.from(mergedItemsMap.entries()).map(([productId, qty]) => ({
      productId,
      qty,
    }));

    const uniqueProductIds = mergedItems.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      include: {
        category: true,
        brand: true,
        translations: true,
      },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    let totalWeightKg = 0;
    let allItemsAreStickers = mergedItems.length > 0;

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

    for (const item of mergedItems) {
      const product = productMap.get(item.productId);

      if (!product || !product.isActive) {
        throw new AppError('PRODUCT_NOT_AVAILABLE', `Product ${item.productId} is no longer available`, 400);
      }

      // Account for stock already held by this customer's active reservation
      const reservedForThisProduct =
        activeReservation && activeReservation.productId === item.productId ? activeReservation.qty : 0;

      if (product.stockQty + reservedForThisProduct < item.qty) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Insufficient stock for "${product.slug}". Available: ${product.stockQty + reservedForThisProduct}, Requested: ${item.qty}`,
          400
        );
      }

      if (product.category?.slug !== 'body-stickers') {
        allItemsAreStickers = false;
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
    const deliveryCost = deliveryService.calculateShipping(zone, totalWeightKg, allItemsAreStickers);
    const grandTotal = subtotal + deliveryCost;
    const normalizedSlipUrl = normalizeStoredImageUrl(input.paymentSlipUrl);
    const transferRemark = (input.transferRemark || input.customerName).trim();

    // 6. Atomic Transaction: consume reservation (or deduct stock), create StockMovement, and insert Order + Items
    const createdOrder = await prisma.$transaction(async (tx) => {
      const orderCode = await generateNextOrderCode(tx);

      for (const item of validatedItems) {
        let consumedFromReservation = false;

        if (input.reservationId) {
          const resRow = await tx.stockReservation.findUnique({
            where: { id: input.reservationId },
          });

          if (resRow && resRow.status === 'ACTIVE' && resRow.productId === item.productId) {
            const claimed = await tx.stockReservation.updateMany({
              where: { id: resRow.id, status: 'ACTIVE' },
              data: { status: 'CONSUMED' },
            });

            if (claimed.count > 0) {
              consumedFromReservation = true;
              // If order qty differs from reserved qty, reconcile difference
              const diff = item.qty - resRow.qty;
              if (diff > 0) {
                const [lockedProd] = (await tx.$queryRawUnsafe(
                  'SELECT id, stock_qty FROM products WHERE id = ? FOR UPDATE',
                  item.productId
                )) as Array<{ id: string; stock_qty: number }>;
                if (!lockedProd || Number(lockedProd.stock_qty) < diff) {
                  throw new AppError('INSUFFICIENT_STOCK', 'Insufficient stock for additional quantity', 400);
                }
                await tx.$executeRawUnsafe(
                  'UPDATE products SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE id = ?',
                  diff,
                  item.productId
                );
              } else if (diff < 0) {
                await tx.$executeRawUnsafe(
                  'UPDATE products SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE id = ?',
                  Math.abs(diff),
                  item.productId
                );
              }
            }
          }
        }

        if (!consumedFromReservation) {
          const [lockedProd] = (await tx.$queryRawUnsafe(
            'SELECT id, stock_qty FROM products WHERE id = ? FOR UPDATE',
            item.productId
          )) as Array<{ id: string; stock_qty: number }>;

          if (!lockedProd || Number(lockedProd.stock_qty) < item.qty) {
            throw new AppError(
              'INSUFFICIENT_STOCK',
              `Reservation expired and stock is no longer sufficient for ${item.productName}`,
              400
            );
          }

          await tx.$executeRawUnsafe(
            'UPDATE products SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE id = ?',
            item.qty,
            item.productId
          );
        }

        // Permanent stock movement audit record
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            changeQty: -item.qty,
            reason: 'ORDER_CONFIRMED',
            note: `Order ${orderCode} placed with Bank Slip (Remark: ${transferRemark})`,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          orderCode,
          customerName: input.customerName.trim(),
          phone: phoneValidation.formattedInternational,
          secondaryPhone: formattedSecondaryPhone,
          address: input.address.trim(),
          district: input.district.trim(),
          deliveryCost,
          subtotal,
          total: grandTotal,
          status: 'PENDING',
          customerLanguage: input.locale,
          notes: input.notes ? input.notes.trim() : null,
          paymentSlipUrl: normalizedSlipUrl,
          transferRemark,
          stockAllocated: true,
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

    // 7. Generate localized WhatsApp message using dynamic SystemSetting WhatsApp number if configured
    const sysSetting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    const firstItem = validatedItems[0];
    const itemsSummary =
      validatedItems.length > 1
        ? validatedItems
            .map(
              (item, idx) =>
                `  ${idx + 1}. ${item.productName} (#${item.partNumber}) × ${item.qty} = ${formatLKR(
                  item.unitPrice * item.qty,
                  input.locale || 'en'
                )}`
            )
            .join('\n')
        : undefined;

    const whatsAppMessage = buildWhatsAppOrderMessage({
      orderCode: createdOrder.orderCode,
      productName:
        validatedItems.length === 1
          ? firstItem.productName
          : `${firstItem.productName} + ${validatedItems.length - 1} more items`,
      partNumber: firstItem.partNumber,
      brand: firstItem.brandName,
      condition: firstItem.condition,
      quantity: firstItem.qty,
      unitPrice: firstItem.unitPrice,
      subtotalOverride: subtotal,
      itemsSummary,
      district: input.district,
      deliveryCost,
      total: grandTotal,
      customerName: input.customerName,
      phone: localSecondaryPhone
        ? `${phoneValidation.formattedLocal} / ${localSecondaryPhone}`
        : phoneValidation.formattedLocal,
      address: input.address,
      notes: input.notes,
      locale: input.locale,
    });

    const whatsAppUrl = getWhatsAppUrl(whatsAppMessage, sysSetting?.whatsappNumber || undefined);

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

    if (
      !order ||
      (order.phone !== phoneValidation.formattedInternational &&
        order.secondaryPhone !== phoneValidation.formattedInternational)
    ) {
      throw new AppError(
        'ORDER_NOT_FOUND',
        'Order not found or the provided phone number does not match this order',
        404
      );
    }

    return toPublicOrderDto(order);
  }
}

export const ordersService = new OrdersService();
