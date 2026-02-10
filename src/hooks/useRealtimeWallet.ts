'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWalletStore } from '@/stores/walletStore';

export function useRealtimeWallet(userId: string | null) {
  const { updateWallet } = useWalletStore();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`wallet:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            updateWallet(payload.new as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, updateWallet]);
}
