import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { Suspense } from 'react';
import { Toast } from '@/components/ui/Toast';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Inventory Portal',
  description: 'Product and inventory portal built with the Next.js App Router.',
};

function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/products" className="text-sm font-semibold text-slate-900">
          Inventory Portal
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/products" className="text-slate-600 transition hover:text-slate-900">
            Products
          </Link>
          <Link href="/products/new" className="text-slate-600 transition hover:text-slate-900">
            Add product
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <SiteHeader />
        <Suspense fallback={<main className="flex-1" />}>
          <Providers>
            <main className="flex-1">{children}</main>
            <Toast />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
