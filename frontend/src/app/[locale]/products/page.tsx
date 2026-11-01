import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AppLocale, ConditionType } from '@/lib/db/schema.types';
import {
  getAllBrands,
  getAllCategories,
  getAllMakesAndModels,
  getPaginatedProducts,
} from '@/services/productService';
import ProductFilterBar from '@/components/products/ProductFilterBar';
import ProductCard from '@/components/products/ProductCard';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
    page?: string;
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

  const tSearch = await getTranslations('search');

  const currentPage = Math.max(1, parseInt(sParams.page || '1', 10) || 1);
  const pageSize = 12;

  // Filter options & paginated query
  const [categories, brands, paginatedResult] = await Promise.all([
    getAllCategories(appLocale),
    getAllBrands(),
    getPaginatedProducts(appLocale, {
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
      page: currentPage,
      limit: pageSize,
    }),
  ]);

  const products = paginatedResult.items;
  const pagination = paginatedResult.pagination;
  const makesAndModels = getAllMakesAndModels(products);

  const buildPageHref = (targetPage: number) => {
    const query = new URLSearchParams();
    if (sParams.q) query.set('q', sParams.q);
    if (sParams.category) query.set('category', sParams.category);
    if (sParams.brand) query.set('brand', sParams.brand);
    if (sParams.condition) query.set('condition', sParams.condition);
    if (sParams.make) query.set('make', sParams.make);
    if (sParams.model) query.set('model', sParams.model);
    if (sParams.year) query.set('year', sParams.year);
    if (sParams.minPrice) query.set('minPrice', sParams.minPrice);
    if (sParams.maxPrice) query.set('maxPrice', sParams.maxPrice);
    if (sParams.inStock) query.set('inStock', sParams.inStock);
    if (sParams.sort) query.set('sort', sParams.sort);
    if (targetPage > 1) query.set('page', String(targetPage));
    const qs = query.toString();
    return `/products${qs ? `?${qs}` : ''}`;
  };

  const pageNumbers: number[] = [];
  for (let i = 1; i <= pagination.totalPages; i++) {
    pageNumbers.push(i);
  }

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
        totalResults={pagination.total}
      />

      {/* Product Grid or Empty State */}
      {products.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#1d273a]">
              <p className="text-xs text-slate-400">
                Showing page <span className="font-bold text-white">{pagination.page}</span> of{' '}
                <span className="font-bold text-white">{pagination.totalPages}</span> (
                {pagination.total} parts total)
              </p>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {pagination.page > 1 ? (
                  <Link
                    href={buildPageHref(pagination.page - 1)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0b0f19] hover:bg-[#141b2b] border border-[#212c42] text-xs font-bold text-slate-200 hover:text-[#ccff00] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0b0f19]/50 border border-[#1d273a] text-xs font-bold text-slate-600 cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </span>
                )}

                {pageNumbers.map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={buildPageHref(pageNum)}
                    className={`w-9 h-9 inline-flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                      pageNum === pagination.page
                        ? 'bg-[#ccff00] text-black shadow-md shadow-[#ccff00]/20'
                        : 'bg-[#0b0f19] hover:bg-[#141b2b] border border-[#212c42] text-slate-300 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}

                {pagination.page < pagination.totalPages ? (
                  <Link
                    href={buildPageHref(pagination.page + 1)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0b0f19] hover:bg-[#141b2b] border border-[#212c42] text-xs font-bold text-slate-200 hover:text-[#ccff00] transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0b0f19]/50 border border-[#1d273a] text-xs font-bold text-slate-600 cursor-not-allowed">
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          )}
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
