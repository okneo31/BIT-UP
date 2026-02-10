-- ==========================================
-- BTU Market Initialization
-- Creates a system bot user and seeds BTU-USDT orderbook at ~0.1 USDT
-- ==========================================

-- 1. Create system bot user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'system@bitup.exchange',
  '$2a$10$000000000000000000000000000000000000000000000000000000',
  NOW(),
  NOW(),
  NOW(),
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"is_system": true}'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create system profile
INSERT INTO profiles (id, email, nickname)
VALUES ('00000000-0000-0000-0000-000000000001', 'system@bitup.exchange', 'BitUp Market Maker')
ON CONFLICT (id) DO NOTHING;

-- 3. Create system wallets with large balances
INSERT INTO wallets (user_id, currency, available) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BTU', 50000000),
  ('00000000-0000-0000-0000-000000000001', 'USDT', 50000000),
  ('00000000-0000-0000-0000-000000000001', 'BTC', 0),
  ('00000000-0000-0000-0000-000000000001', 'ETH', 0),
  ('00000000-0000-0000-0000-000000000001', 'BNB', 0),
  ('00000000-0000-0000-0000-000000000001', 'SOL', 0),
  ('00000000-0000-0000-0000-000000000001', 'XRP', 0),
  ('00000000-0000-0000-0000-000000000001', 'DOGE', 0)
ON CONFLICT (user_id, currency) DO UPDATE SET available = EXCLUDED.available;

-- 4. Get BTU-USDT pair ID and seed orders
DO $$
DECLARE
  v_pair_id UUID;
  v_system_id UUID := '00000000-0000-0000-0000-000000000001';
  v_base_price DECIMAL := 0.1;
  i INT;
BEGIN
  SELECT id INTO v_pair_id FROM trading_pairs WHERE symbol = 'BTU-USDT';

  IF v_pair_id IS NULL THEN
    RAISE EXCEPTION 'BTU-USDT pair not found';
  END IF;

  -- Delete any existing system orders
  DELETE FROM orders WHERE user_id = v_system_id AND pair_id = v_pair_id;

  -- Lock USDT for buy orders
  -- Lock BTU for sell orders

  -- ===== SELL ORDERS (asks) above 0.1 =====
  -- Tight spread near market price
  INSERT INTO orders (user_id, pair_id, side, type, price, quantity, status) VALUES
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1000, 50000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1005, 40000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1010, 35000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1020, 30000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1030, 25000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1050, 50000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1080, 40000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1100, 60000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1150, 80000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1200, 100000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1300, 100000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.1500, 150000, 'open'),
    (v_system_id, v_pair_id, 'sell', 'limit', 0.2000, 200000, 'open');

  -- Lock BTU for sell orders (total: 960,000 BTU)
  UPDATE wallets SET
    available = available - 960000,
    locked = locked + 960000
  WHERE user_id = v_system_id AND currency = 'BTU';

  -- ===== BUY ORDERS (bids) below 0.1 =====
  INSERT INTO orders (user_id, pair_id, side, type, price, quantity, status) VALUES
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0995, 50000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0990, 40000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0985, 35000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0980, 30000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0970, 25000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0950, 50000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0920, 40000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0900, 60000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0850, 80000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0800, 100000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0700, 100000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0500, 150000, 'open'),
    (v_system_id, v_pair_id, 'buy', 'limit', 0.0300, 200000, 'open');

  -- Lock USDT for buy orders
  UPDATE wallets SET
    available = available - (
      50000*0.0995 + 40000*0.0990 + 35000*0.0985 + 30000*0.0980 +
      25000*0.0970 + 50000*0.0950 + 40000*0.0920 + 60000*0.0900 +
      80000*0.0850 + 100000*0.0800 + 100000*0.0700 + 150000*0.0500 + 200000*0.0300
    ),
    locked = locked + (
      50000*0.0995 + 40000*0.0990 + 35000*0.0985 + 30000*0.0980 +
      25000*0.0970 + 50000*0.0950 + 40000*0.0920 + 60000*0.0900 +
      80000*0.0850 + 100000*0.0800 + 100000*0.0700 + 150000*0.0500 + 200000*0.0300
    )
  WHERE user_id = v_system_id AND currency = 'USDT';

  -- ===== SEED TRADE HISTORY for BTU chart =====
  -- Create 50 trades over last 7 days with price oscillating around 0.1
  FOR i IN 1..50 LOOP
    INSERT INTO trades (pair_id, buy_order_id, sell_order_id, buyer_id, seller_id, price, quantity, created_at)
    SELECT
      v_pair_id,
      (SELECT id FROM orders WHERE pair_id = v_pair_id AND side = 'buy' LIMIT 1),
      (SELECT id FROM orders WHERE pair_id = v_pair_id AND side = 'sell' LIMIT 1),
      v_system_id,
      v_system_id,
      -- Price oscillates between 0.085 and 0.105 trending up to 0.1
      ROUND((0.085 + (0.02 * random()) + (0.001 * i * random()))::numeric, 4),
      -- Random quantity 100-5000
      ROUND((100 + random() * 4900)::numeric, 0),
      NOW() - (INTERVAL '7 days' * (1.0 - i::float / 50.0));
  END LOOP;

END $$;
