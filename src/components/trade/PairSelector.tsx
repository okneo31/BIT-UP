'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTradeStore } from '@/stores/tradeStore';
import { TRADING_PAIRS } from '@/lib/constants';

interface MarketInfo {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function PairSelector() {
  const { currentPair, setCurrentPair } = useTradeStore();
  const [markets, setMarkets] = useState<Record<string, MarketInfo>>({});
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/coingecko/markets');
        const data = await res.json();
        if (Array.isArray(data)) {
          const map: Record<string, MarketInfo> = {};
          data.forEach((m: MarketInfo & { symbol: string }) => {
            map[m.id] = m;
          });
          setMarkets(map);
        }
      } catch {}
    };
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (symbol: string) => {
    setCurrentPair(symbol);
    router.push(`/trade/${symbol}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xl font-bold text-text-primary hover:bg-bg-tertiary rounded transition-colors"
      >
        {currentPair.replace('-', '/')}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-80 bg-bg-secondary border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-text-secondary px-2">Trading Pairs</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {TRADING_PAIRS.map((pair) => {
                const market = pair.coingeckoId ? markets[pair.coingeckoId] : null;
                const price = market?.current_price || 0;
                const change = market?.price_change_percentage_24h || 0;
                return (
                  <button
                    key={pair.symbol}
                    onClick={() => handleSelect(pair.symbol)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-bg-tertiary transition-colors ${
                      currentPair === pair.symbol ? 'bg-bg-tertiary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-text-primary">{pair.base}</span>
                      <span className="text-xs text-text-third">/ {pair.quote}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-base text-text-primary">{price ? `$${price.toLocaleString()}` : '--'}</p>
                      <p className={`text-xs ${change >= 0 ? 'text-green' : 'text-red'}`}>
                        {change ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '--'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
