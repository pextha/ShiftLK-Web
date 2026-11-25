import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { auditService } from '../audit/audit.service';
import { shouldHideProfitForUser } from '../../utils/serializers';
import { normalizeStoredImageUrl } from '../../lib/r2';
import { generateNextOrderCode } from '../../utils/orderCode';
import { validateSriLankanPhone } from '../../utils/phoneValidator';

export async function getAdminOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status as string;
    const district = req.query.district as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (district && district !== 'all') {
      where.district = district;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderCode: { contains: q } },
        { customerName: { contains: q } },
        { phone: { contains: q } },
        { secondaryPhone: { contains: q } },
        { trackingNumber: { contains: q } },
      ];
    }

    const [total, orders, hideProfit] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  partNumber: true,
                  stockQty: true,
                  translations: { where: { language: 'en' }, select: { name: true } },
                },
              },
            },
          },
        },
      }),
      shouldHideProfitForUser(req.user?.role),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      customerName: o.customerName,
      phone: o.phone,
      secondaryPhone: o.secondaryPhone,
      address: o.address,
      district: o.district,
      status: o.status,
      deliveryCost: Number(o.deliveryCost),
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      customerLanguage: o.customerLanguage,
      notes: o.notes,
      adminNotes: o.adminNotes,
      trackingNumber: o.trackingNumber,
      paymentSlipUrl: o.paymentSlipUrl ? normalizeStoredImageUrl(o.paymentSlipUrl) : null,
      transferRemark: o.transferRemark,
      stockAllocated: o.stockAllocated,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      itemsCount: o.items.length,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.translations[0]?.name || i.product?.slug || 'Unknown Product',
        partNumber: i.product?.partNumber || '',
        qty: i.qty,
        unitPrice: Number(i.unitPrice),
        unitCost: hideProfit ? 0 : Number(i.unitCost),
        currentStock: i.product?.stockQty ?? 0,
      })),
    }));

    res.json({
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const [order, hideProfit] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  brand: true,
                  translations: true,
                },
              },
            },
          },
        },
      }),
      shouldHideProfitForUser(req.user?.role),
    ]);

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 404);
    }

    res.json({
      data: {
        ...order,
        paymentSlipUrl: order.paymentSlipUrl ? normalizeStoredImageUrl(order.paymentSlipUrl) : null,
        deliveryCost: Number(order.deliveryCost),
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          qty: i.qty,
          unitPrice: Number(i.unitPrice),
          unitCost: hideProfit ? 0 : Number(i.unitCost),
          product: {
            id: i.product.id,
            slug: i.product.slug,
            partNumber: i.product.partNumber,
            stockQty: i.product.stockQty,
            brand: i.product.brand?.name,
            translations: i.product.translations,
          },
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status: targetStatus, notes, trackingNumber } = req.body;

    // Execute within transaction with row locking for stock safety
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        throw new AppError('ORDER_NOT_FOUND', 'Order not found', 404);
      }

      const currentStatus = order.status;

      if (currentStatus === targetStatus) {
        return order;
      }

      // Transition A: PENDING -> CONFIRMED (Atomically lock and decrement stock ONLY if not already allocated at slip checkout)
      let nextStockAllocated = order.stockAllocated;
      if (currentStatus === 'PENDING' && targetStatus === 'CONFIRMED') {
        if (!order.stockAllocated) {
          for (const item of order.items) {
            // Lock product row with raw SQL FOR UPDATE
            const [lockedProd] = (await tx.$queryRawUnsafe(
              'SELECT id, stock_qty FROM products WHERE id = ? FOR UPDATE',
              item.productId
            )) as Array<{ id: string; stock_qty: number }>;

            if (!lockedProd) {
              throw new AppError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found during stock lock`, 404);
            }

            if (lockedProd.stock_qty < item.qty) {
              throw new AppError(
                'INSUFFICIENT_STOCK_ON_CONFIRM',
                `Cannot confirm order ${order.orderCode}: insufficient stock for product ${item.productId}. Available: ${lockedProd.stock_qty}, Required: ${item.qty}`,
                400
              );
            }

            // Decrement stock
            await tx.$executeRawUnsafe(
              'UPDATE products SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE id = ?',
              item.qty,
              item.productId
            );

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                changeQty: -item.qty,
                reason: 'ORDER_CONFIRMED',
                note: `Order ${order.orderCode} confirmed`,
                userId: req.user?.id,
              },
            });
          }
        }
        nextStockAllocated = true;
      }

      // Transition B: Any stock-allocated order (including PENDING with slip or CONFIRMED/SHIPPED/DELIVERED) -> CANCELLED (Restore stock)
      const stockAllocatedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];
      if ((order.stockAllocated || stockAllocatedStatuses.includes(currentStatus)) && targetStatus === 'CANCELLED') {
        for (const item of order.items) {
          await tx.$executeRawUnsafe(
            'UPDATE products SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE id = ?',
            item.qty,
            item.productId
          );

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              changeQty: item.qty,
              reason: 'ORDER_CANCELLED',
              note: `Order ${order.orderCode} cancelled, stock restored`,
              userId: req.user?.id,
            },
          });
        }
        nextStockAllocated = false;
      }

      // Update Order
      const updateData: any = {
        status: targetStatus,
        stockAllocated: nextStockAllocated,
      };
      if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
      if (notes !== undefined) {
        updateData.adminNotes = order.adminNotes
          ? `${order.adminNotes}\n[${new Date().toISOString()}] ${notes}`
          : `[${new Date().toISOString()}] ${notes}`;
      }

      const updated = await tx.order.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });

      return updated;
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'Order',
      entityId: id,
      newValues: { status: targetStatus, notes, trackingNumber },
      ipAddress: req.ip,
    });

    res.json({ data: updatedOrder });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { adminNotes, trackingNumber } = req.body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(adminNotes !== undefined && { adminNotes }),
        ...(trackingNumber !== undefined && { trackingNumber }),
      },
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Create an In-Shop / Walk-In POS Order (Immediately deducts stock and marks as DELIVERED)
 */
export async function createPosOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      customerName = 'Walk-In Customer',
      phone,
      secondaryPhone,
      paymentMethod = 'CASH',
      discountAmount = 0,
      notes,
      items,
    } = req.body;

    // Validate or format optional phone numbers
    let formattedPhone = 'In-Shop Walk-In';
    if (phone && String(phone).trim().length > 0) {
      const pVal = validateSriLankanPhone(String(phone).trim());
      formattedPhone = pVal.isValid ? pVal.formattedInternational : String(phone).trim();
    }

    let formattedSecondaryPhone: string | null = null;
    if (secondaryPhone && String(secondaryPhone).trim().length > 0) {
      const sVal = validateSriLankanPhone(String(secondaryPhone).trim());
      formattedSecondaryPhone = sVal.isValid ? sVal.formattedInternational : String(secondaryPhone).trim();
    }

    // Merge duplicate products in the bill
    const mergedMap = new Map<string, { qty: number; customUnitPrice?: number }>();
    for (const item of items) {
      const existing = mergedMap.get(item.productId);
      if (existing) {
        existing.qty += Number(item.qty);
        if (item.customUnitPrice !== undefined) {
          existing.customUnitPrice = Number(item.customUnitPrice);
        }
      } else {
        mergedMap.set(item.productId, {
          qty: Number(item.qty),
          customUnitPrice:
            item.customUnitPrice !== undefined ? Number(item.customUnitPrice) : undefined,
        });
      }
    }

    const productIds = Array.from(mergedMap.keys());
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: true,
        translations: { where: { language: 'en' } },
      },
    });
    const productLookup = new Map(dbProducts.map((p) => [p.id, p]));

    const createdResult = await prisma.$transaction(async (tx) => {
      const orderCode = await generateNextOrderCode(tx);

      let rawSubtotal = 0;
      const lineItems: Array<{
        productId: string;
        productName: string;
        partNumber: string;
        brandName: string;
        qty: number;
        unitPrice: number;
        unitCost: number;
        lineTotal: number;
      }> = [];

      for (const [productId, reqItem] of mergedMap.entries()) {
        const prodMeta = productLookup.get(productId);
        if (!prodMeta) {
          throw new AppError('PRODUCT_NOT_FOUND', `Product ${productId} not found`, 404);
        }

        const [lockedProd] = (await tx.$queryRawUnsafe(
          'SELECT id, stock_qty FROM products WHERE id = ? FOR UPDATE',
          productId
        )) as Array<{ id: string; stock_qty: number }>;

        const productName = prodMeta.translations[0]?.name || prodMeta.slug;

        if (!lockedProd || Number(lockedProd.stock_qty) < reqItem.qty) {
          throw new AppError(
            'INSUFFICIENT_STOCK',
            `Insufficient stock for "${productName}" (#${prodMeta.partNumber}). Available: ${lockedProd?.stock_qty ?? 0}, Requested: ${reqItem.qty}`,
            400
          );
        }

        await tx.$executeRawUnsafe(
          'UPDATE products SET stock_qty = stock_qty - ?, updated_at = NOW() WHERE id = ?',
          reqItem.qty,
          productId
        );

        await tx.stockMovement.create({
          data: {
            productId,
            changeQty: -reqItem.qty,
            reason: 'ORDER_CONFIRMED',
            note: `In-Shop POS Sale ${orderCode} (${paymentMethod})`,
            userId: req.user?.id,
          },
        });

        const unitPrice =
          reqItem.customUnitPrice !== undefined && reqItem.customUnitPrice >= 0
            ? reqItem.customUnitPrice
            : Number(prodMeta.sellingPrice);
        const unitCost = Number(prodMeta.costPrice);
        const lineTotal = unitPrice * reqItem.qty;
        rawSubtotal += lineTotal;

        lineItems.push({
          productId,
          productName,
          partNumber: prodMeta.partNumber,
          brandName: prodMeta.brand?.name || '',
          qty: reqItem.qty,
          unitPrice,
          unitCost,
          lineTotal,
        });
      }

      const appliedDiscount = Math.min(rawSubtotal, Math.max(0, Number(discountAmount) || 0));
      const finalTotal = Math.max(0, rawSubtotal - appliedDiscount);

      const order = await tx.order.create({
        data: {
          orderCode,
          customerName: (customerName || 'Walk-In Customer').trim() || 'Walk-In Customer',
          phone: formattedPhone,
          secondaryPhone: formattedSecondaryPhone,
          address: 'In-Shop Purchase — Polgasowita Showroom',
          district: 'Colombo',
          deliveryCost: 0,
          subtotal: finalTotal,
          total: finalTotal,
          status: 'DELIVERED',
          customerLanguage: 'en',
          notes: notes ? String(notes).trim() : null,
          adminNotes: `In-Shop POS Sale (${paymentMethod})${
            appliedDiscount > 0 ? ` | Discount: LKR ${appliedDiscount.toFixed(2)}` : ''
          }`,
          transferRemark: `IN_SHOP_${paymentMethod}`,
          stockAllocated: true,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              qty: li.qty,
              unitPrice: li.unitPrice,
              unitCost: li.unitCost,
            })),
          },
        },
      });

      return {
        order,
        rawSubtotal,
        appliedDiscount,
        finalTotal,
        paymentMethod,
        lineItems,
      };
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'POS_ORDER_CREATED',
      entityType: 'Order',
      entityId: createdResult.order.id,
      newValues: {
        orderCode: createdResult.order.orderCode,
        total: createdResult.finalTotal,
        paymentMethod,
        itemsCount: createdResult.lineItems.length,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      data: {
        id: createdResult.order.id,
        orderCode: createdResult.order.orderCode,
        customerName: createdResult.order.customerName,
        phone: createdResult.order.phone,
        secondaryPhone: createdResult.order.secondaryPhone,
        paymentMethod: createdResult.paymentMethod,
        rawSubtotal: createdResult.rawSubtotal,
        discountAmount: createdResult.appliedDiscount,
        total: createdResult.finalTotal,
        notes: createdResult.order.notes,
        createdAt: createdResult.order.createdAt,
        items: createdResult.lineItems,
      },
    });
  } catch (error) {
    next(error);
  }
}
