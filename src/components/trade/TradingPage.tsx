'use client';

import { useEffect } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { TRADING_PAIRS } from '@/lib/constants';
import PairSelector from './PairSelector';
import CandleChart from './CandleChart';
import OrderBook from './OrderBook';
import OrderForm from './OrderForm';
import TradeHistory from './TradeHistory';
import OpenOrders from './OpenOrders';

interface TradingPageProps {
  pair: string;
}

export default function TradingPage({ pair }: TradingPageProps) {
  const { setCurrentPair, setMarketData, currentPrice, priceChange24h, high24h, low24h, volume24h } = useTradeStore();

  useEffect(() => {
    setCurrentPair(pair);
  }, [pair, setCurrentPair]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const pairConfig = TRADING_PAIRS.find(p => p.symbol === pair);

        if (pair === 'BTU-USDT') {
          // BTU: get price from orderbook (best ask)
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: pairData } = await supabase
            .from('trading_pairs').select('id').eq('symbol', 'BTU-USDT').single();
          if (!pairData) return;

          const { data: ob } = await supabase.rpc('get_orderbook', { p_pair_id: pairData.id, p_limit: 1 });
          const bestAsk = ob?.asks?.[0]?.price ? Number(ob.asks[0].price) : 0;
          const bestBid = ob?.bids?.[0]?.price ? Number(ob.bids[0].price) : 0;
          const midPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk || bestBid;

          if (midPrice > 0) {
            setMarketData({ price: midPrice, change: 0, high: midPrice * 1.05, low: midPrice * 0.95, volume: 0 });
          }
          return;
        }

        if (!pairConfig?.coingeckoId) return;

        const res = await fetch('/api/coingecko/markets');
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const market = data.find((m: any) => m.id === pairConfig.coingeckoId);
        if (market) {
          setMarketData({
            price: market.current_price,
            change: market.price_change_percentage_24h,
            high: market.high_24h,
            low: market.low_24h,
            volume: market.total_volume,
          });
        }
      } catch {}
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [pair, setMarketData]);

  const pairConfig = TRADING_PAIRS.find(p => p.symbol === pair);

  return (
    <div className="h-[calc(100vh-60px)]">
      {/* Top bar with pair info */}
      <div className="flex items-center gap-10 px-6 py-3 bg-bg-secondary border-b border-border">
        <PairSelector />
        <div className="flex items-center gap-10 overflow-x-auto">
          <div>
            <span className={`text-2xl font-bold ${priceChange24h >= 0 ? 'text-green' : 'text-red'}`}>
              {currentPrice > 0 ? `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: pairConfig?.decimals || 2 })}` : '--'}
            </span>
          </div>
          <div>
            <span className="text-xs text-text-third">24h Change</span>
            <p className={`text-base font-medium ${priceChange24h >= 0 ? 'text-green' : 'text-red'}`}>
              {priceChange24h ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%` : '--'}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-third">24h High</span>
            <p className="text-base text-text-primary">{high24h ? `$${high24h.toLocaleString()}` : '--'}</p>
          </div>
          <div>
            <span className="text-xs text-text-third">24h Low</span>
            <p className="text-base text-text-primary">{low24h ? `$${low24h.toLocaleString()}` : '--'}</p>
          </div>
          <div>
            <span className="text-xs text-text-third">24h Volume</span>
            <p className="text-base text-text-primary">{volume24h ? `$${(volume24h / 1e6).toFixed(2)}M` : '--'}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-px bg-border h-[calc(100%-56px)]">
        {/* Chart */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-6 bg-bg-primary p-1">
          <CandleChart />
        </div>

        {/* Order Book */}
        <div className="col-span-6 lg:col-span-4 xl:col-span-2 bg-bg-primary p-1 overflow-auto">
          <OrderBook />
        </div>

        {/* Order Form */}
        <div className="col-span-6 lg:col-span-4 xl:col-span-2 bg-bg-primary p-1">
          <OrderForm />
        </div>

        {/* Trade History */}
        <div className="col-span-6 lg:col-span-4 xl:col-span-2 bg-bg-primary p-1">
          <TradeHistory />
        </div>

        {/* Open Orders */}
        <div className="col-span-12 bg-bg-primary p-1">
          <OpenOrders />
        </div>
      </div>
    </div>
  );
}
