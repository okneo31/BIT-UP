export const TRADING_PAIRS = [
  { symbol: 'BTC-USDT', base: 'BTC', quote: 'USDT', coingeckoId: 'bitcoin', decimals: 2 },
  { symbol: 'ETH-USDT', base: 'ETH', quote: 'USDT', coingeckoId: 'ethereum', decimals: 2 },
  { symbol: 'BNB-USDT', base: 'BNB', quote: 'USDT', coingeckoId: 'binancecoin', decimals: 2 },
  { symbol: 'SOL-USDT', base: 'SOL', quote: 'USDT', coingeckoId: 'solana', decimals: 2 },
  { symbol: 'XRP-USDT', base: 'XRP', quote: 'USDT', coingeckoId: 'ripple', decimals: 4 },
  { symbol: 'DOGE-USDT', base: 'DOGE', quote: 'USDT', coingeckoId: 'dogecoin', decimals: 5 },
  { symbol: 'BTU-USDT', base: 'BTU', quote: 'USDT', coingeckoId: null, decimals: 4 },
] as const;

export const SUPPORTED_CURRENCIES = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'BTU', 'USDT',
] as const;

export const CURRENCY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  BNB: { name: 'BNB', icon: 'B', color: '#f0b90b' },
  SOL: { name: 'Solana', icon: 'S', color: '#9945ff' },
  XRP: { name: 'Ripple', icon: 'X', color: '#00aae4' },
  DOGE: { name: 'Dogecoin', icon: 'Ð', color: '#c2a633' },
  BTU: { name: 'BitUp Token', icon: '▲', color: '#f0b90b' },
  USDT: { name: 'Tether', icon: '₮', color: '#26a17b' },
};

export const SIGNUP_BONUS: Record<string, number> = {
  BTU: 10000,
  USDT: 100000,
  BTC: 0.5,
  ETH: 5,
};

export const TRADING_FEE = 0.001; // 0.1%
export const BTU_FEE_DISCOUNT = 0.25; // 25% discount when paying with BTU

export const COINGECKO_CACHE_TTL = 60; // seconds
export const POLLING_INTERVAL = 5000; // 5 seconds

export const TIMEFRAMES = [
  { label: '30m', value: '30m', days: 1 },
  { label: '4H', value: '4h', days: 14 },
  { label: '1D', value: '1d', days: 90 },
] as const;
