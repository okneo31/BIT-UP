'use client';

import { useEffect, useRef, useState } from 'react';
import { useFuturesStore } from '@/stores/futuresStore';
import { FUTURES_PAIRS } from '@/lib/constants';
import FuturesPairSelector from './FuturesPairSelector';
import FuturesOrderBook from './FuturesOrderBook';
import FuturesOrderForm from './FuturesOrderForm';
import FuturesOpenOrders from './FuturesOpenOrders';
import PositionPanel from './PositionPanel';
import Tabs from '@/components/ui/Tabs';

// TradingView widget for futures chart
function FuturesChart({ binanceSymbol }: { binanceSymbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!containerRef.current || !(window as any).TradingView) return;

      widgetRef.current = new (window as any).TradingView.widget({
        container_id: containerRef.current.id,
        autosize: true,
        symbol: `BINANCE:${binanceSymbol}`,
        interval: '60',
        timezone: 'Asia/Seoul',
        theme: 'dark',
        style: '1',
        locale: 'kr',
        toolbar_bg: '#0b0e11',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        withdateranges: true,
        details: false,
        hotlist: false,
        calendar: false,
        studies: [],
        show_popup_button: false,
        backgroundColor: '#0b0e11',
        gridColor: 'rgba(42, 46, 57, 0.6)',
        overrides: {
          'paneProperties.background': '#0b0e11',
          'paneProperties.backgroundType': 'solid',
          'mainSeriesProperties.candleStyle.upColor': '#0ecb81',
          'mainSeriesProperties.candleStyle.downColor': '#f6465d',
          'mainSeriesProperties.candleStyle.borderUpColor': '#0ecb81',
          'mainSeriesProperties.candleStyle.borderDownColor': '#f6465d',
          'mainSeriesProperties.candleStyle.wickUpColor': '#0ecb81',
          'mainSeriesProperties.candleStyle.wickDownColor': '#f6465d',
        },
      });
    };

    if ((window as any).TradingView) {
      script.onload(new Event('load'));
    } else {
      document.head.appendChild(script);
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current = null;
      }
    };
  }, [binanceSymbol]);

  return (
    <div className="h-full w-full bg-[#0b0e11]">
      <div
        id={`tradingview_futures_${binanceSymbol}`}
        ref={containerRef}
        className="h-full w-full"
      />
    </div>
  );
}

interface FuturesTradingPageProps {
  pair: string;
}

export default function FuturesTradingPage({ pair }: FuturesTradingPageProps) {
  const { setCurrentPair, setMarketData, currentPrice, priceChange24h, high24h, low24h, volume24h } = useFuturesStore();
  const [bottomTab, setBottomTab] = useState('positions');

  useEffect(() => {
    setCurrentPair(pair);
  }, [pair, setCurrentPair]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const pairConfig = FUTURES_PAIRS.find(p => p.symbol === pair);
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

  const pairConfig = FUTURES_PAIRS.find(p => p.symbol === pair);

  return (
    <div className="h-[calc(100vh-60px)]">
      {/* Top bar */}
      <div className="flex items-center gap-10 px-6 py-3 bg-bg-secondary border-b border-border">
        <FuturesPairSelector />
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
          <div>
            <span className="text-xs text-text-third">Funding Rate</span>
            <p className="text-base text-text-primary">0.0100%</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-px bg-border" style={{ height: 'calc(100% - 56px)' }}>
        {/* Chart */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-8 bg-bg-primary p-1" style={{ height: '55%' }}>
          {pairConfig?.binanceSymbol && (
            <FuturesChart binanceSymbol={pairConfig.binanceSymbol} />
          )}
        </div>

        {/* Order Book */}
        <div className="col-span-6 lg:col-span-2 xl:col-span-2 bg-bg-primary p-1 overflow-auto" style={{ height: '55%' }}>
          <FuturesOrderBook />
        </div>

        {/* Order Form */}
        <div className="col-span-6 lg:col-span-2 xl:col-span-2 bg-bg-primary p-1 overflow-auto" style={{ height: '55%' }}>
          <FuturesOrderForm />
        </div>

        {/* Bottom: Positions + Orders */}
        <div className="col-span-12 bg-bg-primary p-1" style={{ height: '45%', overflow: 'auto' }}>
          <div className="bg-bg-secondary rounded-lg border border-border h-full flex flex-col">
            <Tabs
              tabs={[
                { label: 'Positions', value: 'positions' },
                { label: 'Open Orders', value: 'orders' },
              ]}
              active={bottomTab}
              onChange={setBottomTab}
            />
            <div className="flex-1 overflow-auto">
              {bottomTab === 'positions' ? <PositionPanel /> : <FuturesOpenOrders />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
