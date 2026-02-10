import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BINANCE_API = 'https://api.binance.com/api/v3/klines';

// Map interval string to milliseconds (for BTU candle aggregation)
const INTERVAL_MS: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pair = searchParams.get('pair');
  const binanceSymbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '500', 10);

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

      const intervalMs = INTERVAL_MS[interval] || 60 * 60 * 1000;
      const since = new Date(Date.now() - limit * intervalMs).toISOString();

      const { data: trades } = await supabase
        .from('trades')
        .select('price, quantity, created_at')
        .eq('pair_id', pairData.id)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (!trades || trades.length === 0) return NextResponse.json([]);

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

  // Other coins: Binance public klines API (no API key needed)
  if (!binanceSymbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const url = `${BINANCE_API}?symbol=${binanceSymbol}&interval=${interval}&limit=${Math.min(limit, 1000)}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const raw = await res.json();

    // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
    const data = raw.map((k: any[]) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('Binance klines error:', error);
    return NextResponse.json({ error: 'Failed to fetch klines data' }, { status: 500 });
  }
}
