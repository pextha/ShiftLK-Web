import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { auditService } from '../audit/audit.service';

export async function getAdminProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = req.query.search as string;
    const category = req.query.category as string;
    const condition = req.query.condition as string;

    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { partNumber: { contains: q } },
        { slug: { contains: q } },
        { translations: { some: { name: { contains: q } } } },
      ];
    }
    if (category && category !== 'all') {
      where.category = { slug: category };
    }
    if (condition && condition !== 'all') {
      where.condition = condition.toUpperCase();
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          translations: true,
          images: true,
          compatibilities: true,
        },
      }),
    ]);

    const items = products.map((p) => {
      const selling = Number(p.sellingPrice);
      const cost = Number(p.costPrice);
      const margin = selling > 0 ? ((selling - cost) / selling) * 100 : 0;

      return {
        id: p.id,
        slug: p.slug,
        partNumber: p.partNumber,
        category: p.category,
        brand: p.brand,
        condition: p.condition,
        sellingPrice: selling,
        costPrice: cost,
        profitMarginPercent: Math.round(margin * 10) / 10,
        stockQty: p.stockQty,
        weightKg: Number(p.weightKg),
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        translations: p.translations,
        images: p.images,
        compatibilities: p.compatibilities,
      };
    });

    res.json({
      data: items,
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

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body;

    const existing = await prisma.product.findUnique({
      where: { slug: body.slug },
    });
    if (existing) {
      throw new AppError('SLUG_EXISTS', `Product with slug "${body.slug}" already exists`, 409);
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug: body.slug,
          partNumber: body.partNumber,
          brandId: body.brandId,
          categoryId: body.categoryId,
          condition: body.condition,
          sellingPrice: body.sellingPrice,
          costPrice: body.costPrice,
          stockQty: body.stockQty,
          weightKg: body.weightKg || 1.0,
          isActive: body.isActive ?? true,
          translations: {
            create: body.translations.map((t: any) => ({
              language: t.language,
              name: t.name,
              description: t.description,
            })),
          },
          images: body.images
            ? {
                create: body.images.map((img: any) => ({
                  imageUrl: img.imageUrl,
                  displayOrder: img.displayOrder || 0,
                  isPrimary: img.isPrimary || false,
                })),
              }
            : undefined,
          compatibilities: body.compatibilities
            ? {
                create: body.compatibilities.map((c: any) => ({
                  make: c.make,
                  model: c.model,
                  yearFrom: c.yearFrom,
                  yearTo: c.yearTo || null,
                  chassisCode: c.chassisCode || null,
                })),
              }
            : undefined,
        },
        include: {
          translations: true,
          images: true,
          compatibilities: true,
        },
      });

      return created;
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      newValues: { slug: product.slug, partNumber: product.partNumber, stockQty: product.stockQty },
      ipAddress: req.ip,
    });

    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!existing) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If translations provided, delete old and create new
      if (body.translations) {
        await tx.productTranslation.deleteMany({ where: { productId: id } });
        await tx.productTranslation.createMany({
          data: body.translations.map((t: any) => ({
            productId: id,
            language: t.language,
            name: t.name,
            description: t.description,
          })),
        });
      }

      const prod = await tx.product.update({
        where: { id },
        data: {
          slug: body.slug,
          partNumber: body.partNumber,
          brandId: body.brandId,
          categoryId: body.categoryId,
          condition: body.condition,
          sellingPrice: body.sellingPrice,
          costPrice: body.costPrice,
          stockQty: body.stockQty,
          weightKg: body.weightKg,
          isActive: body.isActive,
        },
        include: {
          translations: true,
          images: true,
          compatibilities: true,
        },
      });

      return prod;
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
      oldValues: {
        sellingPrice: Number(existing.sellingPrice),
        costPrice: Number(existing.costPrice),
        stockQty: existing.stockQty,
      },
      newValues: {
        sellingPrice: updated.sellingPrice,
        costPrice: updated.costPrice,
        stockQty: updated.stockQty,
      },
      ipAddress: req.ip,
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { quantityChange, reason, note } = req.body;

    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id } });
      if (!prod) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      const newQty = prod.stockQty + quantityChange;
      if (newQty < 0) {
        throw new AppError(
          'INVALID_STOCK_LEVEL',
          `Cannot decrement stock below zero. Current: ${prod.stockQty}, Adjustment: ${quantityChange}`,
          400
        );
      }

      const updated = await tx.product.update({
        where: { id },
        data: { stockQty: newQty },
      });

      return { prod, updated };
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'Product',
      entityId: id,
      oldValues: { stockQty: product.prod.stockQty },
      newValues: { stockQty: product.updated.stockQty, change: quantityChange, reason, note },
      ipAddress: req.ip,
    });

    res.json({
      data: {
        id,
        previousStock: product.prod.stockQty,
        currentStock: product.updated.stockQty,
        adjustment: quantityChange,
        reason,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    // Soft delete by setting isActive to false
    const deactivated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await auditService.log({
      userId: req.user?.id,
      action: 'PRODUCT_DEACTIVATED',
      entityType: 'Product',
      entityId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ipAddress: req.ip,
    });

    res.json({ data: { message: 'Product deactivated successfully', product: deactivated } });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        translations: true,
        images: { orderBy: { displayOrder: 'asc' } },
        compatibilities: true,
      },
    });

    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    const selling = Number(product.sellingPrice);
    const cost = Number(product.costPrice);
    const margin = selling > 0 ? ((selling - cost) / selling) * 100 : 0;

    res.json({
      data: {
        ...product,
        sellingPrice: selling,
        costPrice: cost,
        profitMarginPercent: Math.round(margin * 10) / 10,
        profitPerUnit: Math.round((selling - cost) * 100) / 100,
        weightKg: Number(product.weightKg),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStockOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        costPrice: true,
        sellingPrice: true,
        stockQty: true,
        lowStockThreshold: true,
      },
    });

    let totalProducts = products.length;
    let totalUnits = 0;
    let totalStockValueAtCost = 0;
    let totalStockValueAtSelling = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    for (const p of products) {
      totalUnits += p.stockQty;
      const cost = Number(p.costPrice);
      const selling = Number(p.sellingPrice);
      totalStockValueAtCost += cost * p.stockQty;
      totalStockValueAtSelling += selling * p.stockQty;

      if (p.stockQty <= 0) {
        outOfStockCount++;
      } else if (p.stockQty <= p.lowStockThreshold) {
        lowStockCount++;
      }
    }

    const expectedProfitIfAllSold = totalStockValueAtSelling - totalStockValueAtCost;

    res.json({
      data: {
        totalProducts,
        totalUnits,
        totalStockValueAtCost: Math.round(totalStockValueAtCost),
        totalStockValueAtSelling: Math.round(totalStockValueAtSelling),
        expectedProfitIfAllSold: Math.round(expectedProfitIfAllSold),
        outOfStockCount,
        lowStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const productId = req.query.productId as string;
    const reason = req.query.reason as string;

    const where: any = {};
    if (productId) where.productId = productId;
    if (reason && reason !== 'all') where.reason = reason;

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              partNumber: true,
              slug: true,
              translations: { where: { language: 'en' }, select: { name: true } },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    res.json({
      data: movements,
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

export async function restockProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { quantity, newCostPrice, note } = req.body;

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      throw new AppError('INVALID_QUANTITY', 'Restock quantity must be greater than 0', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id } });
      if (!prod) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      const updateData: any = {
        stockQty: { increment: qty },
      };
      if (newCostPrice !== undefined && newCostPrice !== null && Number(newCostPrice) >= 0) {
        updateData.costPrice = Number(newCostPrice);
      }

      const product = await tx.product.update({
        where: { id },
        data: updateData,
      });

      await tx.stockMovement.create({
        data: {
          productId: id,
          changeQty: qty,
          reason: 'RESTOCK',
          note: note || `Restocked ${qty} units${newCostPrice !== undefined ? ` at Rs. ${newCostPrice}` : ''}`,
          userId: req.user?.id,
        },
      });

      return product;
    });

    res.json({
      data: {
        id,
        currentStock: updated.stockQty,
        costPrice: Number(updated.costPrice),
        message: 'Product successfully restocked',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function inlineStockAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { newQty, delta, note } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id } });
      if (!prod) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      let targetStock: number;
      let changeQty: number;

      if (newQty !== undefined) {
        targetStock = Number(newQty);
        changeQty = targetStock - prod.stockQty;
      } else if (delta !== undefined) {
        changeQty = Number(delta);
        targetStock = prod.stockQty + changeQty;
      } else {
        throw new AppError('INVALID_INPUT', 'Either newQty or delta must be provided', 400);
      }

      if (targetStock < 0) {
        throw new AppError('INVALID_STOCK_LEVEL', 'Stock cannot be reduced below zero', 400);
      }

      const product = await tx.product.update({
        where: { id },
        data: { stockQty: targetStock },
      });

      if (changeQty !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: id,
            changeQty,
            reason: 'MANUAL_ADJUSTMENT',
            note: note || `Inline stock update: ${prod.stockQty} -> ${targetStock}`,
            userId: req.user?.id,
          },
        });
      }

      return product;
    });

    res.json({
      data: {
        id,
        stockQty: updated.stockQty,
        message: 'Stock updated',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkProductsAction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, productIds, stockAdjustment } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new AppError('INVALID_IDS', 'productIds array is required', 400);
    }

    if (action === 'ACTIVATE') {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: true },
      });
      res.json({ data: { message: `Activated ${productIds.length} products` } });
      return;
    }

    if (action === 'DEACTIVATE') {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: false },
      });
      res.json({ data: { message: `Deactivated ${productIds.length} products` } });
      return;
    }

    if (action === 'UPDATE_STOCK' && stockAdjustment !== undefined) {
      const delta = Number(stockAdjustment);
      await prisma.$transaction(async (tx) => {
        for (const pid of productIds) {
          const prod = await tx.product.findUnique({ where: { id: pid } });
          if (!prod) continue;
          const newQty = Math.max(0, prod.stockQty + delta);
          const change = newQty - prod.stockQty;
          await tx.product.update({
            where: { id: pid },
            data: { stockQty: newQty },
          });
          if (change !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: pid,
                changeQty: change,
                reason: 'MANUAL_ADJUSTMENT',
                note: `Bulk stock adjustment (${delta >= 0 ? '+' : ''}${delta})`,
                userId: req.user?.id,
              },
            });
          }
        }
      });
      res.json({ data: { message: `Updated stock for ${productIds.length} products` } });
      return;
    }

    throw new AppError('INVALID_ACTION', 'Action must be ACTIVATE, DEACTIVATE, or UPDATE_STOCK', 400);
  } catch (error) {
    next(error);
  }
}

export async function exportProductsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { slug: true } },
        brand: { select: { name: true } },
        translations: { where: { language: 'en' }, select: { name: true } },
      },
    });

    const header = 'id,slug,partNumber,brand,category,condition,sellingPrice,costPrice,stockQty,lowStockThreshold,isActive,name_en\n';
    const rows = products.map((p) => {
      const name = (p.translations[0]?.name || '').replace(/"/g, '""');
      return `"${p.id}","${p.slug}","${p.partNumber}","${p.brand.name}","${p.category.slug}","${p.condition}",${p.sellingPrice},${p.costPrice},${p.stockQty},${p.lowStockThreshold},${p.isActive},"${name}"`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
    res.send(header + rows.join('\n'));
  } catch (error) {
    next(error);
  }
}
