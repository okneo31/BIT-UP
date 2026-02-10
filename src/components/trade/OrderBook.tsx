'use client';

import { useEffect, useCallback } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { createClient } from '@/lib/supabase/client';
import { TRADING_PAIRS } from '@/lib/constants';

export default function OrderBook() {
  const { currentPair, orderBook, setOrderBook, currentPrice } = useTradeStore();

  const fetchOrderBook = useCallback(async () => {
    const supabase = createClient();
    const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);
    if (!pair) return;

    const { data: pairData } = await supabase
      .from('trading_pairs')
      .select('id')
      .eq('symbol', currentPair)
      .single();

    if (!pairData) return;

    const { data } = await supabase.rpc('get_orderbook', {
      p_pair_id: pairData.id,
      p_limit: 15,
    });

    if (data) {
      setOrderBook({
        bids: (data.bids || []).map((b: any) => ({
          price: Number(b.price),
          quantity: Number(b.quantity),
          total: Number(b.price) * Number(b.quantity),
          count: b.count,
        })),
        asks: (data.asks || []).reverse().map((a: any) => ({
          price: Number(a.price),
          quantity: Number(a.quantity),
          total: Number(a.price) * Number(a.quantity),
          count: a.count,
        })),
      });
    }
  }, [currentPair, setOrderBook]);

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 3000);
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  const maxBidQty = Math.max(...orderBook.bids.map(b => b.quantity), 1);
  const maxAskQty = Math.max(...orderBook.asks.map(a => a.quantity), 1);

  const formatPrice = (price: number) => {
    const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);
    return price.toFixed(pair?.decimals || 2);
  };

  const formatQty = (qty: number) => qty < 1 ? qty.toFixed(6) : qty < 1000 ? qty.toFixed(4) : qty.toFixed(2);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border h-full">
      <div className="p-2 border-b border-border">
        <h3 className="text-xs font-medium text-text-secondary">Order Book</h3>
      </div>
      <div className="text-[11px]">
        <div className="grid grid-cols-3 px-2 py-1 text-text-third border-b border-border">
          <span>Price(USDT)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (sell orders) - reversed to show lowest at bottom */}
        <div className="max-h-[200px] overflow-hidden flex flex-col-reverse">
          {orderBook.asks.map((ask, i) => (
            <div key={`ask-${i}`} className="grid grid-cols-3 px-2 py-0.5 relative hover:bg-bg-tertiary cursor-pointer">
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-bg"
                style={{ width: `${(ask.quantity / maxAskQty) * 100}%` }}
              />
              <span className="text-red relative z-10">{formatPrice(ask.price)}</span>
              <span className="text-right text-text-primary relative z-10">{formatQty(ask.quantity)}</span>
              <span className="text-right text-text-secondary relative z-10">{formatQty(ask.total)}</span>
            </div>
          ))}
        </div>

        {/* Current price */}
        <div className="px-2 py-1.5 border-y border-border bg-bg-primary">
          <span className={`text-sm font-bold ${currentPrice > 0 ? 'text-green' : 'text-text-primary'}`}>
            {currentPrice > 0 ? formatPrice(currentPrice) : '--'}
          </span>
        </div>

        {/* Bids (buy orders) */}
        <div className="max-h-[200px] overflow-hidden">
          {orderBook.bids.map((bid, i) => (
            <div key={`bid-${i}`} className="grid grid-cols-3 px-2 py-0.5 relative hover:bg-bg-tertiary cursor-pointer">
              <div
                className="absolute right-0 top-0 bottom-0 bg-green-bg"
                style={{ width: `${(bid.quantity / maxBidQty) * 100}%` }}
              />
              <span className="text-green relative z-10">{formatPrice(bid.price)}</span>
              <span className="text-right text-text-primary relative z-10">{formatQty(bid.quantity)}</span>
              <span className="text-right text-text-secondary relative z-10">{formatQty(bid.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
