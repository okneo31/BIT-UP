'use client';

import { useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { CURRENCY_INFO } from '@/lib/constants';
import DepositModal from './DepositModal';

export default function AssetTable() {
  const { wallets } = useWalletStore();
  const [hideZero, setHideZero] = useState(false);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'deposit' | 'withdraw'; currency: string }>({
    isOpen: false,
    type: 'deposit',
    currency: 'USDT',
  });

  const filteredWallets = hideZero
    ? wallets.filter(w => Number(w.available) > 0 || Number(w.locked) > 0)
    : wallets;

  return (
    <>
      <div className="bg-bg-secondary rounded-lg border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">Assets</h3>
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={hideZero}
              onChange={(e) => setHideZero(e.target.checked)}
              className="rounded border-border"
            />
            Hide zero balances
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-third text-xs border-b border-border">
                <th className="text-left px-4 py-3 font-normal">Coin</th>
                <th className="text-right px-4 py-3 font-normal">Available</th>
                <th className="text-right px-4 py-3 font-normal">Locked</th>
                <th className="text-right px-4 py-3 font-normal">Total</th>
                <th className="text-right px-4 py-3 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.map((wallet) => {
                const info = CURRENCY_INFO[wallet.currency];
                const total = Number(wallet.available) + Number(wallet.locked);
                return (
                  <tr key={wallet.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-bg-primary"
                          style={{ backgroundColor: info?.color || '#848e9c' }}
                        >
                          {info?.icon || wallet.currency[0]}
                        </span>
                        <div>
                          <p className="text-text-primary font-medium">{wallet.currency}</p>
                          <p className="text-text-third text-xs">{info?.name || wallet.currency}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-text-primary">
                      {Number(wallet.available).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="text-right px-4 py-3 text-text-secondary">
                      {Number(wallet.locked).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="text-right px-4 py-3 text-text-primary font-medium">
                      {total.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </td>
                    <td className="text-right px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setModalState({ isOpen: true, type: 'deposit', currency: wallet.currency })}
                          className="text-xs text-accent hover:underline"
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => setModalState({ isOpen: true, type: 'withdraw', currency: wallet.currency })}
                          className="text-xs text-text-secondary hover:text-text-primary"
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DepositModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        currency={modalState.currency}
        onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
      />
    </>
  );
}
