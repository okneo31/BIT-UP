'use client';

import { useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface DepositModalProps {
  isOpen: boolean;
  type: 'deposit' | 'withdraw';
  currency: string;
  onClose: () => void;
}

export default function DepositModal({ isOpen, type, currency, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { fetchWallets, wallets } = useWalletStore();

  const wallet = wallets.find(w => w.currency === currency);
  const available = Number(wallet?.available || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const endpoint = type === 'deposit' ? '/api/wallet/deposit' : '/api/wallet/withdraw';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, amount: Number(amount) }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage({ type: 'success', text: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!` });
      setAmount('');
      fetchWallets();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${type === 'deposit' ? 'Deposit' : 'Withdraw'} ${currency}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'withdraw' && (
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Available</span>
            <span className="text-text-primary">{available.toLocaleString(undefined, { maximumFractionDigits: 8 })} {currency}</span>
          </div>
        )}

        <Input
          type="number"
          placeholder={`Enter ${type} amount`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          suffix={currency}
          step="any"
        />

        {type === 'deposit' && (
          <p className="text-xs text-text-third">
            This is a simulated deposit for demo purposes.
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!amount || Number(amount) <= 0}
        >
          {type === 'deposit' ? 'Deposit' : 'Withdraw'}
        </Button>

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-green' : 'text-red'}`}>
            {message.text}
          </p>
        )}
      </form>
    </Modal>
  );
}
