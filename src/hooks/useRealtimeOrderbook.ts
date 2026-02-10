'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTradeStore } from '@/stores/tradeStore';

export function useRealtimeOrderbook(pairId: string | null) {
  const { setOrderBook } = useTradeStore();

  useEffect(() => {
    if (!pairId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`orderbook:${pairId}`)
      .on('broadcast', { event: 'orderbook_update' }, (payload) => {
        if (payload.payload) {
          setOrderBook(payload.payload);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId, setOrderBook]);
}
