import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '../globals.css';
import { QueryProvider } from '@/lib/query-client';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/common/Toast';
import { AdminShell } from '@/components/admin/layout/AdminShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ShiftLK Admin Portal',
    template: '%s | ShiftLK Admin',
  },
  description: 'ShiftLK Motorbike Spares - Internal Store Administration & Inventory Management',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans selection:bg-brand-neon/30 selection:text-white">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <AdminShell>{children}</AdminShell>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
