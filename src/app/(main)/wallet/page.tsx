'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWalletStore } from '@/stores/walletStore';
import BalanceOverview from '@/components/wallet/BalanceOverview';
import AssetTable from '@/components/wallet/AssetTable';
import Spinner from '@/components/ui/Spinner';

export default function WalletPage() {
  const { user, initialized, initialize } = useAuthStore();
  const { fetchWallets, loading } = useWalletStore();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    if (user) fetchWallets();
  }, [user, fetchWallets]);

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Wallet</h1>
      <BalanceOverview />
      <AssetTable />
    </div>
  );
}
