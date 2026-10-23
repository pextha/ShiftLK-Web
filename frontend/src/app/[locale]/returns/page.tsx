import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Cog,
} from 'lucide-react';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

interface ReturnsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ReturnsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Returns & Warranty Policy | ShiftLK Spares Sri Lanka',
    description:
      'Our 7-day fitment verification policy and warranty guidelines for automotive replacement parts.',
  };
}

export default async function ReturnsPage({ params }: ReturnsPageProps) {
  const { locale } = await params;
  const tReturns = await getTranslations('returns');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Customer Protection Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {tReturns('title')}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {tReturns('subtitle')}
        </p>
      </div>

      {/* Policy Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            {tReturns('p1Title')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {tReturns('p1Desc')}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Cog className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            {tReturns('p2Title')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {tReturns('p2Desc')}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">
            {tReturns('p3Title')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {tReturns('p3Desc')}
          </p>
        </div>
      </div>

      {/* Support Contact Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white">
            Have a question about a received part?
          </h3>
          <p className="text-xs text-slate-400">
            Our warranty claim desk handles inquiries promptly via WhatsApp.
          </p>
        </div>

        <a
          href="https://wa.me/94770871018?text=Hello%20ShiftLK%20Spares,%20I%20have%20an%20inquiry%20regarding%20a%20part%20return%20or%20warranty%20check:"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl text-xs shadow-lg transition-all shrink-0"
        >
          <WhatsAppIcon className="w-4 h-4 text-white" />
          <span>Contact Warranty Desk</span>
        </a>
      </div>
    </div>
  );
}
