import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'METRIA — Meteora DBC Lifecycle Verification & Developer Infrastructure',
  description:
    'Every launch. Every transition. Verified. Independent on-chain lifecycle verification and developer infrastructure for Meteora Dynamic Bonding Curves.',
  keywords: [
    'Meteora',
    'Dynamic Bonding Curve',
    'DBC',
    'DAMM v2',
    'Solana',
    'DeFi',
    'Lifecycle Verification',
    'Developer Infrastructure',
  ],
  authors: [{ name: 'METRIA Team' }],
  openGraph: {
    title: 'METRIA — Meteora DBC Lifecycle Verification',
    description: 'Every launch. Every transition. Verified.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-[#080B11] text-slate-100 antialiased font-sans">
        <Header />
        <main className="flex-1 w-full bg-grid-pattern">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
