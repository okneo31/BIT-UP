'use client';

import { useEffect, useCallback } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function OpenOrders() {
  const { openOrders, setOpenOrders, removeOrder } = useTradeStore();
  const { user } = useAuthStore();

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, trading_pairs(*)')
      .eq('user_id', user.id)
      .in('status', ['open', 'partial'])
      .order('created_at', { ascending: false });

    if (data) setOpenOrders(data);
  }, [user, setOpenOrders]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleCancel = async (orderId: string) => {
    try {
      const res = await fetch('/api/trade/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        removeOrder(orderId);
      }
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      <div className="p-2 border-b border-border">
        <h3 className="text-xs font-medium text-text-secondary">Open Orders ({openOrders.length})</h3>
      </div>
      {openOrders.length === 0 ? (
        <div className="text-center py-6 text-text-third text-xs">No open orders</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-third border-b border-border">
                <th className="text-left px-3 py-2 font-normal">Pair</th>
                <th className="text-left px-3 py-2 font-normal">Side</th>
                <th className="text-right px-3 py-2 font-normal">Price</th>
                <th className="text-right px-3 py-2 font-normal">Amount</th>
                <th className="text-right px-3 py-2 font-normal">Filled</th>
                <th className="text-right px-3 py-2 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {openOrders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-bg-tertiary">
                  <td className="px-3 py-2 text-text-primary">{order.trading_pairs?.symbol || '--'}</td>
                  <td className={`px-3 py-2 ${order.side === 'buy' ? 'text-green' : 'text-red'}`}>
                    {order.side.toUpperCase()}
                  </td>
                  <td className="text-right px-3 py-2 text-text-primary">
                    {order.price ? Number(order.price).toFixed(2) : 'Market'}
                  </td>
                  <td className="text-right px-3 py-2 text-text-primary">{Number(order.quantity).toFixed(6)}</td>
                  <td className="text-right px-3 py-2 text-text-secondary">
                    {((Number(order.filled_quantity) / Number(order.quantity)) * 100).toFixed(1)}%
                  </td>
                  <td className="text-right px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(order.id)}>
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
