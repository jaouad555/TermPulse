import React, { useState } from 'react';
import { useSsh } from '../context/SshContext';
import { Fingerprint, Lock, ShieldCheck, Check } from 'lucide-react';

export const BiometricLockModal: React.FC = () => {
  const { isLocked, unlockApp } = useSsh();
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isLocked) return null;

  const handleSimulateBiometric = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      unlockApp();
    }, 600);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      unlockApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto mb-4 text-sky-400">
          <Fingerprint className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-base font-semibold text-slate-100 mb-1">TermPulse Locked</h3>
        <p className="text-xs text-slate-400 mb-6">
          Authenticate with Android Keystore biometrics to access encrypted credentials.
        </p>

        <button
          onClick={handleSimulateBiometric}
          disabled={isVerifying}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg transition-colors flex items-center justify-center gap-2 mb-3 cursor-pointer"
        >
          {isVerifying ? (
            <span>Verifying Sensor...</span>
          ) : (
            <>
              <Fingerprint className="w-4 h-4" />
              <span>Tap Fingerprint Sensor</span>
            </>
          )}
        </button>

        <form onSubmit={handlePinSubmit} className="pt-2 border-t border-slate-800">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Or enter 4-digit PIN"
            className="w-full px-3 py-1.5 text-center text-xs tracking-widest font-mono rounded-lg border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:border-sky-500 mb-2"
          />
          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
          >
            Unlock with PIN
          </button>
        </form>
      </div>
    </div>
  );
};
