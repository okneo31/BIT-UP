import { NextResponse } from 'next/server';
import { getMarkets } from '@/lib/coingecko/client';

export async function GET() {
  try {
    const data = await getMarkets();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('CoinGecko markets error:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
