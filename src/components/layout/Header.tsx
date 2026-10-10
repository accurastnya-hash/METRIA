'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Terminal, Cpu, BookOpen, Info, Search, Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/', icon: Cpu },
  { label: 'Verify', href: '/verify', icon: Search },
  { label: 'Explorer', href: '/explorer', icon: ShieldCheck },
  { label: 'Developer API', href: '/api-docs', icon: Terminal },
  { label: 'Methodology', href: '/methodology', icon: BookOpen },
  { label: 'About', href: '/about', icon: Info },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090b0a]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/" onClick={() => setMenuOpen(false)} aria-label="Metria home" className="group flex min-w-0 items-center gap-3">
          <Image
            src="/brand/metria-logo.jpg"
            alt="Metria"
            width={100}
            height={82}
            priority
            className="h-[54px] w-[66px] shrink-0 rounded-md object-cover"
          />
          <div className="hidden min-w-0 sm:block">
            <div className="font-semibold tracking-wide text-white">METRIA</div>
            <p className="mt-0.5 text-[11px] text-white/45">Independent DBC verification</p>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-[#c5f36b]/[0.12] text-[#d3ff83]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/70 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c5f36b]" />
            Solana Mainnet
          </div>
          <Link href="/verify" className="hidden rounded-full bg-[#c5f36b] px-4 py-2.5 text-xs font-bold text-[#13180c] transition-colors hover:bg-[#d3ff83] sm:inline-flex">
            Verify a pool
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 hover:bg-white/[0.06] xl:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-white/[0.08] bg-[#090b0a] px-4 py-3 xl:hidden">
          <div className="mx-auto grid max-w-[1440px] gap-1 sm:grid-cols-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive ? 'bg-[#c5f36b]/[0.12] text-[#d3ff83]' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
