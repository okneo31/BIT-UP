const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  total_volume: number;
  market_cap: number;
  image: string;
}

export async function getMarkets(ids?: string[]): Promise<MarketData[]> {
  const idsParam = ids?.join(',') || 'bitcoin,ethereum,binancecoin,solana,ripple,dogecoin';
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false`;
  return fetchWithCache<MarketData[]>(url);
}

export async function getOHLC(coinId: string, days: number): Promise<number[][]> {
  const url = `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  return fetchWithCache<number[][]>(url);
}

export async function getPrice(coinId: string): Promise<number> {
  const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`;
  const data = await fetchWithCache<Record<string, { usd: number }>>(url);
  return data[coinId]?.usd || 0;
}
