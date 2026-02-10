'use client';

import { useEffect, useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { CURRENCY_INFO } from '@/lib/constants';

export default function BalanceOverview() {
  const { wallets } = useWalletStore();
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/coingecko/markets');
        const data = await res.json();
        if (Array.isArray(data)) {
          const map: Record<string, number> = { USDT: 1 };
          data.forEach((m: any) => {
            const symbol = m.symbol.toUpperCase();
            map[symbol] = m.current_price;
          });
          // BTU price (simulated)
          map['BTU'] = 0.15;
          setPrices(map);
        }
      } catch {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalUSD = wallets.reduce((sum, w) => {
    const price = prices[w.currency] || 0;
    return sum + (Number(w.available) + Number(w.locked)) * price;
  }, 0);

  const totalBTC = prices['BTC'] > 0 ? totalUSD / prices['BTC'] : 0;

  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-6">
      <h2 className="text-sm text-text-secondary mb-1">Estimated Balance</h2>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-text-primary">
          ${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className="text-sm text-text-secondary">
          ≈ {totalBTC.toFixed(8)} BTC
        </span>
      </div>
    </div>
  );
}
