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
    <header className="h-16 bg-bg-secondary border-b border-border flex items-center px-6 sticky top-0 z-40">
      {/* Logo */}
      <Link href="/trade/BTC-USDT" className="flex items-center gap-2.5 mr-12 shrink-0">
        <span className="text-accent text-2xl font-bold">▲</span>
        <span className="text-text-primary text-xl font-bold tracking-wide">BitUp</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 text-[15px] font-medium rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-accent bg-accent/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <span className="mr-1.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right side - User section */}
      <div className="ml-auto flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-sm font-bold">
                  {(user.nickname || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-text-primary font-medium hidden sm:block">
                {user.nickname || user.email}
              </span>
            </div>
            <Button variant="ghost" size="md" onClick={() => { signOut(); router.push('/login'); }}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="md">Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="md">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
