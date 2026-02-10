'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTradeStore } from '@/stores/tradeStore';

export function useRealtimeTrades(pairId: string | null) {
  const { addTrade } = useTradeStore();

  useEffect(() => {
    if (!pairId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`trades:${pairId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `pair_id=eq.${pairId}`,
        },
        (payload) => {
          if (payload.new) {
            addTrade(payload.new as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId, addTrade]);
}
