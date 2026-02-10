import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { poolId, amount } = await request.json();

    if (!poolId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get pool info
    const { data: pool, error: poolError } = await supabase
      .from('launchpools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (poolError || !pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    if (!pool.is_active) {
      return NextResponse.json({ error: 'Pool is not active' }, { status: 400 });
    }

    if (amount < Number(pool.min_stake) || amount > Number(pool.max_stake)) {
      return NextResponse.json({ error: `Stake amount must be between ${pool.min_stake} and ${pool.max_stake}` }, { status: 400 });
    }

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', pool.stake_token)
      .single();

    if (!wallet || Number(wallet.available) < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct from wallet
    const newBalance = Number(wallet.available) - amount;
    await supabase
      .from('wallets')
      .update({ available: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    // Create stake
    const { data: stake, error: stakeError } = await supabase
      .from('stakes')
      .insert({
        user_id: user.id,
        pool_id: poolId,
        amount,
      })
      .select()
      .single();

    if (stakeError) {
      // Rollback wallet
      await supabase
        .from('wallets')
        .update({ available: Number(wallet.available), updated_at: new Date().toISOString() })
        .eq('id', wallet.id);
      return NextResponse.json({ error: stakeError.message }, { status: 500 });
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      currency: pool.stake_token,
      type: 'stake',
      amount: -amount,
      balance_after: newBalance,
      description: `Staked ${amount} ${pool.stake_token} in ${pool.name}`,
    });

    return NextResponse.json({ success: true, stake });
  } catch (error) {
    console.error('Stake error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
