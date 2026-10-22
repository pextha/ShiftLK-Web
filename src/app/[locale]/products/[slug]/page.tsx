import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { AppLocale } from '@/lib/db/schema.types';
import { getProductBySlug } from '@/services/productService';
import { getDeliveryZones } from '@/services/deliveryService';
import ProductGallery from '@/components/products/ProductGallery';
import LiveOrderSummary from '@/components/products/LiveOrderSummary';
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  Car,
  Wrench,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface ProductPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, locale as AppLocale);

  if (!product) {
    return { title: 'Product Not Found | ShiftLK Spares' };
  }

  const primaryImage = product.images?.[0];

  return {
    title: `${product.name} (Part: ${product.part_number})`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | ShiftLK Spares Sri Lanka`,
      description: product.description.slice(0, 160),
      images: primaryImage ? [{ url: primaryImage, width: 800, height: 600 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 160),
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;

  const product = await getProductBySlug(slug, appLocale);
  if (!product) {
    notFound();
  }

  const deliveryZones = await getDeliveryZones();
  const tProd = await getTranslations('product');
  const tFilters = await getTranslations('filters');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        <Link href="/products" className="hover:text-white transition-colors">
          Spare Parts
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        {product.category_slug && (
          <>
            <Link
              href={`/products?category=${product.category_slug}`}
              className="hover:text-white transition-colors"
            >
              {product.category_name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          </>
        )}
        <span className="text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Image Gallery (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <ProductGallery images={product.images} productName={product.name} />

          {/* Product Specifications & Full Description */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-neon" />
                <span>{tProd('description')}</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quick Specs Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-0.5">{tProd('brand')}</div>
                <div className="font-bold text-white">{product.brand}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-0.5">{tProd('partNumber')}</div>
                <div className="font-mono font-bold text-brand-neon">
                  {product.part_number}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-0.5">{tProd('condition')}</div>
                <div className="font-bold text-white capitalize">
                  {tFilters(product.condition)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-0.5">{tProd('weight')}</div>
                <div className="font-bold text-white">
                  {product.weight_kg} {tProd('kg')}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-0.5">Sourcing Location</div>
                <div className="font-bold text-white">Undurugoda, Polgasowita</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-0.5">Warranty</div>
                <div className="font-bold text-emerald-400">7-Day Fitment Check</div>
              </div>
            </div>

            {/* Vehicle Compatibility Section */}
            {product.compatibility && product.compatibility.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-brand-neon" />
                  <span>{tProd('vehicleCompatibility')}</span>
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">{tProd('make')}</th>
                        <th className="px-4 py-3">{tProd('model')}</th>
                        <th className="px-4 py-3">{tProd('yearRange')}</th>
                        <th className="px-4 py-3">Chassis Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {product.compatibility.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-850/50">
                          <td className="px-4 py-2.5 font-bold text-white">
                            {c.make}
                          </td>
                          <td className="px-4 py-2.5">{c.model}</td>
                          <td className="px-4 py-2.5">
                            {c.year_from} - {c.year_to ? c.year_to : 'Present'}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-brand-neon font-semibold">
                            {c.chassis_code || 'All Variants'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Calculation & WhatsApp Gateway (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-brand-neon bg-brand-neon/10 border border-brand-neon/30 px-2.5 py-1 rounded-lg">
                {product.brand}
              </span>
              <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                OEM: {product.part_number}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Live Order Summary & District Calculation Card */}
          <LiveOrderSummary
            product={product}
            deliveryZones={deliveryZones}
          />

          {/* Direct WhatsApp Fitment Inquiries Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Not Sure If It Fits Your Car?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send your vehicle registration book photo or chassis code (CR / V5) to our technicians on WhatsApp. We will cross-check the exact OEM parts catalog.
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/94770871018?text=${encodeURIComponent(
                `Hello ShiftLK Spares, I want to verify if part "${product.name}" (Part No: ${product.part_number}) fits my vehicle.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              <span>{tProd('consultSpecialist')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
