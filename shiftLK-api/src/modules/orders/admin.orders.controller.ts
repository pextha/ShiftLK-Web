import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { auditService } from '../audit/audit.service';

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
        { trackingNumber: { contains: q } },
      ];
    }

    const [total, orders] = await Promise.all([
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
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      customerName: o.customerName,
      phone: o.phone,
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
        unitCost: Number(i.unitCost),
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

    const order = await prisma.order.findUnique({
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
    });

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 404);
    }

    res.json({
      data: {
        ...order,
        deliveryCost: Number(order.deliveryCost),
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          qty: i.qty,
          unitPrice: Number(i.unitPrice),
          unitCost: Number(i.unitCost),
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

      // Transition A: PENDING -> CONFIRMED (Atomically lock and decrement stock)
      if (currentStatus === 'PENDING' && targetStatus === 'CONFIRMED') {
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
        }
      }

      // Transition B: CONFIRMED / SHIPPED / DELIVERED -> CANCELLED (Restore stock)
      const stockAllocatedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];
      if (stockAllocatedStatuses.includes(currentStatus) && targetStatus === 'CANCELLED') {
        for (const item of order.items) {
          await tx.$executeRawUnsafe(
            'UPDATE products SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE id = ?',
            item.qty,
            item.productId
          );
        }
      }

      // Update Order
      const updateData: any = {
        status: targetStatus,
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
