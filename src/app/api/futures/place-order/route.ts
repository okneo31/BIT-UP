import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pairId, side, positionSide, type, price, quantity, leverage, marginMode, reduceOnly } = body;

    if (!pairId || !side || !positionSide || !type || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'Invalid side' }, { status: 400 });
    }

    if (!['long', 'short'].includes(positionSide)) {
      return NextResponse.json({ error: 'Invalid position side' }, { status: 400 });
    }

    if (!['limit', 'market'].includes(type)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('place_futures_order', {
      p_user_id: user.id,
      p_pair_id: pairId,
      p_side: side,
      p_position_side: positionSide,
      p_type: type,
      p_price: price || null,
      p_quantity: quantity,
      p_leverage: leverage || 1,
      p_margin_mode: marginMode || 'cross',
      p_reduce_only: reduceOnly || false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Place futures order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
