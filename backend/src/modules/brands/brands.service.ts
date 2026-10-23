import { prisma } from '../../lib/prisma';

export class BrandsService {
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
}

export const brandsService = new BrandsService();
