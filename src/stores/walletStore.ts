import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Wallet, Transaction } from '@/types';

interface WalletState {
  wallets: Wallet[];
  transactions: Transaction[];
  loading: boolean;
  fetchWallets: () => Promise<void>;
  fetchTransactions: (currency?: string) => Promise<void>;
  updateWallet: (wallet: Wallet) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  transactions: [],
  loading: false,

  fetchWallets: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .order('currency');
    set({ wallets: data || [], loading: false });
  },

  fetchTransactions: async (currency?: string) => {
    const supabase = createClient();
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (currency) {
      query = query.eq('currency', currency);
    }

    const { data } = await query;
    set({ transactions: data || [] });
  },

  updateWallet: (wallet) => {
    set((state) => ({
      wallets: state.wallets.map((w) =>
        w.id === wallet.id ? wallet : w
      ),
    }));
  },
}));
