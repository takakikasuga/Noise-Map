'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'トップ' },
  { href: '/#areas', label: 'エリア' },
  { href: '/line', label: '路線' },
  { href: '/compare', label: '比較' },
  { href: '/about/methodology', label: 'データについて' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded"
        >
          ヒッコシマップ
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden gap-4 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* モバイル ハンバーガーボタン */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
          aria-expanded={open}
          aria-label="メニューを開く"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* モバイルドロップダウンメニュー */}
      {open && (
        <nav className="border-t bg-white px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-gray-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
