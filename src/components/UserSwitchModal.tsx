import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Check, 
  X, 
  UserCircle2,
  ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';

interface UserSwitchModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  users: UserProfile[];
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  currentUser,
  users,
  onClose,
  onSelectUser,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(currentUser);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser.id === currentUser.id && !pinInput) {
      onClose();
      return;
    }

    if (pinInput && pinInput !== selectedUser.pin) {
      sound.playAlert();
      setErrorMessage(`Incorrect PIN for ${selectedUser.name}. (Hint: Owner PIN is 1234, Cashier PIN is 0000)`);
      return;
    }

    // Success
    sound.playBeep(2400, 0.1);
    onSelectUser(selectedUser);
    onClose();
  };

  const quickLogin = (user: UserProfile) => {
    sound.playBeep(2400, 0.1);
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">Switch Terminal User / Role Login</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-xs space-y-4">
          <p className="text-slate-600">
            Select an account to log in. Each role has specific permissions for cash register, stock adjustment, and financial reports.
          </p>

          {/* User Profile Cards */}
          <div className="space-y-2.5">
            {users.map((user) => {
              const isSelected = selectedUser.id === user.id;
              const isCurrent = currentUser.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setPinInput('');
                    setErrorMessage('');
                  }}
                  className={`p-3 rounded-sm border flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        user.role === 'owner' ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}
                    >
                      {user.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">{user.name}</span>
                        {isCurrent && (
                          <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Logged In
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{user.terminalAccess}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        user.role === 'owner'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {user.role}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickLogin(user);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold px-2 py-1 rounded transition"
                      title="Instant Switch without PIN"
                    >
                      Instant Switch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PIN Input */}
          <form onSubmit={handleSwitch} className="pt-2 border-t border-slate-200 space-y-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Enter PIN for {selectedUser.name} (Optional for demo):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  placeholder={`PIN (Owner: 1234, Cashier: 0000)`}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded font-mono text-sm"
                  maxLength={6}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200 p-2 rounded text-[11px] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="bg-slate-100 p-2.5 rounded text-[11px] text-slate-600">
              <strong className="text-slate-800">Role Capabilities:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px]">
                <li><strong>Owner:</strong> Full access to P&amp;L reports, supplier purchase cost, item deletions &amp; inventory adjustments.</li>
                <li><strong>Cashier:</strong> Dedicated for high-speed POS billing, barcode scanning, customer returns &amp; receipts.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs shadow-xs cursor-pointer"
              >
                Switch Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
