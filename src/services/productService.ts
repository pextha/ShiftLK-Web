import { AppLocale, ConditionType, LocalizedProduct } from '@/lib/db/schema.types';
import { SEED_CATEGORIES, SEED_RAW_PRODUCTS } from '@/lib/db/seed-data';
import { apiClient } from '@/lib/api/client';

export interface ProductFilterOptions {
  query?: string;
  categorySlug?: string;
  brand?: string;
  condition?: ConditionType | 'all';
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
}

function localizeProduct(
  raw: (typeof SEED_RAW_PRODUCTS)[0],
  locale: AppLocale = 'en'
): LocalizedProduct {
  const cat = SEED_CATEGORIES.find((c) => c.id === raw.category_id);
  const catName =
    cat?.translations[locale]?.name ||
    cat?.translations.en?.name ||
    'Spare Parts';

  const trans = raw.translations[locale] || raw.translations.en;

  // IMPORTANT: cost_price is NOT included in LocalizedProduct
  return {
    id: raw.id,
    slug: raw.slug,
    part_number: raw.part_number,
    brand: raw.brand,
    category_id: raw.category_id,
    category_slug: cat?.slug,
    category_name: catName,
    condition: raw.condition,
    selling_price: raw.selling_price,
    stock_qty: raw.stock_qty,
    weight_kg: raw.weight_kg,
    is_active: raw.is_active,
    images: raw.images,
    name: trans.name,
    description: trans.description,
    compatibility: raw.compatibility.map((c, i) => ({
      id: `${raw.id}-c-${i}`,
      product_id: raw.id,
      ...c,
    })),
    translations: raw.translations,
  };
}

export async function getProducts(
  locale: AppLocale = 'en',
  filters: ProductFilterOptions = {}
): Promise<LocalizedProduct[]> {
  try {
    const apiRes = await apiClient.getProducts({
      query: filters.query,
      category: filters.categorySlug,
      brand: filters.brand,
      condition: filters.condition,
      make: filters.make,
      model: filters.model,
      year: filters.year,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStockOnly: filters.inStockOnly,
      sortBy: filters.sortBy,
      locale,
    });

    if (apiRes && apiRes.items && apiRes.items.length > 0) {
      return apiRes.items.map((item) => ({
        id: item.id,
        slug: item.slug,
        part_number: item.part_number,
        brand: item.brand,
        category_id: item.category?.id || '',
        category_slug: item.category?.slug,
        category_name: item.category?.name || 'Spare Parts',
        condition: item.condition,
        selling_price: item.selling_price,
        stock_qty: item.stock_qty,
        weight_kg: item.weight_kg,
        is_active: item.is_active,
        images: item.images,
        name: item.name,
        description: item.description,
        compatibility: (item.compatibility || []).map((c, i) => ({
          id: `${item.id}-c-${i}`,
          product_id: item.id,
          make: c.make,
          model: c.model,
          year_from: c.year_from,
          year_to: c.year_to,
          chassis_code: c.chassis_code || undefined,
        })),
        translations: {
          en: { name: item.name, description: item.description },
          si: { name: item.name, description: item.description },
          ta: { name: item.name, description: item.description },
        },
      }));
    }
  } catch (err) {
    console.warn('ShiftLK API getProducts failed, using local seed data fallback:', err);
  }

  // Built-in seed data fallback
  let list = SEED_RAW_PRODUCTS.filter((p) => p.is_active).map((p) =>
    localizeProduct(p, locale)
  );

  // Filter: Query
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    list = list.filter((p) => {
      const matchPart = p.part_number.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCompat = p.compatibility.some(
        (c) =>
          c.make.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          (c.chassis_code && c.chassis_code.toLowerCase().includes(q))
      );
      return matchPart || matchBrand || matchName || matchDesc || matchCompat;
    });
  }

  // Filter: Category
  if (filters.categorySlug && filters.categorySlug !== 'all') {
    list = list.filter((p) => p.category_slug === filters.categorySlug);
  }

  // Filter: Brand
  if (filters.brand && filters.brand !== 'all') {
    list = list.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
  }

  // Filter: Condition
  if (filters.condition && filters.condition !== 'all') {
    list = list.filter((p) => p.condition === filters.condition);
  }

  // Filter: Vehicle Make & Model
  if (filters.make && filters.make !== 'all') {
    list = list.filter((p) =>
      p.compatibility.some((c) => c.make.toLowerCase() === filters.make?.toLowerCase())
    );
  }

  if (filters.model && filters.model !== 'all') {
    list = list.filter((p) =>
      p.compatibility.some((c) =>
        c.model.toLowerCase().includes(filters.model!.toLowerCase())
      )
    );
  }

  // Filter: Year
  if (filters.year) {
    const targetYear = filters.year;
    list = list.filter((p) =>
      p.compatibility.some(
        (c) =>
          c.year_from <= targetYear && (!c.year_to || c.year_to >= targetYear)
      )
    );
  }

  // Filter: Price Range
  if (filters.minPrice !== undefined) {
    list = list.filter((p) => p.selling_price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    list = list.filter((p) => p.selling_price <= filters.maxPrice!);
  }

  // Filter: In Stock Only
  if (filters.inStockOnly) {
    list = list.filter((p) => p.stock_qty > 0);
  }

  // Sorting
  if (filters.sortBy === 'price_asc') {
    list.sort((a, b) => a.selling_price - b.selling_price);
  } else if (filters.sortBy === 'price_desc') {
    list.sort((a, b) => b.selling_price - a.selling_price);
  } else {
    list.sort((a, b) => b.id.localeCompare(a.id));
  }

  return list;
}

export async function getProductBySlug(
  slug: string,
  locale: AppLocale = 'en'
): Promise<LocalizedProduct | null> {
  try {
    const item = await apiClient.getProductBySlug(slug, locale);
    if (item) {
      return {
        id: item.id,
        slug: item.slug,
        part_number: item.part_number,
        brand: item.brand,
        category_id: item.category?.id || '',
        category_slug: item.category?.slug,
        category_name: item.category?.name || 'Spare Parts',
        condition: item.condition,
        selling_price: item.selling_price,
        stock_qty: item.stock_qty,
        weight_kg: item.weight_kg,
        is_active: item.is_active,
        images: item.images,
        name: item.name,
        description: item.description,
        compatibility: (item.compatibility || []).map((c, i) => ({
          id: `${item.id}-c-${i}`,
          product_id: item.id,
          make: c.make,
          model: c.model,
          year_from: c.year_from,
          year_to: c.year_to,
          chassis_code: c.chassis_code || undefined,
        })),
        translations: {
          en: { name: item.name, description: item.description },
          si: { name: item.name, description: item.description },
          ta: { name: item.name, description: item.description },
        },
      };
    }
  } catch (err) {
    console.warn(`ShiftLK API getProductBySlug(${slug}) failed, falling back to local seed data:`, err);
  }

  const raw = SEED_RAW_PRODUCTS.find((p) => p.slug === slug && p.is_active);
  if (!raw) return null;
  return localizeProduct(raw, locale);
}

export async function getFeaturedProducts(
  locale: AppLocale = 'en',
  limit: number = 6
): Promise<LocalizedProduct[]> {
  const products = await getProducts(locale);
  return products.slice(0, limit);
}

export async function getAllCategories(locale: AppLocale = 'en') {
  try {
    const cats = await apiClient.getCategories();
    if (cats && cats.length > 0) {
      return cats.map((c) => ({
        id: c.id,
        slug: c.slug,
        icon: c.icon,
        name: c.translations?.[locale]?.name || c.name,
        description: c.translations?.[locale]?.description || c.description,
      }));
    }
  } catch (err) {
    console.warn('ShiftLK API getCategories failed, falling back to local seed data:', err);
  }

  return SEED_CATEGORIES.map((c) => ({
    id: c.id,
    slug: c.slug,
    icon: c.icon,
    name: c.translations[locale]?.name || c.translations.en.name,
    description: c.translations[locale]?.description || c.translations.en.description,
  }));
}

export interface SupportedBikeBrand {
  make: 'Bajaj' | 'Honda' | 'Yamaha';
  tagline: string;
  popularModels: string[];
  models: string[];
}

export const SHIFTLK_SUPPORTED_BIKES: SupportedBikeBrand[] = [
  {
    make: 'Bajaj',
    tagline: 'Pulsar, Discover, CT100 & Platina Spares',
    popularModels: ['Pulsar 150', 'Pulsar 200 NS', 'Discover 125', 'CT 100'],
    models: [
      'Pulsar 150',
      'Pulsar 180',
      'Pulsar 200 NS',
      'Pulsar 220F',
      'Discover 125',
      'Discover 100',
      'CT 100',
      'Platina 100',
      'Avenger 150/220',
      'Boxer BM 150',
    ],
  },
  {
    make: 'Honda',
    tagline: 'Dio, Hornet, Shine, Activa & XR Spares',
    popularModels: ['Dio 110', 'CB Hornet 160R', 'CB Shine 125', 'Activa 125'],
    models: [
      'Dio 110',
      'CB Hornet 160R',
      'CB Shine 125',
      'CB Trigger 150',
      'Activa 125',
      'Navi 110',
      'Grazia 125',
      'XR 150L',
      'CD 70 / Dream',
    ],
  },
  {
    make: 'Yamaha',
    tagline: 'FZ-S, R15, MT-15, RayZR & Fascino Spares',
    popularModels: ['FZ16 / FZ-S (V1/V2/V3)', 'YZF R15 (V2/V3/V4)', 'MT-15', 'RayZR 125 Fi'],
    models: [
      'FZ16 / FZ-S (V1/V2/V3)',
      'YZF R15 (V2/V3/V4)',
      'MT-15',
      'RayZR 125 Fi',
      'Fascino 125 Fi',
      'SZ-R 153',
      'FZ 25',
      'WR 155R',
      'Crux 106',
    ],
  },
];

export function getAllMakesAndModels(): { make: string; models: string[] }[] {
  const makeMap = new Map<string, Set<string>>();

  SHIFTLK_SUPPORTED_BIKES.forEach((b) => {
    makeMap.set(b.make, new Set(b.models));
  });

  SEED_RAW_PRODUCTS.forEach((p) => {
    p.compatibility.forEach((c) => {
      if (!makeMap.has(c.make)) {
        makeMap.set(c.make, new Set());
      }
      makeMap.get(c.make)!.add(c.model);
    });
  });

  const priorityOrder = ['Bajaj', 'Honda', 'Yamaha'];
  const makes: { make: string; models: string[] }[] = [];

  priorityOrder.forEach((makeName) => {
    if (makeMap.has(makeName)) {
      makes.push({
        make: makeName,
        models: Array.from(makeMap.get(makeName)!).sort(),
      });
      makeMap.delete(makeName);
    }
  });

  makeMap.forEach((models, make) => {
    makes.push({
      make,
      models: Array.from(models).sort(),
    });
  });

  return makes;
}

export async function getAllBrands(): Promise<string[]> {
  try {
    const brands = await apiClient.getBrands();
    if (brands && brands.length > 0) {
      return brands.map((b) => b.name).sort();
    }
  } catch (err) {
    console.warn('ShiftLK API getBrands failed, falling back to local seed data:', err);
  }

  const brands = Array.from(new Set(SEED_RAW_PRODUCTS.map((p) => p.brand)));
  return brands.sort();
}
