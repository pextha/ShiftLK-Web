import { prisma } from '../../lib/prisma';
import { toPublicProductDto, PublicProductDto } from '../../utils/serializers';
import { z } from 'zod';
import { getProductsQuerySchema } from './products.schema';

type FilterParams = z.infer<typeof getProductsQuerySchema>;

export class ProductsService {
  async getProducts(params: FilterParams): Promise<{
    data: PublicProductDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      query,
      category,
      brand,
      condition,
      make,
      model,
      year,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy,
      page,
      limit,
      locale,
    } = params;

    const where: any = {
      isActive: true,
    };

    if (condition && condition !== 'all') {
      where.condition = condition.toUpperCase();
    }

    if (inStockOnly) {
      where.stockQty = { gt: 0 };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.sellingPrice = {};
      if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
      if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
    }

    if (category && category !== 'all') {
      where.category = { slug: category };
    }

    if (brand && brand !== 'all') {
      where.brand = {
        OR: [
          { slug: brand.toLowerCase() },
          { name: { contains: brand } },
        ],
      };
    }

    // Vehicle compatibility filters
    if (make || model || year) {
      const compWhere: any = {};
      if (make && make !== 'all') compWhere.make = { equals: make };
      if (model && model !== 'all') compWhere.model = { contains: model };
      if (year) {
        compWhere.yearFrom = { lte: year };
        compWhere.OR = [
          { yearTo: null },
          { yearTo: { gte: year } },
        ];
      }
      where.compatibilities = { some: compWhere };
    }

    // Search query: search part number, translations, or compatible models
    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { partNumber: { contains: q } },
        { slug: { contains: q } },
        {
          translations: {
            some: {
              OR: [
                { name: { contains: q } },
                { description: { contains: q } },
              ],
            },
          },
        },
        {
          compatibilities: {
            some: {
              OR: [
                { make: { contains: q } },
                { model: { contains: q } },
                { chassisCode: { contains: q } },
              ],
            },
          },
        },
        {
          brand: {
            name: { contains: q },
          },
        },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { sellingPrice: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { sellingPrice: 'desc' };
    }

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            include: { translations: true },
          },
          brand: true,
          translations: true,
          images: true,
          compatibilities: true,
        },
      }),
    ]);

    const data = rawProducts.map((p) => toPublicProductDto(p, locale));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getProductBySlug(slug: string, locale: string = 'en'): Promise<PublicProductDto | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: { translations: true },
        },
        brand: true,
        translations: true,
        images: true,
        compatibilities: true,
      },
    });

    if (!product || !product.isActive) {
      return null;
    }

    return toPublicProductDto(product, locale);
  }
}

export const productsService = new ProductsService();
