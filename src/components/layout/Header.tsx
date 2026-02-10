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
    { label: 'Trade', href: '/trade/BTC-USDT', icon: '📊' },
    { label: 'Wallet', href: '/wallet', icon: '💰' },
    { label: 'Launchpool', href: '/launchpool', icon: '🚀' },
  ];

  const isActive = (href: string) => {
    if (href.startsWith('/trade')) return pathname.startsWith('/trade');
    return pathname === href;
  };

  return (
    <header className="h-[60px] bg-bg-secondary border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left: Logo + Nav */}
      <div className="flex items-center">
        <Link href="/trade/BTC-USDT" className="flex items-center gap-3 mr-16 shrink-0">
          <span className="text-accent text-3xl font-bold">▲</span>
          <span className="text-text-primary text-2xl font-bold tracking-wide">BitUp</span>
        </Link>

        <nav className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base font-medium transition-colors whitespace-nowrap ${
                isActive(item.href)
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right: User */}
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2 bg-bg-tertiary rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-base font-bold">
                  {(user.nickname || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-base text-text-primary font-medium hidden sm:block">
                {user.nickname || user.email}
              </span>
            </div>
            <Button variant="ghost" size="lg" onClick={() => { signOut(); router.push('/login'); }}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="lg">Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="lg">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
