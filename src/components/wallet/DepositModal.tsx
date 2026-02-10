'use client';

import { useState, useMemo } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useAuthStore } from '@/stores/authStore';
import { NETWORK_INFO } from '@/lib/constants';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface DepositModalProps {
  isOpen: boolean;
  type: 'deposit' | 'withdraw';
  currency: string;
  onClose: () => void;
}

function generateAddress(userId: string, currency: string, network: string): string {
  const seed = `${userId}-${currency}-${network}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');

  switch (network) {
    case 'BTC':
      return `bc1q${hex}k7m2n${hex.slice(0, 4)}p5x8r${hex.slice(2, 8)}wz3y`;
    case 'TRC20':
      return `T${hex.toUpperCase()}Kx${hex.slice(0, 6).toUpperCase()}Nm${hex.slice(2, 6).toUpperCase()}`;
    case 'SOL':
      return `${hex}Dk7${hex.slice(0, 6)}mN${hex.slice(1, 7)}p5Rx${hex.slice(0, 4)}`;
    case 'XRP':
      return `r${hex}N${hex.slice(0, 8)}k${hex.slice(2, 6)}`;
    case 'DOGE':
      return `D${hex}Hk${hex.slice(0, 6)}mN${hex.slice(2, 6)}`;
    default:
      return `0x${hex}a3b7${hex}c9d1${hex.slice(0, 8)}e5f2`;
  }
}

export default function DepositModal({ isOpen, type, currency, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(0);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { fetchWallets, wallets } = useWalletStore();
  const { user } = useAuthStore();

  const networks = NETWORK_INFO[currency] || [{ name: currency, network: currency, confirmations: 6 }];
  const currentNetwork = networks[selectedNetwork];

  const depositAddress = useMemo(() => {
    if (!user) return '';
    return generateAddress(user.id, currency, currentNetwork.network);
  }, [user, currency, currentNetwork.network]);

  const wallet = wallets.find(w => w.currency === currency);
  const available = Number(wallet?.available || 0);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      setMessage({
        type: 'success',
        text: type === 'deposit'
          ? `${amount} ${currency} deposited successfully`
          : `${amount} ${currency} withdrawal requested`,
      });
      setAmount('');
      setWithdrawAddress('');
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
      <div className="space-y-4">
        {/* Network Selection */}
        {networks.length > 1 && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">Network</label>
            <div className="flex gap-2">
              {networks.map((net, i) => (
                <button
                  key={net.network}
                  onClick={() => setSelectedNetwork(i)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedNetwork === i
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-text-secondary hover:border-text-third'
                  }`}
                >
                  {net.network}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-third mt-1">{currentNetwork.name}</p>
          </div>
        )}

        {type === 'deposit' ? (
          <>
            {/* Deposit Address */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Deposit Address</label>
              <div className="bg-bg-primary border border-border rounded-lg p-3">
                <p className="text-sm text-text-primary font-mono break-all mb-2">
                  {depositAddress}
                </p>
                <Button variant="primary" size="sm" fullWidth onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy Address'}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 space-y-1.5">
              <p className="text-sm text-accent font-medium">Notice</p>
              <p className="text-xs text-text-secondary">
                Minimum deposit: 0.001 {currency}
              </p>
              <p className="text-xs text-text-secondary">
                Expected confirmations: {currentNetwork.confirmations}
              </p>
              <p className="text-xs text-text-third">
                Demo exchange - use Quick Deposit below to add funds instantly.
              </p>
            </div>

            {/* Quick Deposit */}
            <div className="border-t border-border pt-4">
              <p className="text-sm text-text-secondary mb-2">Quick Deposit (Demo)</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="number"
                  placeholder={`Enter ${currency} amount`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  suffix={currency}
                  step="any"
                />
                <div className="flex gap-2">
                  {[100, 1000, 10000, 50000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v.toString())}
                      className="flex-1 text-sm py-1.5 bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <Button type="submit" variant="primary" fullWidth loading={loading} disabled={!amount || Number(amount) <= 0}>
                  Deposit {currency}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Available Balance</span>
              <span className="text-text-primary font-medium">
                {available.toLocaleString(undefined, { maximumFractionDigits: 8 })} {currency}
              </span>
            </div>

            <Input
              label="Withdrawal Address"
              type="text"
              placeholder={`Enter ${currentNetwork.network} address`}
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
            />

            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              suffix={currency}
              step="any"
            />

            <div className="flex gap-2">
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount((available * pct).toFixed(8))}
                  className="flex-1 text-sm py-1.5 bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                >
                  {pct * 100}%
                </button>
              ))}
            </div>

            <div className="bg-bg-primary rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-third">Network Fee</span>
                <span className="text-text-secondary">0.0005 {currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-third">You will receive</span>
                <span className="text-text-primary font-medium">
                  {Number(amount) > 0.0005 ? (Number(amount) - 0.0005).toFixed(8) : '0.00'} {currency}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!amount || Number(amount) <= 0 || !withdrawAddress}
            >
              Withdraw {currency}
            </Button>

            <p className="text-xs text-text-third text-center">
              Demo mode - withdrawals are simulated
            </p>
          </form>
        )}

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green' : 'text-red'}`}>
            {message.text}
          </p>
        )}
      </div>
    </Modal>
  );
}
