import { NextRequest, NextResponse } from 'next/server';
import { getOHLC } from '@/lib/coingecko/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coinId = searchParams.get('coinId');
  const days = parseInt(searchParams.get('days') || '1', 10);
  const pair = searchParams.get('pair');

  // BTU-USDT: candle data from internal trades table
  if (pair === 'BTU-USDT') {
    try {
      const supabase = await createClient();

      const { data: pairData } = await supabase
        .from('trading_pairs')
        .select('id')
        .eq('symbol', 'BTU-USDT')
        .single();

      if (!pairData) return NextResponse.json([]);

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: trades } = await supabase
        .from('trades')
        .select('price, quantity, created_at')
        .eq('pair_id', pairData.id)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (!trades || trades.length === 0) return NextResponse.json([]);

      let intervalMs: number;
      if (days <= 2) intervalMs = 30 * 60 * 1000;
      else if (days <= 14) intervalMs = 4 * 60 * 60 * 1000;
      else intervalMs = 24 * 60 * 60 * 1000;

      const candles: { time: number; open: number; high: number; low: number; close: number }[] = [];
      let currentBucket = 0;
      let open = 0, high = 0, low = Infinity, close = 0;

      for (const trade of trades) {
        const ts = new Date(trade.created_at).getTime();
        const bucket = Math.floor(ts / intervalMs) * intervalMs;
        const price = Number(trade.price);

        if (bucket !== currentBucket) {
          if (currentBucket > 0) {
            candles.push({ time: Math.floor(currentBucket / 1000), open, high, low, close });
          }
          currentBucket = bucket;
          open = price;
          high = price;
          low = price;
          close = price;
        } else {
          high = Math.max(high, price);
          low = Math.min(low, price);
          close = price;
        }
      }

      if (currentBucket > 0) {
        candles.push({ time: Math.floor(currentBucket / 1000), open, high, low, close });
      }

      return NextResponse.json(candles);
    } catch (error) {
      console.error('BTU OHLC error:', error);
      return NextResponse.json([]);
    }
  }

  // Other coins: CoinGecko API
  if (!coinId) {
    return NextResponse.json({ error: 'coinId is required' }, { status: 400 });
  }

  try {
    const raw = await getOHLC(coinId, days);
    const data = raw.map(([time, open, high, low, close]: number[]) => ({
      time: Math.floor(time / 1000),
      open,
      high,
      low,
      close,
    }));
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('CoinGecko OHLC error:', error);
    return NextResponse.json({ error: 'Failed to fetch OHLC data' }, { status: 500 });
  }
}
