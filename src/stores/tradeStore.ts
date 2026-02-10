import { create } from 'zustand';
import type { Order, OrderBook, Trade, TradingPair } from '@/types';

interface TradeState {
  currentPair: string;
  pairs: TradingPair[];
  orderBook: OrderBook;
  recentTrades: Trade[];
  openOrders: Order[];
  currentPrice: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  setCurrentPair: (pair: string) => void;
  setPairs: (pairs: TradingPair[]) => void;
  setOrderBook: (ob: OrderBook) => void;
  setRecentTrades: (trades: Trade[]) => void;
  setOpenOrders: (orders: Order[]) => void;
  setMarketData: (data: { price: number; change: number; high: number; low: number; volume: number }) => void;
  addTrade: (trade: Trade) => void;
  removeOrder: (orderId: string) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  currentPair: 'BTC-USDT',
  pairs: [],
  orderBook: { bids: [], asks: [] },
  recentTrades: [],
  openOrders: [],
  currentPrice: 0,
  priceChange24h: 0,
  high24h: 0,
  low24h: 0,
  volume24h: 0,

  setCurrentPair: (pair) => set({ currentPair: pair }),
  setPairs: (pairs) => set({ pairs }),
  setOrderBook: (orderBook) => set({ orderBook }),
  setRecentTrades: (recentTrades) => set({ recentTrades }),
  setOpenOrders: (openOrders) => set({ openOrders }),
  setMarketData: ({ price, change, high, low, volume }) =>
    set({ currentPrice: price, priceChange24h: change, high24h: high, low24h: low, volume24h: volume }),
  addTrade: (trade) =>
    set((state) => ({ recentTrades: [trade, ...state.recentTrades].slice(0, 50) })),
  removeOrder: (orderId) =>
    set((state) => ({ openOrders: state.openOrders.filter((o) => o.id !== orderId) })),
}));
