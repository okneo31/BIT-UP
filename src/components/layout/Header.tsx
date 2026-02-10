'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, initialized, initialize, signOut } = useAuthStore();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const navItems = [
    { label: 'Trade', href: '/trade/BTC-USDT' },
    { label: 'Wallet', href: '/wallet' },
    { label: 'Launchpool', href: '/launchpool' },
  ];

  const isActive = (href: string) => {
    if (href.startsWith('/trade')) return pathname.startsWith('/trade');
    return pathname === href;
  };

  return (
    <header className="h-14 bg-bg-secondary border-b border-border flex items-center px-4 sticky top-0 z-40">
      <Link href="/trade/BTC-USDT" className="flex items-center gap-2 mr-8">
        <span className="text-accent text-xl font-bold">▲</span>
        <span className="text-text-primary text-lg font-bold">BitUp</span>
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              isActive(item.href)
                ? 'text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <span className="text-xs text-text-secondary hidden sm:block">
              {user.nickname || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); router.push('/login'); }}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
