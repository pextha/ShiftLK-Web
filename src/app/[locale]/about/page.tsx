import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  Wrench,
  CheckCircle2,
  MapPin,
  Truck,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'About Us | ShiftLK Spares Sri Lanka',
    description:
      'Learn about ShiftLK Spares, our direct sourcing hub in Undurugoda, Polgasowita, and our mission to provide verified auto spare parts islandwide.',
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const tAbout = await getTranslations('about');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-neon/10 border border-brand-neon/30 text-brand-neon text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-brand-neon/10">
          <Building className="w-3.5 h-3.5" />
          <span>Automotive Spare Parts Network</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {tAbout('title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {tAbout('subtitle')}
        </p>
      </div>

      {/* Story & Mission */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <Wrench className="w-6 h-6 text-brand-neon" />
          <span>{tAbout('storyTitle')}</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {tAbout('storyText')}
        </p>
      </div>

      {/* Distinctive Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">
          {tAbout('featuresTitle')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {tAbout('feature1')}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {tAbout('feature2')}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {tAbout('feature3')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
