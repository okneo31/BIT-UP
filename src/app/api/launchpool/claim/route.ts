import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stakeId } = await request.json();

    if (!stakeId) {
      return NextResponse.json({ error: 'stakeId is required' }, { status: 400 });
    }

    // Get stake with pool info
    const { data: stake } = await supabase
      .from('stakes')
      .select('*, launchpools(*)')
      .eq('id', stakeId)
      .eq('user_id', user.id)
      .single();

    if (!stake) {
      return NextResponse.json({ error: 'Stake not found' }, { status: 404 });
    }

    const pool = stake.launchpools;

    // Calculate reward based on time staked and APY
    const stakedAt = new Date(stake.staked_at).getTime();
    const now = Date.now();
    const daysStaked = (now - stakedAt) / (1000 * 60 * 60 * 24);
    const dailyRate = Number(pool.apy) / 365 / 100;
    const totalReward = Number(stake.amount) * dailyRate * daysStaked;
    const claimable = totalReward - Number(stake.reward_claimed);

    if (claimable <= 0) {
      return NextResponse.json({ error: 'No rewards to claim' }, { status: 400 });
    }

    // Add reward to wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', pool.reward_token)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: 'Reward wallet not found' }, { status: 404 });
    }

    const newBalance = Number(wallet.available) + claimable;
    await supabase
      .from('wallets')
      .update({ available: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    // Update stake
    await supabase
      .from('stakes')
      .update({
        reward_earned: totalReward,
        reward_claimed: totalReward,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stakeId);

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      currency: pool.reward_token,
      type: 'reward',
      amount: claimable,
      balance_after: newBalance,
      description: `Claimed ${claimable.toFixed(4)} ${pool.reward_token} from ${pool.name}`,
    });

    return NextResponse.json({ success: true, claimed: claimable });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
