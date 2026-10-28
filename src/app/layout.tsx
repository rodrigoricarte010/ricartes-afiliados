import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { BRAND, BRAND_METADATA } from '@/lib/brand';

export const metadata: Metadata = {
  title: {
    default: BRAND_METADATA.title,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND_METADATA.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.short }],
  openGraph: {
    title: BRAND_METADATA.title,
    description: BRAND_METADATA.description,
    siteName: BRAND.name,
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#06060d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-dvh">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
