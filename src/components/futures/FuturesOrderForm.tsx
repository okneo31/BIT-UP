'use client';

import { useState, useEffect } from 'react';
import { useFuturesStore } from '@/stores/futuresStore';
import { useWalletStore } from '@/stores/walletStore';
import { useAuthStore } from '@/stores/authStore';
import { FUTURES_PAIRS, LEVERAGE_OPTIONS, FUNDING_RATE } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';

export default function FuturesOrderForm() {
  const { currentPair, currentPrice, leverage, marginMode, setLeverage, setMarginMode } = useFuturesStore();
  const { wallets, fetchWallets } = useWalletStore();
  const { user } = useAuthStore();
  const [positionSide, setPositionSide] = useState<'long' | 'short'>('long');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLeverageModal, setShowLeverageModal] = useState(false);

  const pair = FUTURES_PAIRS.find(p => p.symbol === currentPair);
  const baseCurrency = pair?.base || '';

  useEffect(() => {
    if (user) fetchWallets();
  }, [user, fetchWallets]);

  useEffect(() => {
    if (currentPrice > 0 && orderType === 'limit' && !price) {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice, orderType, price]);

  const usdtWallet = wallets.find(w => w.currency === 'USDT');
  const availableBalance = Number(usdtWallet?.available || 0);

  const orderPrice = orderType === 'limit' ? Number(price) : currentPrice;
  const notional = orderPrice * Number(quantity);
  const marginRequired = notional / leverage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to trade' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: pairData } = await supabase
        .from('futures_pairs')
        .select('id')
        .eq('symbol', currentPair)
        .single();

      if (!pairData) throw new Error('Futures pair not found');

      const side = positionSide === 'long' ? 'buy' : 'sell';

      const res = await fetch('/api/futures/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairId: pairData.id,
          side,
          positionSide,
          type: orderType,
          price: orderType === 'limit' ? Number(price) : undefined,
          quantity: Number(quantity),
          leverage,
          marginMode,
          reduceOnly: false,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage({ type: 'success', text: `Order ${data.status}: ${data.filled} filled` });
      setQuantity('');
      fetchWallets();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  const handlePercentage = (pct: number) => {
    if (orderPrice > 0) {
      const maxQty = (availableBalance * leverage * pct) / orderPrice;
      setQuantity(maxQty.toFixed(6));
    }
  };

  const maxLeverage = pair?.maxLeverage || 125;
  const filteredLeverageOptions = LEVERAGE_OPTIONS.filter(l => l <= maxLeverage);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      {/* Margin Mode + Leverage */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarginMode(marginMode === 'cross' ? 'isolated' : 'cross')}
            className="px-3 py-1 text-xs font-medium bg-bg-tertiary text-text-primary rounded hover:bg-bg-primary transition-colors"
          >
            {marginMode === 'cross' ? 'Cross' : 'Isolated'}
          </button>
          <button
            onClick={() => setShowLeverageModal(!showLeverageModal)}
            className="px-3 py-1 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          >
            {leverage}x
          </button>
          <div className="ml-auto text-xs text-text-third">
            Funding: <span className="text-text-secondary">{(FUNDING_RATE * 100).toFixed(4)}%</span>
          </div>
        </div>

        {/* Leverage slider */}
        {showLeverageModal && (
          <div className="p-3 bg-bg-primary rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Leverage</span>
              <span className="text-sm font-bold text-accent">{leverage}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={maxLeverage}
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex gap-1">
              {filteredLeverageOptions.map((l) => (
                <button
                  key={l}
                  onClick={() => setLeverage(l)}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    leverage === l
                      ? 'bg-accent text-bg-primary font-medium'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {l}x
                </button>
              ))}
            </div>
            <Button size="sm" variant="primary" fullWidth onClick={() => setShowLeverageModal(false)}>
              Confirm
            </Button>
          </div>
        )}
      </div>

      {/* Long / Short tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setPositionSide('long')}
          className={`flex-1 py-3 text-base font-medium transition-colors ${
            positionSide === 'long' ? 'text-green border-b-2 border-green' : 'text-text-secondary'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setPositionSide('short')}
          className={`flex-1 py-3 text-base font-medium transition-colors ${
            positionSide === 'short' ? 'text-red border-b-2 border-red' : 'text-text-secondary'
          }`}
        >
          Short
        </button>
      </div>

      <div className="p-3 space-y-3">
        <Tabs
          tabs={[
            { label: 'Limit', value: 'limit' },
            { label: 'Market', value: 'market' },
          ]}
          active={orderType}
          onChange={(v) => setOrderType(v as 'limit' | 'market')}
          variant="pills"
        />

        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Available</span>
          <span className="text-text-primary">
            {availableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {orderType === 'limit' && (
            <Input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              suffix="USDT"
              step="any"
            />
          )}

          <Input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            suffix={baseCurrency}
            step="any"
          />

          <div className="flex gap-1">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentage(pct)}
                className="flex-1 text-sm py-1 bg-bg-tertiary text-text-secondary hover:text-text-primary rounded transition-colors"
              >
                {pct * 100}%
              </button>
            ))}
          </div>

          {Number(quantity) > 0 && orderPrice > 0 && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Notional</span>
                <span className="text-text-primary">
                  {notional.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Margin</span>
                <span className="text-text-primary">
                  {marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant={positionSide === 'long' ? 'green' : 'red'}
            fullWidth
            loading={loading}
            disabled={!quantity || (orderType === 'limit' && !price)}
          >
            {positionSide === 'long' ? `Long ${baseCurrency}` : `Short ${baseCurrency}`}
          </Button>
        </form>

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-green' : 'text-red'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
