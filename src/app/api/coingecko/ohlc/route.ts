import { NextRequest, NextResponse } from 'next/server';
import { getOHLC } from '@/lib/coingecko/client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coinId = searchParams.get('coinId');
  const days = parseInt(searchParams.get('days') || '1', 10);

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
