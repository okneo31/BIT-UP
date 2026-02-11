'use client';

import { useEffect, useCallback, useState } from 'react';
import { useFuturesStore } from '@/stores/futuresStore';
import { useWalletStore } from '@/stores/walletStore';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function PositionPanel() {
  const { positions, setPositions, removePosition, currentPrice } = useFuturesStore();
  const { fetchWallets } = useWalletStore();
  const { user } = useAuthStore();
  const [closingId, setClosingId] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase.rpc('get_futures_positions', {
      p_user_id: user.id,
    });

    if (data) setPositions(Array.isArray(data) ? data : []);
  }, [user, setPositions]);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  const handleClose = async (positionId: string, markPrice: number) => {
    setClosingId(positionId);
    try {
      const res = await fetch('/api/futures/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId, closePrice: markPrice }),
      });
      const data = await res.json();
      if (data.success) {
        removePosition(positionId);
        fetchWallets();
      }
    } catch {}
    setClosingId(null);
  };

  const calculatePnl = (pos: any) => {
    const mark = currentPrice || 0;
    if (mark <= 0) return 0;
    if (pos.side === 'long') {
      return (mark - Number(pos.entry_price)) * Number(pos.quantity);
    } else {
      return (Number(pos.entry_price) - mark) * Number(pos.quantity);
    }
  };

  const calculateRoe = (pos: any) => {
    const pnl = calculatePnl(pos);
    const margin = Number(pos.margin);
    if (margin <= 0) return 0;
    return (pnl / margin) * 100;
  };

  if (!user) return null;

  return (
    <div>
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-secondary">Positions ({positions.length})</h3>
      </div>
      {positions.length === 0 ? (
        <div className="text-center py-6 text-text-third text-xs">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-third border-b border-border">
                <th className="text-left px-3 py-2 font-normal">Symbol</th>
                <th className="text-left px-3 py-2 font-normal">Side</th>
                <th className="text-right px-3 py-2 font-normal">Size</th>
                <th className="text-right px-3 py-2 font-normal">Entry Price</th>
                <th className="text-right px-3 py-2 font-normal">Mark Price</th>
                <th className="text-right px-3 py-2 font-normal">Liq. Price</th>
                <th className="text-right px-3 py-2 font-normal">Margin</th>
                <th className="text-right px-3 py-2 font-normal">PnL (ROE%)</th>
                <th className="text-right px-3 py-2 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos: any) => {
                const pnl = calculatePnl(pos);
                const roe = calculateRoe(pos);
                const isProfit = pnl >= 0;
                return (
                  <tr key={pos.id} className="border-b border-border hover:bg-bg-tertiary">
                    <td className="px-3 py-2">
                      <span className="text-text-primary font-medium">{pos.symbol || '--'}</span>
                      <span className="text-xs text-accent ml-1">{pos.leverage}x</span>
                    </td>
                    <td className={`px-3 py-2 font-medium ${pos.side === 'long' ? 'text-green' : 'text-red'}`}>
                      {pos.side.toUpperCase()}
                    </td>
                    <td className="text-right px-3 py-2 text-text-primary">
                      {Number(pos.quantity).toFixed(4)}
                    </td>
                    <td className="text-right px-3 py-2 text-text-primary">
                      {Number(pos.entry_price).toFixed(2)}
                    </td>
                    <td className="text-right px-3 py-2 text-text-primary">
                      {currentPrice > 0 ? currentPrice.toFixed(2) : '--'}
                    </td>
                    <td className="text-right px-3 py-2 text-accent">
                      {Number(pos.liquidation_price).toFixed(2)}
                    </td>
                    <td className="text-right px-3 py-2 text-text-primary">
                      {Number(pos.margin).toFixed(2)}
                    </td>
                    <td className={`text-right px-3 py-2 font-medium ${isProfit ? 'text-green' : 'text-red'}`}>
                      {isProfit ? '+' : ''}{pnl.toFixed(2)} USDT
                      <br />
                      <span className="text-xs">({isProfit ? '+' : ''}{roe.toFixed(2)}%)</span>
                    </td>
                    <td className="text-right px-3 py-2">
                      <Button
                        variant="red"
                        size="sm"
                        loading={closingId === pos.id}
                        onClick={() => handleClose(pos.id, currentPrice)}
                        disabled={currentPrice <= 0}
                      >
                        Close
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
