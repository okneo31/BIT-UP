import { createClient } from '@/lib/supabase/client';
import type { OrderBook, Order, Trade } from '@/types';

const supabase = createClient();

export async function placeOrder(params: {
  pairId: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price?: number;
  quantity: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('place_order', {
    p_user_id: user.id,
    p_pair_id: params.pairId,
    p_side: params.side,
    p_type: params.type,
    p_price: params.price || null,
    p_quantity: params.quantity,
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function cancelOrder(orderId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('cancel_order', {
    p_user_id: user.id,
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getOrderBook(pairId: string): Promise<OrderBook> {
  const { data, error } = await supabase.rpc('get_orderbook', {
    p_pair_id: pairId,
    p_limit: 20,
  });

  if (error) throw new Error(error.message);

  return {
    bids: (data?.bids || []).map((b: { price: number; quantity: number; count: number }) => ({
      price: Number(b.price),
      quantity: Number(b.quantity),
      total: Number(b.price) * Number(b.quantity),
      count: b.count,
    })),
    asks: (data?.asks || []).map((a: { price: number; quantity: number; count: number }) => ({
      price: Number(a.price),
      quantity: Number(a.quantity),
      total: Number(a.price) * Number(a.quantity),
      count: a.count,
    })),
  };
}

export async function getOpenOrders(pairId?: string): Promise<Order[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('orders')
    .select('*, trading_pairs(*)')
    .eq('user_id', user.id)
    .in('status', ['open', 'partial'])
    .order('created_at', { ascending: false });

  if (pairId) {
    query = query.eq('pair_id', pairId);
  }

  const { data } = await query;
  return data || [];
}

export async function getRecentTrades(pairId: string, limit = 30): Promise<Trade[]> {
  const { data } = await supabase
    .from('trades')
    .select('*')
    .eq('pair_id', pairId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
