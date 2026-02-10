'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import type { Launchpool, Stake } from '@/types';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface StakeModalProps {
  isOpen: boolean;
  pool: Launchpool | null;
  onClose: () => void;
}

export default function StakeModal({ isOpen, pool, onClose }: StakeModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [myStakes, setMyStakes] = useState<Stake[]>([]);
  const { fetchWallets, wallets } = useWalletStore();

  useEffect(() => {
    if (isOpen && pool) {
      fetchMyStakes();
    }
  }, [isOpen, pool]);

  const fetchMyStakes = async () => {
    if (!pool) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('stakes')
      .select('*')
      .eq('pool_id', pool.id)
      .order('staked_at', { ascending: false });
    setMyStakes(data || []);
  };

  const wallet = wallets.find(w => w.currency === pool?.stake_token);
  const available = Number(wallet?.available || 0);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pool || !amount || Number(amount) <= 0) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/launchpool/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId: pool.id, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Staked successfully!' });
      setAmount('');
      fetchWallets();
      fetchMyStakes();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  const handleClaim = async (stakeId: string) => {
    setClaimLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/launchpool/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage({ type: 'success', text: `Claimed ${Number(data.claimed).toFixed(4)} ${pool?.reward_token}!` });
      fetchWallets();
      fetchMyStakes();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
    setClaimLoading(false);
  };

  if (!pool) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stake in ${pool.name}`}>
      <div className="space-y-4">
        <div className="bg-bg-primary rounded-lg p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-third">APY</span>
            <span className="text-green font-bold">{Number(pool.apy).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-third">Min/Max Stake</span>
            <span className="text-text-primary">{Number(pool.min_stake).toLocaleString()} - {Number(pool.max_stake).toLocaleString()} {pool.stake_token}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-third">Available</span>
            <span className="text-text-primary">{available.toLocaleString(undefined, { maximumFractionDigits: 4 })} {pool.stake_token}</span>
          </div>
        </div>

        <form onSubmit={handleStake} className="space-y-3">
          <Input
            type="number"
            placeholder={`Min ${Number(pool.min_stake).toLocaleString()}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            suffix={pool.stake_token}
            step="any"
          />
          <div className="flex gap-1">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setAmount((available * pct).toFixed(4))}
                className="flex-1 text-xs py-1 bg-bg-tertiary text-text-secondary hover:text-text-primary rounded"
              >
                {pct * 100}%
              </button>
            ))}
          </div>
          <Button type="submit" variant="primary" fullWidth loading={loading} disabled={!amount || Number(amount) <= 0}>
            Stake {pool.stake_token}
          </Button>
        </form>

        {myStakes.length > 0 && (
          <div>
            <h4 className="text-xs text-text-secondary mb-2">My Stakes</h4>
            <div className="space-y-2">
              {myStakes.map((stake) => {
                const stakedAt = new Date(stake.staked_at).getTime();
                const daysStaked = (Date.now() - stakedAt) / (1000 * 60 * 60 * 24);
                const dailyRate = Number(pool.apy) / 365 / 100;
                const estimatedReward = Number(stake.amount) * dailyRate * daysStaked;
                const claimable = estimatedReward - Number(stake.reward_claimed);

                return (
                  <div key={stake.id} className="bg-bg-primary rounded-lg p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-text-third">Staked</span>
                      <span className="text-text-primary">{Number(stake.amount).toLocaleString()} {pool.stake_token}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-text-third">Pending Reward</span>
                      <span className="text-green">{claimable.toFixed(4)} {pool.reward_token}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => handleClaim(stake.id)}
                      loading={claimLoading}
                      disabled={claimable <= 0}
                    >
                      Claim Reward
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-green' : 'text-red'}`}>
            {message.text}
          </p>
        )}
      </div>
    </Modal>
  );
}
