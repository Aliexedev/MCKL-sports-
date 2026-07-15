import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../types';
import { Wallet as WalletIcon, CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const Wallet: React.FC = () => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState<string>('50');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    if (!user || !profile) return;
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;

    setLoading(true);
    setSuccess(false);

    try {
      const txRef = doc(collection(db, 'transactions'));
      const tx: Transaction = {
        id: txRef.id,
        userId: user.uid,
        amount: val,
        method: 'tng',
        status: 'completed',
        createdAt: Date.now()
      };
      await setDoc(txRef, tx);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(val),
        updatedAt: Date.now()
      });

      setSuccess(true);
      setAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-[#1A1D21] p-6 rounded-xl border border-gray-800 text-center">
        <WalletIcon className="w-10 h-10 text-blue-500 mx-auto mb-3" />
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Balance</h2>
        <p className="text-3xl font-black text-green-400 mt-2">
          RM {profile?.balance.toLocaleString()}
        </p>
      </div>

      <div className="bg-[#1A1D21] p-6 rounded-xl border border-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-500" />
          Deposit via Touch 'n Go
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {['10', '50', '100'].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={cn(
                  "py-2 rounded border text-xs font-bold transition-colors",
                  amount === val 
                    ? "bg-blue-600 border-blue-500 text-white" 
                    : "bg-[#252A30] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                )}
              >
                +RM {val}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Custom Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">RM</span>
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#0F1113] border border-gray-700 rounded py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 text-sm font-bold text-white"
                placeholder="0"
                min="1"
              />
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || !amount || parseInt(amount) <= 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-black text-[10px] tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (
              <>
                Pay with TNG <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Deposit successful! Balance updated.</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
            <ShieldCheck className="w-3 h-3" />
            Secure payment mockup. No real funds are charged.
          </div>
        </div>
      </div>
    </div>
  );
};
