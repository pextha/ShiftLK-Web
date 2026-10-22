import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { AppLocale } from '@/lib/db/schema.types';
import {
  getAllCategories,
  getAllMakesAndModels,
  getFeaturedProducts,
  SHIFTLK_SUPPORTED_BIKES,
} from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';
import HeroVideoAmbience from '@/components/home/HeroVideoAmbience';
import {
  Wrench,
  Search,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Car,
  ChevronRight,
  Disc,
  Cog,
  Zap,
  Sparkles,
  Flame,
  Palette,
  Shield,
  Bike,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;

  const tHome = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const tSearch = await getTranslations('search');

  const categories = await getAllCategories(appLocale);
  const featuredProducts = await getFeaturedProducts(appLocale, 8);
  const makesAndModels = getAllMakesAndModels();

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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 sm:py-20 border-b border-slate-800">
        {/* Dual-side Ambient TikTok / Shorts Background Video Engine */}
        <HeroVideoAmbience />

        {/* Subtle decorative background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-neon/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
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

            {/* Quick Vehicle Make Filter Bar */}
            <div className="pt-2">
              <div className="bg-slate-900/95 border border-slate-700/80 p-3 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-2xl mx-auto">
                <div className="text-xs font-bold text-slate-400 mb-2.5 text-left flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-brand-neon" />
                  <span>Quick Finder by Brand & Model:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SHIFTLK_SUPPORTED_BIKES.map((brand) => (
                    <Link
                      key={brand.make}
                      href={`/products?make=${encodeURIComponent(brand.make)}`}
                      className="flex flex-col p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-neon/60 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] hover:bg-slate-850/90 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white group-hover:text-brand-neon transition-colors">
                          {brand.make}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-neon group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300">
                        {brand.popularModels.slice(0, 3).join(', ')}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Bajaj (Pulsar, CT100) • Honda (Dio, Hornet, Shine) • Yamaha (FZ-S, R15, RayZR)
                  </span>
                  <Link
                    href="/products"
                    className="text-brand-neon font-bold hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>{tHome('viewAllParts')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Islandwide Delivery Highlight Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
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

      {/* Motorcycle Categorisation Section (Bajaj, Honda, Yamaha) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-neon">
                Motorbike Categorisation
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Select Your Bike by Brand & Model
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Genuine mechanical spares, modifications, body sticker kits, and accessories tailored for Bajaj, Honda, and Yamaha.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-brand-neon hover:underline"
          >
            <span>View All Bikes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHIFTLK_SUPPORTED_BIKES.map((bike) => (
            <div
              key={bike.make}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-brand-neon/30 text-brand-neon flex items-center justify-center font-black text-sm">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {bike.make}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {bike.tagline}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/products?make=${encodeURIComponent(bike.make)}`}
                    className="text-xs font-bold text-brand-neon hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="pt-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Supported Models:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {bike.models.map((model) => (
                      <Link
                        key={model}
                        href={`/products?make=${encodeURIComponent(bike.make)}&model=${encodeURIComponent(model)}`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-neon hover:text-brand-neon hover:bg-slate-850 text-slate-300 transition-colors"
                      >
                        {model}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <Link
                  href={`/products?make=${encodeURIComponent(bike.make)}`}
                  className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-brand-neon transition-colors group"
                >
                  <span>Explore all {bike.make} parts & models</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold py-3 px-6 rounded-xl text-xs w-full justify-center"
          >
            <span>{tHome('viewAllParts')} (12 Parts Available)</span>
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
