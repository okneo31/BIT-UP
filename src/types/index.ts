export interface Profile {
  id: string;
  email: string;
  nickname: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  available: number;
  locked: number;
  updated_at: string;
}

export interface TradingPair {
  id: string;
  symbol: string;
  base_currency: string;
  quote_currency: string;
  min_quantity: number;
  tick_size: number;
  is_active: boolean;
  coingecko_id: string | null;
}

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type OrderStatus = 'open' | 'partial' | 'filled' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  pair_id: string;
  side: OrderSide;
  type: OrderType;
  price: number | null;
  quantity: number;
  filled_quantity: number;
  status: OrderStatus;
  fee_currency: string;
  fee_amount: number;
  created_at: string;
  updated_at: string;
  trading_pairs?: TradingPair;
}

export interface Trade {
  id: string;
  pair_id: string;
  buy_order_id: string;
  sell_order_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  quantity: number;
  buyer_fee: number;
  seller_fee: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  currency: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'fee' | 'bonus' | 'stake' | 'unstake' | 'reward';
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Launchpool {
  id: string;
  name: string;
  description: string;
  reward_token: string;
  stake_token: string;
  total_reward: number;
  distributed_reward: number;
  apy: number;
  min_stake: number;
  max_stake: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Stake {
  id: string;
  user_id: string;
  pool_id: string;
  amount: number;
  reward_earned: number;
  reward_claimed: number;
  staked_at: string;
  updated_at: string;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  count: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
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

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
