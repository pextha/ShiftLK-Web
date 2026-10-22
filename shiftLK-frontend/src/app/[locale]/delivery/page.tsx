import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getDeliveryZones } from '@/services/deliveryService';
import { formatLKR } from '@/lib/utils/currency';
import { AppLocale } from '@/lib/db/schema.types';
import {
  Truck,
  Clock,
  ShieldCheck,
  AlertCircle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface DeliveryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DeliveryPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Islandwide Delivery Rates (All 25 Districts) | ShiftLK Spares',
    description:
      'Fast doorstep delivery across Colombo, Kandy, Galle, Jaffna and all 25 Sri Lankan districts. Transparent flat delivery rates.',
  };
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;

  const tDelivery = await getTranslations('delivery');
  const zones = await getDeliveryZones();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-brand-neon/10 border border-brand-neon/30 text-brand-neon text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-brand-neon/10">
          <Truck className="w-3.5 h-3.5" />
          <span>All 25 Sri Lankan Districts Covered</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {tDelivery('title')}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {tDelivery('subtitle')}
        </p>
      </div>

      {/* Highlights: Standard Courier vs SL Speed Post Stickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5 text-brand-neon font-bold text-base">
            <Truck className="w-5 h-5 text-brand-neon" />
            <span>Standard Islandwide Courier (Parts & Gear)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Fast, reliable doorstep courier delivery to all 25 districts in Sri Lanka for spare parts, modification items, and helmets.
          </p>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">First 1.0 kg (Flat Rate):</span>
              <span className="text-brand-neon font-mono font-bold text-sm">Rs. 425.00</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-850 pt-1.5">
              <span className="text-slate-400">Each additional 1.0 kg:</span>
              <span className="text-emerald-400 font-mono font-bold">+Rs. 100.00 / kg</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Estimated: 1-2 Working Days (Western) • 2-3 Working Days (Outstation)
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Special Stickers Courier (SL Speed Post)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Economical islandwide courier through Sri Lanka Post Speed Post specifically for motorcycle body stickers and graphics.
          </p>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Under 250g (Any Quantity):</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">Rs. 220.00</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-850 pt-1.5">
              <span className="text-slate-400">Service:</span>
              <span className="text-slate-300 font-medium">SL Speed Post Courier</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Order multiple sticker cards or sheets under 250g for just Rs. 220 islandwide!
            </div>
          </div>
        </div>
      </div>

      {/* Complete 25 Districts Delivery Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-neon" />
            <span>Official 25 Districts Delivery Rates</span>
          </h2>
          <span className="text-xs text-slate-400">
            Standard Courier (1 kg): Rs. 425 • +Rs. 100/kg extra
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs sm:text-sm text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3.5">{tDelivery('tableDistrict')}</th>
                <th className="px-5 py-3.5">Province</th>
                <th className="px-5 py-3.5">Standard Courier (≤ 1kg)</th>
                <th className="px-5 py-3.5">Extra Weight (/kg)</th>
                <th className="px-5 py-3.5">Stickers (Speed Post &lt; 250g)</th>
                <th className="px-5 py-3.5">{tDelivery('tableEstTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-3 font-bold text-white">
                    {zone.district}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{zone.province}</td>
                  <td className="px-5 py-3 font-mono font-bold text-brand-neon">
                    {formatLKR(zone.base_fee, appLocale)}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-300">
                    +{formatLKR(zone.extra_per_kg, appLocale)}
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-emerald-400">
                    Rs. 220
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {zone.estimated_days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Examples & Transparent Policy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300">
            <div className="font-bold text-white mb-1">📦 Stickers (&lt; 250g)</div>
            <div className="text-emerald-400 font-mono font-bold text-sm">Rs. 220/- Flat</div>
            <div className="text-[11px] text-slate-400 mt-1">SL Speed Post across all 25 districts for sticker cards.</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300">
            <div className="font-bold text-white mb-1">🏍️ Parts / Helmets (Up to 1kg)</div>
            <div className="text-brand-neon font-mono font-bold text-sm">Rs. 425/- Flat</div>
            <div className="text-[11px] text-slate-400 mt-1">Doorstep courier to any city or town in Sri Lanka.</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300">
            <div className="font-bold text-white mb-1">⚖️ Heavy Items (&gt; 1kg)</div>
            <div className="text-white font-mono font-bold text-sm">Rs. 425 + Rs. 100/kg</div>
            <div className="text-[11px] text-slate-400 mt-1">Ex: 2kg parcel = Rs. 525. 3kg parcel = Rs. 625.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
