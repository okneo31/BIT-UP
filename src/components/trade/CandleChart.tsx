'use client';

import { useEffect, useRef, useState } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { TRADING_PAIRS, TIMEFRAMES } from '@/lib/constants';

export default function CandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const { currentPair } = useTradeStore();
  const [timeframe, setTimeframe] = useState('1d');
  const [loading, setLoading] = useState(true);

  const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);

  useEffect(() => {
    const initChart = async () => {
      if (!chartContainerRef.current) return;

      const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');

      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0b0e11' },
          textColor: '#848e9c',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: '#1e2329' },
          horzLines: { color: '#1e2329' },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: '#2b3139',
        },
        timeScale: {
          borderColor: '#2b3139',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderDownColor: '#f6465d',
        borderUpColor: '#0ecb81',
        wickDownColor: '#f6465d',
        wickUpColor: '#0ecb81',
      });

      chartRef.current = chart;
      seriesRef.current = series;

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!seriesRef.current) return;
      setLoading(true);

      try {
        const tf = TIMEFRAMES.find(t => t.value === timeframe);
        const days = tf?.days || 1;

        // BTU-USDT uses internal trade data, others use CoinGecko
        const url = currentPair === 'BTU-USDT'
          ? `/api/coingecko/ohlc?pair=BTU-USDT&days=${days}`
          : pair?.coingeckoId
            ? `/api/coingecko/ohlc?coinId=${pair.coingeckoId}&days=${days}`
            : null;

        if (!url) return;

        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          seriesRef.current.setData(data);
          chartRef.current?.timeScale().fitContent();
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentPair, timeframe, pair?.coingeckoId]);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                timeframe === tf.value
                  ? 'bg-bg-tertiary text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-sm text-text-third">Loading...</span>}
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
