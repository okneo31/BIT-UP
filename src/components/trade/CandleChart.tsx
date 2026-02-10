'use client';

import { useEffect, useRef, useState } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { TRADING_PAIRS, TIMEFRAMES } from '@/lib/constants';
import Tabs from '@/components/ui/Tabs';

export default function CandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const { currentPair } = useTradeStore();
  const [timeframe, setTimeframe] = useState('1d');
  const [loading, setLoading] = useState(true);

  const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);

  useEffect(() => {
    let mounted = true;

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
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
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
      mounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!seriesRef.current || !pair?.coingeckoId) return;
      setLoading(true);

      try {
        const tf = TIMEFRAMES.find(t => t.value === timeframe);
        const days = tf?.days || 1;
        const res = await fetch(`/api/coingecko/ohlc?coinId=${pair.coingeckoId}&days=${days}`);
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [currentPair, timeframe, pair?.coingeckoId]);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Tabs
          tabs={TIMEFRAMES.map(tf => ({ label: tf.label, value: tf.value }))}
          active={timeframe}
          onChange={setTimeframe}
          variant="pills"
        />
        {loading && <span className="text-xs text-text-third">Loading...</span>}
      </div>
      <div ref={chartContainerRef} className="w-full" />
      {!pair?.coingeckoId && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary/80">
          <p className="text-text-secondary text-sm">BTU chart data from internal trades</p>
        </div>
      )}
    </div>
  );
}
