'use client';

import { useState, useEffect } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { useWalletStore } from '@/stores/walletStore';
import { useAuthStore } from '@/stores/authStore';
import { TRADING_PAIRS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';

export default function OrderForm() {
  const { currentPair, currentPrice } = useTradeStore();
  const { wallets, fetchWallets } = useWalletStore();
  const { user } = useAuthStore();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pair = TRADING_PAIRS.find(p => p.symbol === currentPair);
  const baseCurrency = pair?.base || '';
  const quoteCurrency = pair?.quote || 'USDT';

  useEffect(() => {
    if (user) fetchWallets();
  }, [user, fetchWallets]);

  useEffect(() => {
    if (currentPrice > 0 && orderType === 'limit' && !price) {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice, orderType, price]);

  const quoteWallet = wallets.find(w => w.currency === quoteCurrency);
  const baseWallet = wallets.find(w => w.currency === baseCurrency);
  const availableBalance = side === 'buy'
    ? Number(quoteWallet?.available || 0)
    : Number(baseWallet?.available || 0);

  const total = orderType === 'limit'
    ? (Number(price) * Number(quantity))
    : (currentPrice * Number(quantity));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to trade' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const { data: pairData } = await (await import('@/lib/supabase/client')).createClient()
        .from('trading_pairs')
        .select('id')
        .eq('symbol', currentPair)
        .single();

      if (!pairData) throw new Error('Trading pair not found');

      const res = await fetch('/api/trade/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairId: pairData.id,
          side,
          type: orderType,
          price: orderType === 'limit' ? Number(price) : undefined,
          quantity: Number(quantity),
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
    if (side === 'buy') {
      const orderPrice = orderType === 'limit' ? Number(price) : currentPrice;
      if (orderPrice > 0) {
        setQuantity(((availableBalance * pct) / orderPrice).toFixed(6));
      }
    } else {
      setQuantity((availableBalance * pct).toFixed(6));
    }
  };

  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      <div className="flex border-b border-border">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            side === 'buy' ? 'text-green border-b-2 border-green' : 'text-text-secondary'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            side === 'sell' ? 'text-red border-b-2 border-red' : 'text-text-secondary'
          }`}
        >
          Sell
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

        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">Available</span>
          <span className="text-text-primary">
            {availableBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
            {side === 'buy' ? quoteCurrency : baseCurrency}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {orderType === 'limit' && (
            <Input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              suffix={quoteCurrency}
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
                className="flex-1 text-xs py-1 bg-bg-tertiary text-text-secondary hover:text-text-primary rounded transition-colors"
              >
                {pct * 100}%
              </button>
            ))}
          </div>

          {orderType === 'limit' && Number(quantity) > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">Total</span>
              <span className="text-text-primary">
                {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quoteCurrency}
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant={side === 'buy' ? 'green' : 'red'}
            fullWidth
            loading={loading}
            disabled={!quantity || (orderType === 'limit' && !price)}
          >
            {side === 'buy' ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
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
