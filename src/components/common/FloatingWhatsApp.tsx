'use client';

import { useLocale } from 'next-intl';
import { AppLocale } from '@/lib/db/schema.types';
import { buildGeneralEnquiryMessage, getWhatsAppUrl } from '@/lib/utils/whatsapp';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function FloatingWhatsApp() {
  const locale = useLocale() as AppLocale;
  const [isHovered, setIsHovered] = useState(false);

  const enquiryMessage = buildGeneralEnquiryMessage(locale);
  const whatsAppUrl = getWhatsAppUrl(enquiryMessage);

  const getTooltipText = () => {
    switch (locale) {
      case 'si':
        return 'වට්ස්ඇප් මගින් විමසන්න (WhatsApp)';
      case 'ta':
        return 'வாட்ஸ்அப்பில் விசாரியுங்கள்';
      case 'en':
      default:
        return 'Chat with Parts Specialist';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip bubble on desktop */}
      <div
        className={`hidden sm:flex items-center bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xl border border-slate-700 transition-all duration-200 pointer-events-none ${
          isHovered
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-2'
        }`}
      >
        <span>{getTooltipText()}</span>
        <div className="w-2 h-2 bg-slate-900 border-r border-t border-slate-700 transform rotate-45 -ml-1"></div>
      </div>

      {/* Floating button */}
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-full shadow-2xl shadow-emerald-950/60 transition-transform duration-200 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        aria-label="Contact us on WhatsApp"
      >
        {/* Pulsing ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-40 group-hover:animate-ping -z-10" />

        <MessageCircle className="w-7 h-7 fill-white" />

        {/* Online status badge */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-neon border-2 border-slate-950 rounded-full shadow-sm shadow-brand-neon" />
      </a>
    </div>
  );
}
