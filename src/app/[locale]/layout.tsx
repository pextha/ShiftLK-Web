import type { Metadata } from 'next';
import { Inter, Noto_Sans_Sinhala, Noto_Sans_Tamil } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import FloatingWhatsApp from '@/components/common/FloatingWhatsApp';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sinhala',
  display: 'swap',
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-tamil',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'ShiftLK Spares | Motorbike Spare Parts & Accessories Sri Lanka',
    si: 'ShiftLK Spares | ශ්‍රී ලංකාවේ ප්‍රමුඛතම මෝටර්බයික් අමතර කොටස් සේවාව',
    ta: 'ShiftLK Spares | இலங்கையின் மோட்டார் பைக் உதிரிப்பாகங்கள்',
  };

  const descriptions: Record<string, string> = {
    en: 'Genuine Indian bike spare parts (Bajaj, Yamaha, TVS), custom modification parts, body stickers & graphics, and certified helmets. Direct WhatsApp ordering with islandwide delivery across all 25 districts.',
    si: 'Bajaj, Yamaha, TVS ඇතුළු ඉන්දියන් බයික් අමතර කොටස්, මොඩිෆිකේෂන් පාර්ට්ස්, බොඩි ස්ටිකර් සහ හෙල්මට්. දිස්ත්‍රික්ක 25 පුරාම නිවසටම ප්‍රවාහනය සමඟ වට්ස්ඇප් මගින් ඇණවුම් කරන්න.',
    ta: 'Bajaj, Yamaha போன்ற மோட்டார் பைக்குகளுக்கான உதிரிப்பாகங்கள், மாடிஃபிகேஷன் பாகங்கள், பாடி ஸ்டிக்கர்கள் மற்றும் ஹெல்மெட்டுகள். 25 மாவட்டங்களுக்கும் வீட்டு வாசலுக்கே விநியோகம்.',
  };

  const title = titles[locale] || titles.en;
  const description = descriptions[locale] || descriptions.en;

  return {
    title: {
      template: '%s | ShiftLK Spares Sri Lanka',
      default: title,
    },
    description,
    keywords: [
      'Sri Lanka motorbike spare parts',
      'Bajaj spare parts Sri Lanka',
      'Yamaha FZ spare parts',
      'Pulsar 150 180 200NS parts',
      'bike modification parts Sri Lanka',
      'motorbike body stickers decals',
      'bike helmets Sri Lanka',
      'Polgasowita bike spares',
      'WhatsApp bike parts order',
      'මෝටර්බයික් අමතර කොටස්',
      'மோட்டார் பைக் உதிரிப்பாகங்கள்',
    ],
    authors: [{ name: 'ShiftLK Spares' }],
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://shiftlk.lk'
    ),
    openGraph: {
      title,
      description,
      siteName: 'ShiftLK Spares',
      locale: locale === 'si' ? 'si_LK' : locale === 'ta' ? 'ta_LK' : 'en_US',
      type: 'website',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: 'ShiftLK Spares Sri Lanka',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoSinhala.variable} ${notoTamil.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-brand-neon selection:text-black">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingWhatsApp />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
