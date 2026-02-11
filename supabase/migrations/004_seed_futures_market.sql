-- ==========================================
-- FUTURES MARKET SEED
-- Seeds futures orderbooks using the system bot from 002_seed_btu_market.sql
-- ==========================================

DO $$
DECLARE
  v_system_id UUID := '00000000-0000-0000-0000-000000000001';
  v_pair_id UUID;
  v_btc_price DECIMAL := 97000;
  v_eth_price DECIMAL := 2700;
  v_bnb_price DECIMAL := 600;
  v_sol_price DECIMAL := 200;
  v_xrp_price DECIMAL := 2.5;
  v_doge_price DECIMAL := 0.25;
  i INT;
BEGIN

  -- ===== BTCUSDT =====
  SELECT id INTO v_pair_id FROM futures_pairs WHERE symbol = 'BTCUSDT';
  -- Sell orders (asks)
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'sell', 'short', 'limit',
      ROUND((v_btc_price + (i * v_btc_price * 0.001))::numeric, 2),
      ROUND((0.05 + random() * 0.3)::numeric, 3),
      1, 'cross', 'open');
  END LOOP;
  -- Buy orders (bids)
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'buy', 'long', 'limit',
      ROUND((v_btc_price - (i * v_btc_price * 0.001))::numeric, 2),
      ROUND((0.05 + random() * 0.3)::numeric, 3),
      1, 'cross', 'open');
  END LOOP;

  -- ===== ETHUSDT =====
  SELECT id INTO v_pair_id FROM futures_pairs WHERE symbol = 'ETHUSDT';
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'sell', 'short', 'limit',
      ROUND((v_eth_price + (i * v_eth_price * 0.001))::numeric, 2),
      ROUND((0.5 + random() * 3)::numeric, 3),
      1, 'cross', 'open');
  END LOOP;
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'buy', 'long', 'limit',
      ROUND((v_eth_price - (i * v_eth_price * 0.001))::numeric, 2),
      ROUND((0.5 + random() * 3)::numeric, 3),
      1, 'cross', 'open');
  END LOOP;

  -- ===== BNBUSDT =====
  SELECT id INTO v_pair_id FROM futures_pairs WHERE symbol = 'BNBUSDT';
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'sell', 'short', 'limit',
      ROUND((v_bnb_price + (i * v_bnb_price * 0.001))::numeric, 2),
      ROUND((1 + random() * 10)::numeric, 2),
      1, 'cross', 'open');
  END LOOP;
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'buy', 'long', 'limit',
      ROUND((v_bnb_price - (i * v_bnb_price * 0.001))::numeric, 2),
      ROUND((1 + random() * 10)::numeric, 2),
      1, 'cross', 'open');
  END LOOP;

  -- ===== SOLUSDT =====
  SELECT id INTO v_pair_id FROM futures_pairs WHERE symbol = 'SOLUSDT';
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'sell', 'short', 'limit',
      ROUND((v_sol_price + (i * v_sol_price * 0.001))::numeric, 2),
      ROUND((5 + random() * 30)::numeric, 2),
      1, 'cross', 'open');
  END LOOP;
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'buy', 'long', 'limit',
      ROUND((v_sol_price - (i * v_sol_price * 0.001))::numeric, 2),
      ROUND((5 + random() * 30)::numeric, 2),
      1, 'cross', 'open');
  END LOOP;

  -- ===== XRPUSDT =====
  SELECT id INTO v_pair_id FROM futures_pairs WHERE symbol = 'XRPUSDT';
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'sell', 'short', 'limit',
      ROUND((v_xrp_price + (i * v_xrp_price * 0.001))::numeric, 4),
      ROUND((100 + random() * 2000)::numeric, 0),
      1, 'cross', 'open');
  END LOOP;
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'buy', 'long', 'limit',
      ROUND((v_xrp_price - (i * v_xrp_price * 0.001))::numeric, 4),
      ROUND((100 + random() * 2000)::numeric, 0),
      1, 'cross', 'open');
  END LOOP;

  -- ===== DOGEUSDT =====
  SELECT id INTO v_pair_id FROM futures_pairs WHERE symbol = 'DOGEUSDT';
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'sell', 'short', 'limit',
      ROUND((v_doge_price + (i * v_doge_price * 0.001))::numeric, 5),
      ROUND((500 + random() * 10000)::numeric, 0),
      1, 'cross', 'open');
  END LOOP;
  FOR i IN 1..15 LOOP
    INSERT INTO futures_orders (user_id, pair_id, side, position_side, type, price, quantity, leverage, margin_mode, status)
    VALUES (v_system_id, v_pair_id, 'buy', 'long', 'limit',
      ROUND((v_doge_price - (i * v_doge_price * 0.001))::numeric, 5),
      ROUND((500 + random() * 10000)::numeric, 0),
      1, 'cross', 'open');
  END LOOP;

END $$;
