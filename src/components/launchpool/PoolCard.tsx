'use client';

import { CURRENCY_INFO } from '@/lib/constants';
import type { Launchpool } from '@/types';
import Button from '@/components/ui/Button';

interface PoolCardProps {
  pool: Launchpool;
  onStake: (pool: Launchpool) => void;
}

export default function PoolCard({ pool, onStake }: PoolCardProps) {
  const rewardInfo = CURRENCY_INFO[pool.reward_token];
  const stakeInfo = CURRENCY_INFO[pool.stake_token];
  const now = new Date();
  const start = new Date(pool.start_date);
  const end = new Date(pool.end_date);
  const isActive = now >= start && now <= end && pool.is_active;
  const isUpcoming = now < start;
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, (Number(pool.distributed_reward) / Number(pool.total_reward)) * 100);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden hover:border-accent/30 transition-colors">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-bg-primary"
              style={{ backgroundColor: rewardInfo?.color || '#f0b90b' }}
            >
              {rewardInfo?.icon || pool.reward_token[0]}
            </span>
            <div>
              <h3 className="text-base font-bold text-text-primary">{pool.name}</h3>
              <p className="text-xs text-text-secondary">
                Stake {pool.stake_token} → Earn {pool.reward_token}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            isActive ? 'bg-green-bg text-green' : isUpcoming ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-text-third'
          }`}>
            {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Ended'}
          </span>
        </div>

        <p className="text-xs text-text-secondary mb-4">{pool.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-text-third mb-0.5">APY</p>
            <p className="text-lg font-bold text-green">{Number(pool.apy).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-text-third mb-0.5">Days Left</p>
            <p className="text-lg font-bold text-text-primary">{isUpcoming ? `Starts in ${Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}d` : `${daysLeft}d`}</p>
          </div>
          <div>
            <p className="text-xs text-text-third mb-0.5">Total Reward</p>
            <p className="text-sm text-text-primary">{Number(pool.total_reward).toLocaleString()} {pool.reward_token}</p>
          </div>
          <div>
            <p className="text-xs text-text-third mb-0.5">Stake Range</p>
            <p className="text-sm text-text-primary">{Number(pool.min_stake).toLocaleString()} - {Number(pool.max_stake).toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-third">Distribution Progress</span>
            <span className="text-text-secondary">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={() => onStake(pool)}
          disabled={!isActive}
        >
          {isActive ? `Stake ${pool.stake_token}` : isUpcoming ? 'Coming Soon' : 'Ended'}
        </Button>
      </div>
    </div>
  );
}
