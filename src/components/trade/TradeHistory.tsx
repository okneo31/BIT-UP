'use client';

import { useEffect, useCallback } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { createClient } from '@/lib/supabase/client';
import { TRADING_PAIRS } from '@/lib/constants';

export default function TradeHistory() {
  const { currentPair, recentTrades, setRecentTrades } = useTradeStore();

  const fetchTrades = useCallback(async () => {
    const supabase = createClient();
    const { data: pairData } = await supabase
      .from('trading_pairs')
      .select('id')
      .eq('symbol', currentPair)
      .single();

    if (!pairData) return;

    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('pair_id', pairData.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setRecentTrades(data);
  }, [currentPair, setRecentTrades]);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);
  const formatPrice = (price: number) => price.toFixed(pair?.decimals || 2);
  const formatQty = (qty: number) => qty < 1 ? qty.toFixed(6) : qty < 1000 ? qty.toFixed(4) : qty.toFixed(2);
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="bg-bg-secondary rounded-lg border border-border h-full">
      <div className="p-2 border-b border-border">
        <h3 className="text-xs font-medium text-text-secondary">Recent Trades</h3>
      </div>
      <div className="text-[11px]">
        <div className="grid grid-cols-3 px-2 py-1 text-text-third border-b border-border">
          <span>Price(USDT)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Time</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {recentTrades.length === 0 ? (
            <div className="text-center py-8 text-text-third text-xs">No trades yet</div>
          ) : (
            recentTrades.map((trade, i) => {
              const prevPrice = i < recentTrades.length - 1 ? Number(recentTrades[i + 1]?.price || 0) : 0;
              const isUp = Number(trade.price) >= prevPrice;
              return (
                <div key={trade.id} className="grid grid-cols-3 px-2 py-0.5 hover:bg-bg-tertiary">
                  <span className={isUp ? 'text-green' : 'text-red'}>{formatPrice(Number(trade.price))}</span>
                  <span className="text-right text-text-primary">{formatQty(Number(trade.quantity))}</span>
                  <span className="text-right text-text-secondary">{formatTime(trade.created_at)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
