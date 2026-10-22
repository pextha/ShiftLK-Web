import { AppLocale, ConditionType, LocalizedProduct } from '@/lib/db/schema.types';
import { SEED_CATEGORIES, SEED_RAW_PRODUCTS } from '@/lib/db/seed-data';
import { isSupabaseConfigured, supabase } from '@/lib/db/supabase';

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

  // IMPORTANT: Notice cost_price is NOT included in the returned LocalizedProduct object!
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
  // If Supabase is configured, we can query Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          slug,
          part_number,
          brand,
          category_id,
          condition,
          selling_price,
          stock_qty,
          weight_kg,
          is_active,
          images,
          created_at,
          updated_at,
          categories (slug, category_translations (language, name)),
          product_translations (language, name, description),
          vehicle_compatibility (id, make, model, year_from, year_to, chassis_code)
        `)
        .eq('is_active', true);

      if (filters.condition && filters.condition !== 'all') {
        query = query.eq('condition', filters.condition);
      }
      if (filters.inStockOnly) {
        query = query.gt('stock_qty', 0);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('selling_price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('selling_price', filters.maxPrice);
      }

      if (filters.sortBy === 'price_asc') {
        query = query.order('selling_price', { ascending: true });
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('selling_price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Map Supabase rows to LocalizedProduct
        return data.map((item: any) => {
          const trans =
            item.product_translations?.find((t: any) => t.language === locale) ||
            item.product_translations?.find((t: any) => t.language === 'en') ||
            {};
          const catTrans =
            item.categories?.category_translations?.find(
              (ct: any) => ct.language === locale
            ) ||
            item.categories?.category_translations?.find(
              (ct: any) => ct.language === 'en'
            );

          return {
            id: item.id,
            slug: item.slug,
            part_number: item.part_number,
            brand: item.brand,
            category_id: item.category_id,
            category_slug: item.categories?.slug,
            category_name: catTrans?.name || 'Spare Parts',
            condition: item.condition,
            selling_price: Number(item.selling_price),
            stock_qty: item.stock_qty,
            weight_kg: Number(item.weight_kg),
            is_active: item.is_active,
            images: item.images || [],
            name: trans.name || item.slug,
            description: trans.description || '',
            compatibility: item.vehicle_compatibility || [],
            translations: {
              en: item.product_translations?.find((t: any) => t.language === 'en') || { name: '', description: '' },
              si: item.product_translations?.find((t: any) => t.language === 'si') || { name: '', description: '' },
              ta: item.product_translations?.find((t: any) => t.language === 'ta') || { name: '', description: '' },
            },
          };
        });
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to seed repository', e);
    }
  }

  // Fallback to high-performance local seed data
  let list = SEED_RAW_PRODUCTS.filter((p) => p.is_active).map((p) =>
    localizeProduct(p, locale)
  );

  // Filter: Query (part number, brand, title, description, model)
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
      p.compatibility.some(
        (c) => c.make.toLowerCase() === filters.make?.toLowerCase()
      )
    );
  }

  if (filters.model && filters.model !== 'all') {
    list = list.filter((p) =>
      p.compatibility.some((c) =>
        c.model.toLowerCase().includes(filters.model!.toLowerCase())
      )
    );
  }

  if (filters.year) {
    list = list.filter((p) =>
      p.compatibility.some((c) => {
        const matchesFrom = c.year_from <= filters.year!;
        const matchesTo = !c.year_to || c.year_to >= filters.year!;
        return matchesFrom && matchesTo;
      })
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
    // Newest
    list.sort((a, b) => b.id.localeCompare(a.id));
  }

  return list;
}

export async function getProductBySlug(
  slug: string,
  locale: AppLocale = 'en'
): Promise<LocalizedProduct | null> {
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
  // Pre-seeded with Bajaj, Honda, and Yamaha
  const makeMap = new Map<string, Set<string>>();

  SHIFTLK_SUPPORTED_BIKES.forEach((b) => {
    makeMap.set(b.make, new Set(b.models));
  });

  // Also include any models present in current active products
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

  // Add priority brands in exact requested order
  priorityOrder.forEach((makeName) => {
    if (makeMap.has(makeName)) {
      makes.push({
        make: makeName,
        models: Array.from(makeMap.get(makeName)!).sort(),
      });
      makeMap.delete(makeName);
    }
  });

  // Add any remaining makes alphabetically
  makeMap.forEach((models, make) => {
    makes.push({
      make,
      models: Array.from(models).sort(),
    });
  });

  return makes;
}

export function getAllBrands() {
  const brands = Array.from(new Set(SEED_RAW_PRODUCTS.map((p) => p.brand)));
  return brands.sort();
}
