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

// CoinGecko free API granularity: 1-2 days→30min candles, 3-30 days→4h candles, 31+→daily
export const TIMEFRAMES = [
  { label: '1m', value: '1m', days: 1 },
  { label: '5m', value: '5m', days: 1 },
  { label: '15m', value: '15m', days: 1 },
  { label: '30m', value: '30m', days: 1 },
  { label: '1H', value: '1h', days: 2 },
  { label: '4H', value: '4h', days: 14 },
  { label: '1D', value: '1d', days: 90 },
] as const;

// Simulated wallet addresses per network
export const NETWORK_INFO: Record<string, { name: string; network: string; confirmations: number }[]> = {
  BTC: [{ name: 'Bitcoin', network: 'BTC', confirmations: 3 }],
  ETH: [
    { name: 'Ethereum (ERC20)', network: 'ERC20', confirmations: 12 },
    { name: 'BNB Smart Chain (BEP20)', network: 'BEP20', confirmations: 15 },
  ],
  BNB: [
    { name: 'BNB Smart Chain (BEP20)', network: 'BEP20', confirmations: 15 },
  ],
  SOL: [{ name: 'Solana', network: 'SOL', confirmations: 1 }],
  XRP: [{ name: 'Ripple', network: 'XRP', confirmations: 1 }],
  DOGE: [{ name: 'Dogecoin', network: 'DOGE', confirmations: 6 }],
  BTU: [
    { name: 'Ethereum (ERC20)', network: 'ERC20', confirmations: 12 },
    { name: 'BNB Smart Chain (BEP20)', network: 'BEP20', confirmations: 15 },
  ],
  USDT: [
    { name: 'Ethereum (ERC20)', network: 'ERC20', confirmations: 12 },
    { name: 'Tron (TRC20)', network: 'TRC20', confirmations: 20 },
    { name: 'BNB Smart Chain (BEP20)', network: 'BEP20', confirmations: 15 },
  ],
};
