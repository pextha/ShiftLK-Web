import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Building,
  HelpCircle,
} from 'lucide-react';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Contact Us | ShiftLK Spares Undurugoda Polgasowita',
    description:
      'Get in touch with ShiftLK Spares in Undurugoda, Polgasowita for parts inquiries, chassis verification, and islandwide delivery.',
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const tContact = await getTranslations('contact');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-brand-neon/10 border border-brand-neon/30 text-brand-neon text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-brand-neon/10">
          <Building className="w-3.5 h-3.5" />
          <span>Direct Undurugoda Store</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {tContact('title')}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {tContact('subtitle')}
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical Address */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Store Location</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {tContact('address')}
          </p>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            53/1, Palagama Road, Undurugoda, Polgasowita, Sri Lanka
          </div>
        </div>

        {/* WhatsApp & Hotline */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 fill-emerald-400 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Direct WhatsApp Hotline</h3>
            <p className="text-sm text-slate-300 mt-1">
              {tContact('whatsapp')}
            </p>
          </div>
          <div>
            <a
              href="https://wa.me/94770871018"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-lg transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Open WhatsApp Chat Now</span>
            </a>
          </div>
        </div>

        {/* Telephone & Email */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Telephone & Email</h3>
          <div className="space-y-1 text-sm text-slate-300">
            <div>Phone: {tContact('phone')}</div>
            <div>Email: {tContact('email')}</div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Business Hours</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {tContact('hours')}
          </p>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            Islandwide courier dispatches depart daily at 4:00 PM
          </div>
        </div>
      </div>
    </div>
  );
}
