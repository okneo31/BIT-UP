export const TRADING_PAIRS = [
  { symbol: 'BTC-USDT', base: 'BTC', quote: 'USDT', coingeckoId: 'bitcoin', binanceSymbol: 'BTCUSDT', decimals: 2 },
  { symbol: 'ETH-USDT', base: 'ETH', quote: 'USDT', coingeckoId: 'ethereum', binanceSymbol: 'ETHUSDT', decimals: 2 },
  { symbol: 'BNB-USDT', base: 'BNB', quote: 'USDT', coingeckoId: 'binancecoin', binanceSymbol: 'BNBUSDT', decimals: 2 },
  { symbol: 'SOL-USDT', base: 'SOL', quote: 'USDT', coingeckoId: 'solana', binanceSymbol: 'SOLUSDT', decimals: 2 },
  { symbol: 'XRP-USDT', base: 'XRP', quote: 'USDT', coingeckoId: 'ripple', binanceSymbol: 'XRPUSDT', decimals: 4 },
  { symbol: 'DOGE-USDT', base: 'DOGE', quote: 'USDT', coingeckoId: 'dogecoin', binanceSymbol: 'DOGEUSDT', decimals: 5 },
  { symbol: 'BTU-USDT', base: 'BTU', quote: 'USDT', coingeckoId: null, binanceSymbol: null, decimals: 4 },
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

// Binance public API klines intervals
export const TIMEFRAMES = [
  { label: '1m', value: '1m', interval: '1m', limit: 500 },
  { label: '5m', value: '5m', interval: '5m', limit: 500 },
  { label: '15m', value: '15m', interval: '15m', limit: 300 },
  { label: '30m', value: '30m', interval: '30m', limit: 200 },
  { label: '1H', value: '1h', interval: '1h', limit: 200 },
  { label: '4H', value: '4h', interval: '4h', limit: 200 },
  { label: '1D', value: '1d', interval: '1d', limit: 200 },
] as const;

// ==========================================
// FUTURES CONSTANTS
// ==========================================

export const FUTURES_PAIRS = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', coingeckoId: 'bitcoin', binanceSymbol: 'BTCUSDT', decimals: 2, maxLeverage: 125 },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', coingeckoId: 'ethereum', binanceSymbol: 'ETHUSDT', decimals: 2, maxLeverage: 100 },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', coingeckoId: 'binancecoin', binanceSymbol: 'BNBUSDT', decimals: 2, maxLeverage: 75 },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', coingeckoId: 'solana', binanceSymbol: 'SOLUSDT', decimals: 2, maxLeverage: 50 },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', coingeckoId: 'ripple', binanceSymbol: 'XRPUSDT', decimals: 4, maxLeverage: 75 },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', coingeckoId: 'dogecoin', binanceSymbol: 'DOGEUSDT', decimals: 5, maxLeverage: 50 },
] as const;

export const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125] as const;

export const FUTURES_FEE = 0.0004; // 0.04% taker fee
export const FUTURES_MAKER_FEE = 0.0002; // 0.02% maker fee
export const FUNDING_RATE = 0.0001; // 0.01% display only

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
