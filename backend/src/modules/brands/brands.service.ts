import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { auditService } from '../audit/audit.service';
import { CreateBrandInput, UpdateBrandInput } from './brands.schema';

export class BrandsService {
  /**
   * Public active brands list
   */
  async getAllBrands() {
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
      },
    });
  }

  /**
   * Admin brands list with product counts
   */
  async getAdminBrands() {
    const brands = await prisma.brand.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return brands.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      country: b.country,
      isActive: b.isActive,
      createdAt: b.createdAt,
      productsCount: b._count.products,
    }));
  }

  /**
   * Single brand details for admin
   */
  async getAdminBrandById(id: string) {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 404);
    }

    return {
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      country: brand.country,
      isActive: brand.isActive,
      createdAt: brand.createdAt,
      productsCount: brand._count.products,
    };
  }

  /**
   * Create a new brand
   */
  async createBrand(input: CreateBrandInput, userId?: string, ipAddress?: string) {
    const existing = await prisma.brand.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new AppError('SLUG_EXISTS', `A brand with slug "${input.slug}" already exists`, 409);
    }

    const brand = await prisma.brand.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        country: input.country?.trim() || null,
        isActive: input.isActive ?? true,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    await auditService.log({
      userId,
      action: 'CREATE_BRAND',
      entityType: 'Brand',
      entityId: brand.id,
      newValues: { name: brand.name, slug: brand.slug, country: brand.country, isActive: brand.isActive },
      ipAddress,
    });

    return {
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      country: brand.country,
      isActive: brand.isActive,
      createdAt: brand.createdAt,
      productsCount: brand._count.products,
    };
  }

  /**
   * Update an existing brand
   */
  async updateBrand(id: string, input: UpdateBrandInput, userId?: string, ipAddress?: string) {
    const existing = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 404);
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await prisma.brand.findUnique({
        where: { slug: input.slug },
      });
      if (slugConflict && slugConflict.id !== id) {
        throw new AppError('SLUG_EXISTS', `A brand with slug "${input.slug}" already exists`, 409);
      }
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
        ...(input.country !== undefined ? { country: input.country ? input.country.trim() : null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    await auditService.log({
      userId,
      action: 'UPDATE_BRAND',
      entityType: 'Brand',
      entityId: id,
      oldValues: {
        name: existing.name,
        slug: existing.slug,
        country: existing.country,
        isActive: existing.isActive,
      },
      newValues: {
        name: updated.name,
        slug: updated.slug,
        country: updated.country,
        isActive: updated.isActive,
      },
      ipAddress,
    });

    return {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      country: updated.country,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      productsCount: updated._count.products,
    };
  }

  /**
   * Delete brand safely (prevent deletion if products are linked)
   */
  async deleteBrand(id: string, userId?: string, ipAddress?: string) {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 404);
    }

    if (brand._count.products > 0) {
      throw new AppError(
        'BRAND_HAS_PRODUCTS',
        `Cannot delete brand "${brand.name}" because it is linked to ${brand._count.products} product(s). Please reassign or delete these products first.`,
        400
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    await auditService.log({
      userId,
      action: 'DELETE_BRAND',
      entityType: 'Brand',
      entityId: id,
      oldValues: { name: brand.name, slug: brand.slug, country: brand.country },
      ipAddress,
    });

    return { success: true, message: `Brand "${brand.name}" successfully deleted.` };
  }
}

export const brandsService = new BrandsService();
