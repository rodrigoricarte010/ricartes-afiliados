import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Ricartes — Plataforma de Afiliados e Infoprodutos',
    template: '%s · Ricartes',
  },
  description:
    'Painel completo para afiliar produtos na Shopee, TikTok Shop e Mercado Livre, gerar conteúdo que vende e comercializar seus próprios infoprodutos.',
  applicationName: 'Ricartes Afiliados',
};

export const viewport: Viewport = {
  themeColor: '#07070c',
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
