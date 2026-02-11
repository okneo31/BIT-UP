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
    const { positionId, closePrice } = body;

    if (!positionId || !closePrice) {
      return NextResponse.json({ error: 'positionId and closePrice are required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('close_futures_position', {
      p_user_id: user.id,
      p_position_id: positionId,
      p_close_price: closePrice,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Close futures position error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
