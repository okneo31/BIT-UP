'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWalletStore } from '@/stores/walletStore';
import { createClient } from '@/lib/supabase/client';
import type { Launchpool } from '@/types';
import PoolCard from '@/components/launchpool/PoolCard';
import StakeModal from '@/components/launchpool/StakeModal';
import Spinner from '@/components/ui/Spinner';

export default function LaunchpoolPage() {
  const { user, initialized, initialize } = useAuthStore();
  const { fetchWallets } = useWalletStore();
  const [pools, setPools] = useState<Launchpool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<Launchpool | null>(null);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    if (user) fetchWallets();
  }, [user, fetchWallets]);

  useEffect(() => {
    const fetchPools = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('launchpools')
        .select('*')
        .order('start_date', { ascending: true });
      setPools(data || []);
      setLoading(false);
    };
    fetchPools();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Launchpool</h1>
        <p className="text-sm text-text-secondary mt-1">Stake your tokens to earn rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} onStake={setSelectedPool} />
        ))}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-20 text-text-third">
          No launchpools available at the moment
        </div>
      )}

      <StakeModal
        isOpen={!!selectedPool}
        pool={selectedPool}
        onClose={() => setSelectedPool(null)}
      />
    </div>
  );
}
