import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AppLocale, ConditionType } from '@/lib/db/schema.types';
import {
  getAllBrands,
  getAllCategories,
  getAllMakesAndModels,
  getProducts,
} from '@/services/productService';
import ProductFilterBar from '@/components/products/ProductFilterBar';
import ProductCard from '@/components/products/ProductCard';
import { Wrench, AlertCircle } from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    condition?: string;
    make?: string;
    model?: string;
    year?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: 'Motorbike Spare Parts & Accessories Catalog | ShiftLK Spares',
    si: 'මෝටර්බයික් අමතර කොටස් නාමාවලිය | ShiftLK Spares',
    ta: 'மோட்டார் பைக் உதிரிப்பாகங்கள் பட்டியல் | ShiftLK Spares',
  };
  return {
    title: titles[locale] || titles.en,
    description:
      'Browse verified motorbike parts for Bajaj, Yamaha, TVS, Honda, custom modification parts, body stickers & helmets with islandwide delivery.',
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const sParams = await searchParams;

  const tFilters = await getTranslations('filters');
  const tSearch = await getTranslations('search');

  // Filter options
  const categories = await getAllCategories(appLocale);
  const brands = await getAllBrands();
  const makesAndModels = getAllMakesAndModels();

  // Execute query
  const products = await getProducts(appLocale, {
    query: sParams.q,
    categorySlug: sParams.category,
    brand: sParams.brand,
    condition: sParams.condition as ConditionType | 'all',
    make: sParams.make,
    model: sParams.model,
    year: sParams.year ? parseInt(sParams.year) : undefined,
    minPrice: sParams.minPrice ? parseFloat(sParams.minPrice) : undefined,
    maxPrice: sParams.maxPrice ? parseFloat(sParams.maxPrice) : undefined,
    inStockOnly: sParams.inStock === 'true',
    sortBy: sParams.sort,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Motorbike Spare Parts & Accessories Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Genuine OEM Indian bike spares (Bajaj, Yamaha), custom modification parts, body stickers, and certified helmets.
          </p>
        </div>
      </div>

      {/* Filter and search controls */}
      <ProductFilterBar
        categories={categories}
        brands={brands}
        makesAndModels={makesAndModels}
        totalResults={products.length}
      />

      {/* Product Grid or Empty State */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-neon/10 text-brand-neon border border-brand-neon/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {tSearch('noResults')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {tSearch('noResultsDesc')}
            </p>
          </div>

          <div className="pt-2">
            <a
              href="https://wa.me/94770871018?text=Hello%20ShiftLK%20Spares,%20I%20am%20looking%20for%20a%20part%20that%20is%20not%20in%20the%20catalog:"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl text-xs shadow-lg transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>{tSearch('askOnWhatsApp')}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
