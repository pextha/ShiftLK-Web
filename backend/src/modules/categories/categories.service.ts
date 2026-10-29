import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export class CategoriesService {
  /**
   * Public category listing with locale fallback (en -> first available)
   */
  async getAllCategories(locale: string = 'en') {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: { translations: true },
    });

    return categories.map((cat) => {
      const activeTrans =
        cat.translations.find((t) => t.language === locale) ||
        cat.translations.find((t) => t.language === 'en') ||
        cat.translations[0];

      return {
        id: cat.id,
        slug: cat.slug,
        icon: cat.icon,
        name: activeTrans ? activeTrans.name : cat.slug,
        description: activeTrans ? activeTrans.description : null,
      };
    });
  }

  /**
   * Admin category listing with full translations and linked products count
   */
  async getAdminCategories() {
    const categories = await prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        translations: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((cat) => {
      const translationsMap: Record<string, { name: string; description: string | null }> = {};
      cat.translations.forEach((t) => {
        translationsMap[t.language] = {
          name: t.name,
          description: t.description,
        };
      });

      const enTrans = cat.translations.find((t) => t.language === 'en');

      return {
        id: cat.id,
        slug: cat.slug,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        name: enTrans?.name || cat.slug,
        description: enTrans?.description || null,
        translations: cat.translations,
        translationsMap,
        productsCount: cat._count.products,
      };
    });
  }

  /**
   * Get single category details for admin
   */
  async getAdminCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    const translationsMap: Record<string, { name: string; description: string | null }> = {};
    category.translations.forEach((t) => {
      translationsMap[t.language] = {
        name: t.name,
        description: t.description,
      };
    });

    return {
      id: category.id,
      slug: category.slug,
      icon: category.icon,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      translations: category.translations,
      translationsMap,
      productsCount: category._count.products,
    };
  }

  /**
   * Create a category with trilingual translations atomically
   */
  async createCategory(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new AppError('SLUG_EXISTS', `A category with slug "${input.slug}" already exists`, 409);
    }

    return await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          slug: input.slug,
          icon: input.icon || 'Wrench',
          displayOrder: input.displayOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      });

      // Prepare translation records
      const translationRecords: Array<{
        categoryId: string;
        language: string;
        name: string;
        description: string | null;
      }> = [
        {
          categoryId: category.id,
          language: 'en',
          name: input.translations.en.name,
          description: input.translations.en.description || null,
        },
      ];

      if (input.translations.si?.name && input.translations.si.name.trim() !== '') {
        translationRecords.push({
          categoryId: category.id,
          language: 'si',
          name: input.translations.si.name.trim(),
          description: input.translations.si.description?.trim() || null,
        });
      }

      if (input.translations.ta?.name && input.translations.ta.name.trim() !== '') {
        translationRecords.push({
          categoryId: category.id,
          language: 'ta',
          name: input.translations.ta.name.trim(),
          description: input.translations.ta.description?.trim() || null,
        });
      }

      await tx.categoryTranslation.createMany({
        data: translationRecords,
      });

      const fullCategory = await tx.category.findUnique({
        where: { id: category.id },
        include: {
          translations: true,
          _count: { select: { products: true } },
        },
      });

      return fullCategory;
    });
  }

  /**
   * Update category metadata and translations atomically
   */
  async updateCategory(id: string, input: UpdateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!existing) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await prisma.category.findUnique({
        where: { slug: input.slug },
      });
      if (slugConflict && slugConflict.id !== id) {
        throw new AppError('SLUG_EXISTS', `A category with slug "${input.slug}" already exists`, 409);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update Category record
      await tx.category.update({
        where: { id },
        data: {
          ...(input.slug ? { slug: input.slug } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
          ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      // 2. Upsert translations if provided
      if (input.translations) {
        if (input.translations.en?.name) {
          await tx.categoryTranslation.upsert({
            where: {
              categoryId_language: { categoryId: id, language: 'en' },
            },
            update: {
              name: input.translations.en.name,
              description: input.translations.en.description ?? null,
            },
            create: {
              categoryId: id,
              language: 'en',
              name: input.translations.en.name,
              description: input.translations.en.description ?? null,
            },
          });
        }

        if (input.translations.si?.name) {
          await tx.categoryTranslation.upsert({
            where: {
              categoryId_language: { categoryId: id, language: 'si' },
            },
            update: {
              name: input.translations.si.name,
              description: input.translations.si.description ?? null,
            },
            create: {
              categoryId: id,
              language: 'si',
              name: input.translations.si.name,
              description: input.translations.si.description ?? null,
            },
          });
        }

        if (input.translations.ta?.name) {
          await tx.categoryTranslation.upsert({
            where: {
              categoryId_language: { categoryId: id, language: 'ta' },
            },
            update: {
              name: input.translations.ta.name,
              description: input.translations.ta.description ?? null,
            },
            create: {
              categoryId: id,
              language: 'ta',
              name: input.translations.ta.name,
              description: input.translations.ta.description ?? null,
            },
          });
        }
      }

      const updated = await tx.category.findUnique({
        where: { id },
        include: {
          translations: true,
          _count: { select: { products: true } },
        },
      });

      return updated;
    });
  }

  /**
   * Delete category safely (blocks deletion if active products are linked)
   */
  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    if (category._count.products > 0) {
      throw new AppError(
        'CATEGORY_HAS_PRODUCTS',
        `Cannot delete category "${category.slug}" because it contains ${category._count.products} linked product(s). Please reassign or delete these products first.`,
        400
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return { success: true, message: `Category "${category.slug}" successfully deleted.` };
  }
}

export const categoriesService = new CategoriesService();
