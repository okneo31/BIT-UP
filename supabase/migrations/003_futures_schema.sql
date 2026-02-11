-- ==========================================
-- FUTURES SCHEMA
-- USDT-M Perpetual Futures trading tables and functions
-- ==========================================

-- ==========================================
-- 1. FUTURES PAIRS
-- ==========================================
CREATE TABLE futures_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL UNIQUE,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL DEFAULT 'USDT',
  max_leverage INT NOT NULL DEFAULT 125,
  maintenance_margin_rate DECIMAL(10, 6) NOT NULL DEFAULT 0.005,
  min_quantity DECIMAL(30, 10) NOT NULL DEFAULT 0.001,
  tick_size DECIMAL(30, 10) NOT NULL DEFAULT 0.01,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  coingecko_id TEXT
);

INSERT INTO futures_pairs (symbol, base_currency, quote_currency, max_leverage, maintenance_margin_rate, min_quantity, tick_size, coingecko_id) VALUES
  ('BTCUSDT', 'BTC', 'USDT', 125, 0.004, 0.001, 0.01, 'bitcoin'),
  ('ETHUSDT', 'ETH', 'USDT', 100, 0.005, 0.001, 0.01, 'ethereum'),
  ('BNBUSDT', 'BNB', 'USDT', 75, 0.006, 0.01, 0.01, 'binancecoin'),
  ('SOLUSDT', 'SOL', 'USDT', 50, 0.008, 0.01, 0.01, 'solana'),
  ('XRPUSDT', 'XRP', 'USDT', 75, 0.006, 1, 0.0001, 'ripple'),
  ('DOGEUSDT', 'DOGE', 'USDT', 50, 0.008, 1, 0.00001, 'dogecoin');

-- ==========================================
-- 2. FUTURES POSITIONS
-- ==========================================
CREATE TABLE futures_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES futures_pairs(id),
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  leverage INT NOT NULL DEFAULT 1,
  margin_mode TEXT NOT NULL DEFAULT 'cross' CHECK (margin_mode IN ('cross', 'isolated')),
  entry_price DECIMAL(30, 10) NOT NULL,
  quantity DECIMAL(30, 10) NOT NULL,
  margin DECIMAL(30, 10) NOT NULL,
  liquidation_price DECIMAL(30, 10) NOT NULL DEFAULT 0,
  unrealized_pnl DECIMAL(30, 10) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pair_id, side)
);

ALTER TABLE futures_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own futures positions" ON futures_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own futures positions" ON futures_positions FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_futures_positions_user ON futures_positions(user_id);
CREATE INDEX idx_futures_positions_pair ON futures_positions(pair_id);

-- ==========================================
-- 3. FUTURES ORDERS
-- ==========================================
CREATE TABLE futures_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES futures_pairs(id),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  position_side TEXT NOT NULL CHECK (position_side IN ('long', 'short')),
  type TEXT NOT NULL CHECK (type IN ('limit', 'market')),
  price DECIMAL(30, 10),
  quantity DECIMAL(30, 10) NOT NULL,
  filled_quantity DECIMAL(30, 10) NOT NULL DEFAULT 0,
  leverage INT NOT NULL DEFAULT 1,
  margin_mode TEXT NOT NULL DEFAULT 'cross' CHECK (margin_mode IN ('cross', 'isolated')),
  reduce_only BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'filled', 'cancelled')),
  fee_amount DECIMAL(30, 10) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE futures_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own futures orders" ON futures_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own futures orders" ON futures_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own futures orders" ON futures_orders FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_futures_orders_pair_status ON futures_orders(pair_id, status);
CREATE INDEX idx_futures_orders_user ON futures_orders(user_id);
CREATE INDEX idx_futures_orders_matching ON futures_orders(pair_id, side, status, price);

-- ==========================================
-- 4. FUTURES TRADES
-- ==========================================
CREATE TABLE futures_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair_id UUID NOT NULL REFERENCES futures_pairs(id),
  buy_order_id UUID NOT NULL REFERENCES futures_orders(id),
  sell_order_id UUID NOT NULL REFERENCES futures_orders(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  price DECIMAL(30, 10) NOT NULL,
  quantity DECIMAL(30, 10) NOT NULL,
  buyer_fee DECIMAL(30, 10) NOT NULL DEFAULT 0,
  seller_fee DECIMAL(30, 10) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE futures_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view futures trades" ON futures_trades FOR SELECT USING (true);

CREATE INDEX idx_futures_trades_pair ON futures_trades(pair_id, created_at DESC);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- ==========================================
-- CALCULATE LIQUIDATION PRICE
-- ==========================================
CREATE OR REPLACE FUNCTION calculate_liquidation_price(
  p_side TEXT,
  p_entry_price DECIMAL,
  p_leverage INT,
  p_maintenance_margin_rate DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  IF p_side = 'long' THEN
    -- Long liquidation: entry * (1 - 1/leverage + maintenance_margin_rate)
    RETURN p_entry_price * (1.0 - (1.0 / p_leverage) + p_maintenance_margin_rate);
  ELSE
    -- Short liquidation: entry * (1 + 1/leverage - maintenance_margin_rate)
    RETURN p_entry_price * (1.0 + (1.0 / p_leverage) - p_maintenance_margin_rate);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- GET FUTURES ORDERBOOK
-- ==========================================
CREATE OR REPLACE FUNCTION get_futures_orderbook(p_pair_id UUID, p_limit INT DEFAULT 20)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'bids', COALESCE((
      SELECT json_agg(row_to_json(b))
      FROM (
        SELECT price, SUM(quantity - filled_quantity) as quantity, COUNT(*) as count
        FROM futures_orders
        WHERE pair_id = p_pair_id AND side = 'buy' AND status IN ('open', 'partial') AND price IS NOT NULL
        GROUP BY price
        ORDER BY price DESC
        LIMIT p_limit
      ) b
    ), '[]'::json),
    'asks', COALESCE((
      SELECT json_agg(row_to_json(a))
      FROM (
        SELECT price, SUM(quantity - filled_quantity) as quantity, COUNT(*) as count
        FROM futures_orders
        WHERE pair_id = p_pair_id AND side = 'sell' AND status IN ('open', 'partial') AND price IS NOT NULL
        GROUP BY price
        ORDER BY price ASC
        LIMIT p_limit
      ) a
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GET FUTURES POSITIONS
-- ==========================================
CREATE OR REPLACE FUNCTION get_futures_positions(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(row_to_json(p))
    FROM (
      SELECT fp.*, fpair.symbol, fpair.base_currency, fpair.quote_currency,
             fpair.max_leverage, fpair.maintenance_margin_rate
      FROM futures_positions fp
      JOIN futures_pairs fpair ON fp.pair_id = fpair.id
      WHERE fp.user_id = p_user_id
      ORDER BY fp.created_at DESC
    ) p
  ), '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PLACE FUTURES ORDER (with matching engine)
-- ==========================================
CREATE OR REPLACE FUNCTION place_futures_order(
  p_user_id UUID,
  p_pair_id UUID,
  p_side TEXT,
  p_position_side TEXT,
  p_type TEXT,
  p_price DECIMAL DEFAULT NULL,
  p_quantity DECIMAL DEFAULT 0,
  p_leverage INT DEFAULT 1,
  p_margin_mode TEXT DEFAULT 'cross',
  p_reduce_only BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  v_pair futures_pairs%ROWTYPE;
  v_order_id UUID;
  v_remaining DECIMAL;
  v_match RECORD;
  v_fill_qty DECIMAL;
  v_fill_price DECIMAL;
  v_fee_rate DECIMAL := 0.0004;
  v_buyer_fee DECIMAL;
  v_seller_fee DECIMAL;
  v_margin_required DECIMAL;
  v_notional DECIMAL;
  v_position futures_positions%ROWTYPE;
  v_liq_price DECIMAL;
  v_avg_price DECIMAL;
  v_new_qty DECIMAL;
  v_new_margin DECIMAL;
BEGIN
  -- Get pair info
  SELECT * INTO v_pair FROM futures_pairs WHERE id = p_pair_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid futures pair');
  END IF;

  -- Validate leverage
  IF p_leverage < 1 OR p_leverage > v_pair.max_leverage THEN
    RETURN json_build_object('error', 'Invalid leverage. Max: ' || v_pair.max_leverage);
  END IF;

  -- Validate
  IF p_type = 'limit' AND (p_price IS NULL OR p_price <= 0) THEN
    RETURN json_build_object('error', 'Limit orders require a valid price');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Calculate margin required (for non-reduce-only orders)
  IF NOT p_reduce_only THEN
    IF p_type = 'limit' THEN
      v_notional := p_quantity * p_price;
    ELSE
      -- For market orders, estimate with best opposing price
      IF p_side = 'buy' THEN
        SELECT COALESCE(MIN(price), 0) INTO v_fill_price
        FROM futures_orders WHERE pair_id = p_pair_id AND side = 'sell' AND status IN ('open', 'partial');
      ELSE
        SELECT COALESCE(MAX(price), 0) INTO v_fill_price
        FROM futures_orders WHERE pair_id = p_pair_id AND side = 'buy' AND status IN ('open', 'partial');
      END IF;
      IF v_fill_price = 0 THEN
        RETURN json_build_object('error', 'No opposing orders available');
      END IF;
      v_notional := p_quantity * v_fill_price;
    END IF;

    v_margin_required := v_notional / p_leverage;

    -- Check and lock USDT margin
    UPDATE wallets
    SET available = available - v_margin_required, locked = locked + v_margin_required, updated_at = NOW()
    WHERE user_id = p_user_id AND currency = 'USDT' AND available >= v_margin_required;

    IF NOT FOUND THEN
      RETURN json_build_object('error', 'Insufficient USDT margin. Required: ' || ROUND(v_margin_required, 2));
    END IF;
  END IF;

  -- Create order
  INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, reduce_only, status)
  VALUES (p_user_id, p_pair_id, p_side, p_position_side, p_type, p_price, p_quantity, p_leverage, p_margin_mode, p_reduce_only, 'open')
  RETURNING id INTO v_order_id;

  v_remaining := p_quantity;

  -- Match orders
  IF p_side = 'buy' THEN
    FOR v_match IN
      SELECT id, user_id, price, quantity - filled_quantity as remaining, position_side, leverage, margin_mode
      FROM futures_orders
      WHERE pair_id = p_pair_id AND side = 'sell' AND status IN ('open', 'partial')
        AND (p_type = 'market' OR price <= p_price)
      ORDER BY price ASC, created_at ASC
      FOR UPDATE SKIP LOCKED
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_fill_qty := LEAST(v_remaining, v_match.remaining);
      v_fill_price := v_match.price;
      v_buyer_fee := v_fill_qty * v_fill_price * v_fee_rate;
      v_seller_fee := v_fill_qty * v_fill_price * v_fee_rate;

      -- Create trade
      INSERT INTO futures_trades (pair_id, buy_order_id, sell_order_id, buyer_id, seller_id, price, quantity, buyer_fee, seller_fee)
      VALUES (p_pair_id, v_order_id, v_match.id, p_user_id, v_match.user_id, v_fill_price, v_fill_qty, v_buyer_fee, v_seller_fee);

      -- Update matched order
      UPDATE futures_orders SET
        filled_quantity = filled_quantity + v_fill_qty,
        fee_amount = fee_amount + v_seller_fee,
        status = CASE WHEN filled_quantity + v_fill_qty >= quantity THEN 'filled' ELSE 'partial' END,
        updated_at = NOW()
      WHERE id = v_match.id;

      -- Deduct fee from buyer
      UPDATE wallets SET available = available - v_buyer_fee, updated_at = NOW()
      WHERE user_id = p_user_id AND currency = 'USDT';

      -- Create or update position for buyer (long opener)
      IF p_position_side = 'long' AND NOT p_reduce_only THEN
        SELECT * INTO v_position FROM futures_positions
        WHERE user_id = p_user_id AND pair_id = p_pair_id AND side = 'long';

        v_liq_price := calculate_liquidation_price('long', v_fill_price, p_leverage, v_pair.maintenance_margin_rate);

        IF FOUND THEN
          -- Average up position
          v_avg_price := ((v_position.entry_price * v_position.quantity) + (v_fill_price * v_fill_qty)) / (v_position.quantity + v_fill_qty);
          v_new_qty := v_position.quantity + v_fill_qty;
          v_new_margin := v_position.margin + (v_fill_qty * v_fill_price / p_leverage);
          v_liq_price := calculate_liquidation_price('long', v_avg_price, p_leverage, v_pair.maintenance_margin_rate);

          UPDATE futures_positions SET
            entry_price = v_avg_price,
            quantity = v_new_qty,
            margin = v_new_margin,
            liquidation_price = v_liq_price,
            updated_at = NOW()
          WHERE id = v_position.id;
        ELSE
          INSERT INTO futures_positions (user_id, pair_id, side, leverage, margin_mode, entry_price, quantity, margin, liquidation_price)
          VALUES (p_user_id, p_pair_id, 'long', p_leverage, p_margin_mode, v_fill_price, v_fill_qty, v_fill_qty * v_fill_price / p_leverage, v_liq_price);
        END IF;

        -- Release locked margin (it's now in the position)
        UPDATE wallets SET locked = locked - (v_fill_qty * v_fill_price / p_leverage), updated_at = NOW()
        WHERE user_id = p_user_id AND currency = 'USDT';
      END IF;

      v_remaining := v_remaining - v_fill_qty;
    END LOOP;
  ELSE
    -- Sell side matching
    FOR v_match IN
      SELECT id, user_id, price, quantity - filled_quantity as remaining, position_side, leverage, margin_mode
      FROM futures_orders
      WHERE pair_id = p_pair_id AND side = 'buy' AND status IN ('open', 'partial')
        AND (p_type = 'market' OR price >= p_price)
      ORDER BY price DESC, created_at ASC
      FOR UPDATE SKIP LOCKED
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_fill_qty := LEAST(v_remaining, v_match.remaining);
      v_fill_price := v_match.price;
      v_buyer_fee := v_fill_qty * v_fill_price * v_fee_rate;
      v_seller_fee := v_fill_qty * v_fill_price * v_fee_rate;

      -- Create trade
      INSERT INTO futures_trades (pair_id, buy_order_id, sell_order_id, buyer_id, seller_id, price, quantity, buyer_fee, seller_fee)
      VALUES (p_pair_id, v_match.id, v_order_id, v_match.user_id, p_user_id, v_fill_price, v_fill_qty, v_buyer_fee, v_seller_fee);

      -- Update matched order
      UPDATE futures_orders SET
        filled_quantity = filled_quantity + v_fill_qty,
        fee_amount = fee_amount + v_buyer_fee,
        status = CASE WHEN filled_quantity + v_fill_qty >= quantity THEN 'filled' ELSE 'partial' END,
        updated_at = NOW()
      WHERE id = v_match.id;

      -- Deduct fee from seller
      UPDATE wallets SET available = available - v_seller_fee, updated_at = NOW()
      WHERE user_id = p_user_id AND currency = 'USDT';

      -- Create or update position for seller (short opener)
      IF p_position_side = 'short' AND NOT p_reduce_only THEN
        SELECT * INTO v_position FROM futures_positions
        WHERE user_id = p_user_id AND pair_id = p_pair_id AND side = 'short';

        v_liq_price := calculate_liquidation_price('short', v_fill_price, p_leverage, v_pair.maintenance_margin_rate);

        IF FOUND THEN
          v_avg_price := ((v_position.entry_price * v_position.quantity) + (v_fill_price * v_fill_qty)) / (v_position.quantity + v_fill_qty);
          v_new_qty := v_position.quantity + v_fill_qty;
          v_new_margin := v_position.margin + (v_fill_qty * v_fill_price / p_leverage);
          v_liq_price := calculate_liquidation_price('short', v_avg_price, p_leverage, v_pair.maintenance_margin_rate);

          UPDATE futures_positions SET
            entry_price = v_avg_price,
            quantity = v_new_qty,
            margin = v_new_margin,
            liquidation_price = v_liq_price,
            updated_at = NOW()
          WHERE id = v_position.id;
        ELSE
          INSERT INTO futures_positions (user_id, pair_id, side, leverage, margin_mode, entry_price, quantity, margin, liquidation_price)
          VALUES (p_user_id, p_pair_id, 'short', p_leverage, p_margin_mode, v_fill_price, v_fill_qty, v_fill_qty * v_fill_price / p_leverage, v_liq_price);
        END IF;

        -- Release locked margin (it's now in the position)
        UPDATE wallets SET locked = locked - (v_fill_qty * v_fill_price / p_leverage), updated_at = NOW()
        WHERE user_id = p_user_id AND currency = 'USDT';
      END IF;

      v_remaining := v_remaining - v_fill_qty;
    END LOOP;
  END IF;

  -- Update order status
  UPDATE futures_orders SET
    filled_quantity = p_quantity - v_remaining,
    status = CASE
      WHEN v_remaining <= 0 THEN 'filled'
      WHEN v_remaining < p_quantity THEN 'partial'
      WHEN p_type = 'market' AND v_remaining > 0 THEN 'cancelled'
      ELSE 'open'
    END,
    updated_at = NOW()
  WHERE id = v_order_id;

  -- If market order didn't fully fill, release remaining locked margin
  IF p_type = 'market' AND v_remaining > 0 AND NOT p_reduce_only THEN
    IF p_type = 'limit' THEN
      v_notional := v_remaining * p_price;
    ELSE
      v_notional := v_remaining * COALESCE(v_fill_price, p_price);
    END IF;
    UPDATE wallets SET
      available = available + (v_notional / p_leverage),
      locked = locked - (v_notional / p_leverage),
      updated_at = NOW()
    WHERE user_id = p_user_id AND currency = 'USDT' AND locked >= (v_notional / p_leverage);
  END IF;

  RETURN json_build_object(
    'order_id', v_order_id,
    'filled', p_quantity - v_remaining,
    'remaining', v_remaining,
    'status', CASE
      WHEN v_remaining <= 0 THEN 'filled'
      WHEN v_remaining < p_quantity THEN 'partial'
      WHEN p_type = 'market' AND v_remaining > 0 THEN 'cancelled'
      ELSE 'open'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CANCEL FUTURES ORDER
-- ==========================================
CREATE OR REPLACE FUNCTION cancel_futures_order(p_user_id UUID, p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order futures_orders%ROWTYPE;
  v_unlock_amount DECIMAL;
  v_remaining_qty DECIMAL;
BEGIN
  SELECT * INTO v_order FROM futures_orders WHERE id = p_order_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;

  IF v_order.status NOT IN ('open', 'partial') THEN
    RETURN json_build_object('error', 'Order cannot be cancelled');
  END IF;

  v_remaining_qty := v_order.quantity - v_order.filled_quantity;

  -- Calculate margin to release
  IF NOT v_order.reduce_only THEN
    v_unlock_amount := (v_remaining_qty * v_order.price) / v_order.leverage;

    -- Release locked margin
    UPDATE wallets SET
      available = available + v_unlock_amount,
      locked = locked - v_unlock_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id AND currency = 'USDT';
  END IF;

  -- Cancel order
  UPDATE futures_orders SET status = 'cancelled', updated_at = NOW() WHERE id = p_order_id;

  RETURN json_build_object('success', true, 'unlocked', COALESCE(v_unlock_amount, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CLOSE FUTURES POSITION
-- ==========================================
CREATE OR REPLACE FUNCTION close_futures_position(p_user_id UUID, p_position_id UUID, p_close_price DECIMAL)
RETURNS JSON AS $$
DECLARE
  v_position futures_positions%ROWTYPE;
  v_pnl DECIMAL;
  v_fee DECIMAL;
  v_return_amount DECIMAL;
BEGIN
  SELECT * INTO v_position FROM futures_positions WHERE id = p_position_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Position not found');
  END IF;

  -- Calculate PnL
  IF v_position.side = 'long' THEN
    v_pnl := (p_close_price - v_position.entry_price) * v_position.quantity;
  ELSE
    v_pnl := (v_position.entry_price - p_close_price) * v_position.quantity;
  END IF;

  -- Calculate closing fee
  v_fee := p_close_price * v_position.quantity * 0.0004;

  -- Return margin + PnL - fee
  v_return_amount := v_position.margin + v_pnl - v_fee;

  -- Ensure user doesn't go negative (liquidation scenario)
  IF v_return_amount < 0 THEN
    v_return_amount := 0;
  END IF;

  -- Return funds to wallet
  UPDATE wallets SET
    available = available + v_return_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id AND currency = 'USDT';

  -- Record transaction
  INSERT INTO transactions (user_id, currency, type, amount, balance_after, description)
  SELECT p_user_id, 'USDT', 'trade', v_pnl - v_fee,
    (SELECT available FROM wallets WHERE user_id = p_user_id AND currency = 'USDT'),
    'Close ' || v_position.side || ' position PnL: ' || ROUND(v_pnl, 2);

  -- Delete position
  DELETE FROM futures_positions WHERE id = p_position_id;

  RETURN json_build_object(
    'success', true,
    'pnl', ROUND(v_pnl, 4),
    'fee', ROUND(v_fee, 4),
    'returned', ROUND(v_return_amount, 4)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE futures_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE futures_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE futures_positions;
