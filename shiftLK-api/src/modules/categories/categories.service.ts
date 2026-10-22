import { prisma } from '../../lib/prisma';

export class CategoriesService {
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
}

export const categoriesService = new CategoriesService();
