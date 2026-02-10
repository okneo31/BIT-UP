-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. WALLETS
-- ==========================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  available DECIMAL(30, 10) NOT NULL DEFAULT 0,
  locked DECIMAL(30, 10) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, currency),
  CHECK (available >= 0),
  CHECK (locked >= 0)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- ==========================================
-- 3. TRADING PAIRS
-- ==========================================
CREATE TABLE trading_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL UNIQUE,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  min_quantity DECIMAL(30, 10) NOT NULL DEFAULT 0.00001,
  tick_size DECIMAL(30, 10) NOT NULL DEFAULT 0.01,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  coingecko_id TEXT
);

INSERT INTO trading_pairs (symbol, base_currency, quote_currency, min_quantity, tick_size, coingecko_id) VALUES
  ('BTC-USDT', 'BTC', 'USDT', 0.00001, 0.01, 'bitcoin'),
  ('ETH-USDT', 'ETH', 'USDT', 0.0001, 0.01, 'ethereum'),
  ('BNB-USDT', 'BNB', 'USDT', 0.001, 0.01, 'binancecoin'),
  ('SOL-USDT', 'SOL', 'USDT', 0.01, 0.01, 'solana'),
  ('XRP-USDT', 'XRP', 'USDT', 0.1, 0.0001, 'ripple'),
  ('DOGE-USDT', 'DOGE', 'USDT', 1, 0.00001, 'dogecoin'),
  ('BTU-USDT', 'BTU', 'USDT', 1, 0.0001, NULL);

-- ==========================================
-- 4. ORDERS
-- ==========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('limit', 'market')),
  price DECIMAL(30, 10),
  quantity DECIMAL(30, 10) NOT NULL,
  filled_quantity DECIMAL(30, 10) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'filled', 'cancelled')),
  fee_currency TEXT NOT NULL DEFAULT 'USDT',
  fee_amount DECIMAL(30, 10) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_orders_pair_status ON orders(pair_id, status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_matching ON orders(pair_id, side, status, price);

-- ==========================================
-- 5. TRADES
-- ==========================================
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  buy_order_id UUID NOT NULL REFERENCES orders(id),
  sell_order_id UUID NOT NULL REFERENCES orders(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  price DECIMAL(30, 10) NOT NULL,
  quantity DECIMAL(30, 10) NOT NULL,
  buyer_fee DECIMAL(30, 10) NOT NULL DEFAULT 0,
  seller_fee DECIMAL(30, 10) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trades" ON trades FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Anyone can view recent trades" ON trades FOR SELECT USING (true);

CREATE INDEX idx_trades_pair ON trades(pair_id, created_at DESC);

-- ==========================================
-- 6. TRANSACTIONS
-- ==========================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'trade', 'fee', 'bonus', 'stake', 'unstake', 'reward')),
  amount DECIMAL(30, 10) NOT NULL,
  balance_after DECIMAL(30, 10) NOT NULL DEFAULT 0,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);

-- ==========================================
-- 7. LAUNCHPOOLS
-- ==========================================
CREATE TABLE launchpools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  reward_token TEXT NOT NULL,
  stake_token TEXT NOT NULL,
  total_reward DECIMAL(30, 10) NOT NULL,
  distributed_reward DECIMAL(30, 10) NOT NULL DEFAULT 0,
  apy DECIMAL(10, 2) NOT NULL,
  min_stake DECIMAL(30, 10) NOT NULL DEFAULT 1,
  max_stake DECIMAL(30, 10) NOT NULL DEFAULT 1000000,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE launchpools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view launchpools" ON launchpools FOR SELECT USING (true);

-- Insert sample launchpools
INSERT INTO launchpools (name, description, reward_token, stake_token, total_reward, apy, min_stake, max_stake, start_date, end_date) VALUES
  ('BTU Genesis Pool', 'Stake USDT to earn BTU tokens. Early adopters get the highest rewards!', 'BTU', 'USDT', 1000000, 120.00, 100, 100000, NOW(), NOW() + INTERVAL '30 days'),
  ('BTU Diamond Pool', 'Stake BTU to earn more BTU. Diamond hands only!', 'BTU', 'BTU', 500000, 85.00, 100, 50000, NOW(), NOW() + INTERVAL '60 days'),
  ('ETH Reward Pool', 'Stake BTU to earn ETH rewards.', 'ETH', 'BTU', 10, 45.00, 1000, 100000, NOW() + INTERVAL '7 days', NOW() + INTERVAL '37 days');

-- ==========================================
-- 8. STAKES
-- ==========================================
CREATE TABLE stakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES launchpools(id),
  amount DECIMAL(30, 10) NOT NULL,
  reward_earned DECIMAL(30, 10) NOT NULL DEFAULT 0,
  reward_claimed DECIMAL(30, 10) NOT NULL DEFAULT 0,
  staked_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stakes" ON stakes FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_stakes_user ON stakes(user_id);
CREATE INDEX idx_stakes_pool ON stakes(pool_id);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Auto-create profile and wallets on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));

  -- Create wallets with signup bonus
  INSERT INTO wallets (user_id, currency, available) VALUES
    (NEW.id, 'BTU', 10000),
    (NEW.id, 'USDT', 100000),
    (NEW.id, 'BTC', 0.5),
    (NEW.id, 'ETH', 5),
    (NEW.id, 'BNB', 0),
    (NEW.id, 'SOL', 0),
    (NEW.id, 'XRP', 0),
    (NEW.id, 'DOGE', 0);

  -- Record bonus transactions
  INSERT INTO transactions (user_id, currency, type, amount, balance_after, description) VALUES
    (NEW.id, 'BTU', 'bonus', 10000, 10000, 'Welcome bonus'),
    (NEW.id, 'USDT', 'bonus', 100000, 100000, 'Welcome bonus'),
    (NEW.id, 'BTC', 'bonus', 0.5, 0.5, 'Welcome bonus'),
    (NEW.id, 'ETH', 'bonus', 5, 5, 'Welcome bonus');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- GET ORDERBOOK
-- ==========================================
CREATE OR REPLACE FUNCTION get_orderbook(p_pair_id UUID, p_limit INT DEFAULT 20)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'bids', COALESCE((
      SELECT json_agg(row_to_json(b))
      FROM (
        SELECT price, SUM(quantity - filled_quantity) as quantity, COUNT(*) as count
        FROM orders
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
        FROM orders
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
-- PLACE ORDER (with matching engine)
-- ==========================================
CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_pair_id UUID,
  p_side TEXT,
  p_type TEXT,
  p_price DECIMAL DEFAULT NULL,
  p_quantity DECIMAL DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_pair trading_pairs%ROWTYPE;
  v_order_id UUID;
  v_remaining DECIMAL;
  v_match RECORD;
  v_fill_qty DECIMAL;
  v_fill_price DECIMAL;
  v_fee_rate DECIMAL := 0.001;
  v_buyer_fee DECIMAL;
  v_seller_fee DECIMAL;
  v_lock_currency TEXT;
  v_lock_amount DECIMAL;
  v_user_btu DECIMAL := 0;
BEGIN
  -- Get pair info
  SELECT * INTO v_pair FROM trading_pairs WHERE id = p_pair_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid trading pair');
  END IF;

  -- Check BTU balance for fee discount
  SELECT available INTO v_user_btu FROM wallets WHERE user_id = p_user_id AND currency = 'BTU';
  IF v_user_btu > 0 THEN
    v_fee_rate := v_fee_rate * 0.75; -- 25% discount
  END IF;

  -- Validate
  IF p_type = 'limit' AND (p_price IS NULL OR p_price <= 0) THEN
    RETURN json_build_object('error', 'Limit orders require a valid price');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Lock funds
  IF p_side = 'buy' THEN
    v_lock_currency := v_pair.quote_currency;
    IF p_type = 'limit' THEN
      v_lock_amount := p_quantity * p_price;
    ELSE
      -- For market buy, lock estimated amount (use best ask * quantity * 1.01 buffer)
      SELECT COALESCE(MIN(price) * p_quantity * 1.01, 0) INTO v_lock_amount
      FROM orders WHERE pair_id = p_pair_id AND side = 'sell' AND status IN ('open', 'partial');
      IF v_lock_amount = 0 THEN
        RETURN json_build_object('error', 'No sell orders available for market buy');
      END IF;
    END IF;
  ELSE
    v_lock_currency := v_pair.base_currency;
    v_lock_amount := p_quantity;
  END IF;

  -- Check and lock balance
  UPDATE wallets
  SET available = available - v_lock_amount, locked = locked + v_lock_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = v_lock_currency AND available >= v_lock_amount;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Insufficient balance');
  END IF;

  -- Create order
  INSERT INTO orders (user_id, pair_id, side, type, price, quantity, status)
  VALUES (p_user_id, p_pair_id, p_side, p_type, p_price, p_quantity, 'open')
  RETURNING id INTO v_order_id;

  v_remaining := p_quantity;

  -- Match orders
  IF p_side = 'buy' THEN
    FOR v_match IN
      SELECT id, user_id, price, quantity - filled_quantity as remaining
      FROM orders
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
      INSERT INTO trades (pair_id, buy_order_id, sell_order_id, buyer_id, seller_id, price, quantity, buyer_fee, seller_fee)
      VALUES (p_pair_id, v_order_id, v_match.id, p_user_id, v_match.user_id, v_fill_price, v_fill_qty, v_buyer_fee, v_seller_fee);

      -- Update matched sell order
      UPDATE orders SET
        filled_quantity = filled_quantity + v_fill_qty,
        fee_amount = fee_amount + v_seller_fee,
        status = CASE WHEN filled_quantity + v_fill_qty >= quantity THEN 'filled' ELSE 'partial' END,
        updated_at = NOW()
      WHERE id = v_match.id;

      -- Transfer funds: buyer gets base, seller gets quote
      -- Buyer receives base currency
      UPDATE wallets SET available = available + v_fill_qty, updated_at = NOW()
      WHERE user_id = p_user_id AND currency = v_pair.base_currency;

      -- Buyer pays from locked (quote currency)
      UPDATE wallets SET locked = locked - (v_fill_qty * v_fill_price + v_buyer_fee), updated_at = NOW()
      WHERE user_id = p_user_id AND currency = v_pair.quote_currency;

      -- Seller receives quote currency minus fee
      UPDATE wallets SET available = available + (v_fill_qty * v_fill_price - v_seller_fee), updated_at = NOW()
      WHERE user_id = v_match.user_id AND currency = v_pair.quote_currency;

      -- Seller releases locked base currency
      UPDATE wallets SET locked = locked - v_fill_qty, updated_at = NOW()
      WHERE user_id = v_match.user_id AND currency = v_pair.base_currency;

      v_remaining := v_remaining - v_fill_qty;
    END LOOP;
  ELSE
    -- Sell side matching
    FOR v_match IN
      SELECT id, user_id, price, quantity - filled_quantity as remaining
      FROM orders
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
      INSERT INTO trades (pair_id, buy_order_id, sell_order_id, buyer_id, seller_id, price, quantity, buyer_fee, seller_fee)
      VALUES (p_pair_id, v_match.id, v_order_id, v_match.user_id, p_user_id, v_fill_price, v_fill_qty, v_buyer_fee, v_seller_fee);

      -- Update matched buy order
      UPDATE orders SET
        filled_quantity = filled_quantity + v_fill_qty,
        fee_amount = fee_amount + v_buyer_fee,
        status = CASE WHEN filled_quantity + v_fill_qty >= quantity THEN 'filled' ELSE 'partial' END,
        updated_at = NOW()
      WHERE id = v_match.id;

      -- Buyer receives base currency
      UPDATE wallets SET available = available + v_fill_qty, updated_at = NOW()
      WHERE user_id = v_match.user_id AND currency = v_pair.base_currency;

      -- Buyer pays from locked (quote currency)
      UPDATE wallets SET locked = locked - (v_fill_qty * v_fill_price + v_buyer_fee), updated_at = NOW()
      WHERE user_id = v_match.user_id AND currency = v_pair.quote_currency;

      -- Seller receives quote currency minus fee
      UPDATE wallets SET available = available + (v_fill_qty * v_fill_price - v_seller_fee), updated_at = NOW()
      WHERE user_id = p_user_id AND currency = v_pair.quote_currency;

      -- Seller releases locked base currency
      UPDATE wallets SET locked = locked - v_fill_qty, updated_at = NOW()
      WHERE user_id = p_user_id AND currency = v_pair.base_currency;

      v_remaining := v_remaining - v_fill_qty;
    END LOOP;
  END IF;

  -- Update order status
  UPDATE orders SET
    filled_quantity = p_quantity - v_remaining,
    status = CASE
      WHEN v_remaining <= 0 THEN 'filled'
      WHEN v_remaining < p_quantity THEN 'partial'
      WHEN p_type = 'market' AND v_remaining > 0 THEN 'cancelled'
      ELSE 'open'
    END,
    updated_at = NOW()
  WHERE id = v_order_id;

  -- If market order didn't fully fill, release remaining locked funds
  IF p_type = 'market' AND v_remaining > 0 THEN
    IF p_side = 'buy' THEN
      UPDATE wallets SET
        available = available + locked,
        locked = 0,
        updated_at = NOW()
      WHERE user_id = p_user_id AND currency = v_pair.quote_currency AND locked > 0;
    ELSE
      UPDATE wallets SET
        available = available + v_remaining,
        locked = locked - v_remaining,
        updated_at = NOW()
      WHERE user_id = p_user_id AND currency = v_pair.base_currency;
    END IF;
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
-- CANCEL ORDER
-- ==========================================
CREATE OR REPLACE FUNCTION cancel_order(p_user_id UUID, p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_pair trading_pairs%ROWTYPE;
  v_unlock_amount DECIMAL;
  v_unlock_currency TEXT;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;

  IF v_order.status NOT IN ('open', 'partial') THEN
    RETURN json_build_object('error', 'Order cannot be cancelled');
  END IF;

  SELECT * INTO v_pair FROM trading_pairs WHERE id = v_order.pair_id;

  -- Calculate unlock amount
  IF v_order.side = 'buy' THEN
    v_unlock_currency := v_pair.quote_currency;
    v_unlock_amount := (v_order.quantity - v_order.filled_quantity) * v_order.price;
  ELSE
    v_unlock_currency := v_pair.base_currency;
    v_unlock_amount := v_order.quantity - v_order.filled_quantity;
  END IF;

  -- Release locked funds
  UPDATE wallets SET
    available = available + v_unlock_amount,
    locked = locked - v_unlock_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id AND currency = v_unlock_currency;

  -- Cancel order
  UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = p_order_id;

  RETURN json_build_object('success', true, 'unlocked', v_unlock_amount, 'currency', v_unlock_currency);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
