import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { AppLocale } from '@/lib/db/schema.types';
import {
  getAllCategories,
  getFeaturedProducts,
} from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';
import HeroVideoAmbience from '@/components/home/HeroVideoAmbience';
import {
  Wrench,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  Flame,
  Palette,
  Shield,
  Bike,
  ShoppingBag,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;

  const [tHome, tCommon, categories, featuredProducts] = await Promise.all([
    getTranslations('home'),
    getTranslations('common'),
    getAllCategories(appLocale),
    getFeaturedProducts(appLocale, 8),
  ]);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'indian-bike-spares':
        return <Wrench className="w-6 h-6 text-brand-neon" />;
      case 'modification-parts':
        return <Flame className="w-6 h-6 text-brand-neon" />;
      case 'body-stickers':
        return <Palette className="w-6 h-6 text-brand-neon" />;
      case 'helmets-riding-gear':
        return <Shield className="w-6 h-6 text-brand-neon" />;
      default:
        return <Bike className="w-6 h-6 text-brand-neon" />;
    }
  };

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-16">
      {/* Full-Viewport Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[calc(100dvh-148px)] flex items-center justify-center py-16 sm:py-24 border-b border-slate-800">
        {/* Dual-side Ambient TikTok / Shorts Background Video Engine */}
        <HeroVideoAmbience />

        {/* Subtle decorative background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-neon/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-3xl mx-auto text-center space-y-5 sm:space-y-7">
            {/* Hero Brand Emblem Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-brand-neon/40 text-brand-neon text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-neon/10 backdrop-blur-md">
              <Image
                src="/assets/shiftlk-emblem.png"
                alt="ShiftLK Emblem"
                width={20}
                height={20}
                className="rounded-full ring-1 ring-brand-neon/50"
              />
              <span className="tracking-wide">PRECIOUS PARTS FOR EVERY RIDE</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {tHome('heroTitle')}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {tHome('heroSubtitle')}
            </p>

            {/* Primary CTA: Place Your Order -> Smooth scrolls to Explore By Category */}
            <div className="pt-4 flex justify-center">
              <a
                href="#explore-categories"
                className="btn-neon group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm sm:text-base font-black shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_40px_rgba(204,255,0,0.5)] transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{tHome('placeYourOrder')}</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Islandwide Delivery Highlight Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 border border-brand-neon/20 text-brand-neon flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white">
                {tCommon('islandwideDelivery')} (25 Sri Lankan Districts)
              </div>
              <div className="text-xs text-slate-400">
                Courier (≤ 1kg): Rs. 425 (+Rs. 100/kg) • Stickers via SL Speed Post: Rs. 220 (&lt; 250g)
              </div>
            </div>
          </div>

          <Link
            href="/delivery"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            <span>View All District Rates</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section
        id="explore-categories"
        className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 w-full"
      >
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {tHome('categoriesTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {tHome('categoriesSubtitle')}
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-brand-neon hover:underline"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative flex flex-col p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-neon/60 hover:shadow-[0_0_25px_rgba(204,255,0,0.12)] transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-brand-neon/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-brand-neon/40 transition-transform shadow-sm">
                {getCategoryIcon(cat.slug)}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-brand-neon transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs font-semibold text-brand-neon group-hover:translate-x-1 transition-transform">
                <span>Browse Products</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                In Stock & Ready to Dispatch
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {tHome('featuredTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {tHome('featuredSubtitle')}
            </p>
          </div>

          <Link
            href="/products"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-neon hover:text-brand-neon-hover transition-colors"
          >
            <span>{tHome('viewAllParts')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
            <p className="text-sm text-slate-300 font-medium">
              New spares inventory is being updated. Inquire directly or search by bike model.
            </p>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold py-3 px-6 rounded-xl text-xs w-full justify-center"
          >
            <span>{tHome('viewAllParts')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Custom WhatsApp Part Finder CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-3xl p-6 sm:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Undurugoda Hotline</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {tHome('ctaTitle')}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {tHome('ctaSubtitle')}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="https://wa.me/94770871018?text=Hello%20ShiftLK%20Spares,%20I%20am%20looking%20for%20a%20spare%20part%20for%20my%20vehicle:"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-950/60 text-sm transition-all"
              >
                <WhatsAppIcon className="w-5 h-5 text-white" />
                <span>{tHome('ctaButton')}</span>
              </a>

              <span className="text-xs text-slate-400 text-center sm:text-left">
                Typically replies in &lt; 5 minutes during business hours
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ShiftLK Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          {tHome('whyUsTitle')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Polgasowita Motorbike Hub
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct access to Sri Lanka&apos;s leading motorbike network in Polgasowita, specializing in genuine Indian bike spares (Bajaj, Yamaha), custom modification parts, body stickers, and helmets.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              7-Day Fitment Guarantee
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Check and verify your parts with your mechanic. If an item does not fit your vehicle specifications, our team replaces it promptly.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Clear 25 Districts Delivery Rates
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No surprise shipping fees. Select your district on any product page for live delivery fee calculations before placing your WhatsApp order.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
