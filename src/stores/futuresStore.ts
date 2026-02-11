import { create } from 'zustand';
import type { FuturesOrder, FuturesPosition, OrderBook, MarginMode } from '@/types';

interface FuturesState {
  currentPair: string;
  orderBook: OrderBook;
  openOrders: FuturesOrder[];
  positions: FuturesPosition[];
  currentPrice: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  leverage: number;
  marginMode: MarginMode;
  setCurrentPair: (pair: string) => void;
  setOrderBook: (ob: OrderBook) => void;
  setOpenOrders: (orders: FuturesOrder[]) => void;
  setPositions: (positions: FuturesPosition[]) => void;
  setMarketData: (data: { price: number; change: number; high: number; low: number; volume: number }) => void;
  setLeverage: (leverage: number) => void;
  setMarginMode: (mode: MarginMode) => void;
  removeOrder: (orderId: string) => void;
  removePosition: (positionId: string) => void;
}

export const useFuturesStore = create<FuturesState>((set) => ({
  currentPair: 'BTCUSDT',
  orderBook: { bids: [], asks: [] },
  openOrders: [],
  positions: [],
  currentPrice: 0,
  priceChange24h: 0,
  high24h: 0,
  low24h: 0,
  volume24h: 0,
  leverage: 10,
  marginMode: 'cross',

  setCurrentPair: (pair) => set({ currentPair: pair }),
  setOrderBook: (orderBook) => set({ orderBook }),
  setOpenOrders: (openOrders) => set({ openOrders }),
  setPositions: (positions) => set({ positions }),
  setMarketData: ({ price, change, high, low, volume }) =>
    set({ currentPrice: price, priceChange24h: change, high24h: high, low24h: low, volume24h: volume }),
  setLeverage: (leverage) => set({ leverage }),
  setMarginMode: (marginMode) => set({ marginMode }),
  removeOrder: (orderId) =>
    set((state) => ({ openOrders: state.openOrders.filter((o) => o.id !== orderId) })),
  removePosition: (positionId) =>
    set((state) => ({ positions: state.positions.filter((p) => p.id !== positionId) })),
}));
