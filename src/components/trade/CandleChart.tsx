'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { TRADING_PAIRS, TIMEFRAMES } from '@/lib/constants';

export default function CandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const { currentPair } = useTradeStore();
  const [timeframe, setTimeframe] = useState('1h');
  const [loading, setLoading] = useState(true);

  const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);

  // Responsive chart height
  const getChartHeight = useCallback(() => {
    if (typeof window === 'undefined') return 600;
    return Math.max(500, window.innerHeight - 260);
  }, []);

  useEffect(() => {
    const initChart = async () => {
      if (!chartContainerRef.current) return;

      const { createChart, ColorType, CandlestickSeries, CrosshairMode } = await import('lightweight-charts');

      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0b0e11' },
          textColor: '#848e9c',
          fontSize: 13,
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: 'rgba(224, 227, 235, 0.2)',
            style: 0,
            labelBackgroundColor: '#363A45',
          },
          horzLine: {
            width: 1,
            color: 'rgba(224, 227, 235, 0.2)',
            style: 0,
            labelBackgroundColor: '#363A45',
          },
        },
        rightPriceScale: {
          borderColor: '#2b3139',
          scaleMargins: { top: 0.1, bottom: 0.1 },
          entireTextOnly: true,
        },
        timeScale: {
          borderColor: '#2b3139',
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 5,
          barSpacing: 8,
          minBarSpacing: 3,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
          axisDoubleClickReset: {
            time: true,
            price: true,
          },
          mouseWheel: true,
          pinch: true,
        },
        width: chartContainerRef.current.clientWidth,
        height: getChartHeight(),
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
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: getChartHeight(),
          });
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
  }, [getChartHeight]);

  useEffect(() => {
    const fetchData = async () => {
      if (!seriesRef.current) return;
      setLoading(true);

      try {
        const tf = TIMEFRAMES.find(t => t.value === timeframe);
        const interval = tf?.interval || '1h';
        const limit = tf?.limit || 500;

        let url: string | null = null;
        if (currentPair === 'BTU-USDT') {
          url = `/api/coingecko/ohlc?pair=BTU-USDT&interval=${interval}&limit=${limit}`;
        } else if (pair?.binanceSymbol) {
          url = `/api/coingecko/ohlc?symbol=${pair.binanceSymbol}&interval=${interval}&limit=${limit}`;
        }

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
    // Shorter refresh for short timeframes, longer for daily
    const refreshMs = timeframe === '1m' ? 5000 : timeframe === '5m' ? 10000 : 30000;
    const timer = setInterval(fetchData, refreshMs);
    return () => clearInterval(timer);
  }, [currentPair, timeframe, pair?.binanceSymbol]);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded transition-colors ${
                timeframe === tf.value
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-sm text-text-third animate-pulse">Loading...</span>}
      </div>
      <div ref={chartContainerRef} className="w-full flex-1" />
    </div>
  );
}
