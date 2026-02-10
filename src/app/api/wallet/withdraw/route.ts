import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currency, amount } = await request.json();

    if (!currency || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal parameters' }, { status: 400 });
    }

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', currency)
      .single();

    if (fetchError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (Number(wallet.available) < Number(amount)) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const newBalance = Number(wallet.available) - Number(amount);

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ available: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      currency,
      type: 'withdraw',
      amount: -amount,
      balance_after: newBalance,
      description: `Simulated withdrawal of ${amount} ${currency}`,
    });

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
