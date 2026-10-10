import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { INDEPENDENT_DISCLOSURE } from '@/lib/meteora/constants';

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-white/[0.08] bg-[#080a09] text-sm text-white/55">
      <div className="mx-auto max-w-[1440px] space-y-7 px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/brand/metria-logo.jpg" alt="Metria" width={100} height={82} className="h-[52px] w-[64px] rounded object-cover" />
            <div>
              <p className="font-semibold tracking-wide text-white">Independent verification infrastructure</p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/45">Lifecycle evidence for Meteora Dynamic Bonding Curve pools and their migration destinations.</p>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-xs">
            <Link href="/verify" className="transition-colors hover:text-[#d3ff83]">Verify</Link>
            <Link href="/explorer" className="transition-colors hover:text-[#d3ff83]">Explorer</Link>
            <Link href="/api-docs" className="transition-colors hover:text-[#d3ff83]">API</Link>
            <Link href="/methodology" className="transition-colors hover:text-[#d3ff83]">Methodology</Link>
            <Link href="/about" className="transition-colors hover:text-[#d3ff83]">About</Link>
            <a href="https://docs.meteora.ag" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#d3ff83]">Meteora Docs ↗</a>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-5 text-[11px] leading-relaxed text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-4xl"><strong className="font-medium text-white/60">Independent project.</strong> {INDEPENDENT_DISCLOSURE}</p>
          <span className="shrink-0">Apache-2.0 / MIT</span>
        </div>
      </div>
    </footer>
  );
}
