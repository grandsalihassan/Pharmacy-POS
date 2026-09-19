import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Open POS Billing & Barcode Cash Register' },
    { key: 'F2', desc: 'Open Stock & Inventory Management' },
    { key: 'F3', desc: 'Open Purchase Inward (GRN) Invoices' },
    { key: 'F4', desc: 'Open Sales History & Customer Returns' },
    { key: 'F5', desc: 'Open Supplier & Customer Ledger Accounts' },
    { key: 'F6', desc: 'Open Profit & Loss / Daily Sales Reports' },
    { key: 'F7', desc: 'Open Low Stock & Expiry Alerts Center' },
    { key: 'F8', desc: 'Quick Switch User / Login (Owner vs Cashier)' },
    { key: 'F9', desc: 'Mobile + Laptop Remote Cloud Access' },
    { key: 'F10', desc: 'Open POS Desktop Calculator' },
    { key: 'F12', desc: 'Complete Sale & Print Thermal Receipt' },
    { key: 'Enter', desc: 'Process Barcode Scan or Add Item' },
    { key: 'Esc', desc: 'Close open dialog or clear active search' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">POS Desktop Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <p className="text-xs text-slate-500 mb-3">
            Designed for high-speed counter checkout without needing mouse clicks:
          </p>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded">
            {shortcuts.map((s) => (
              <div key={s.key} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                <span className="text-slate-700 font-medium">{s.desc}</span>
                <kbd className="bg-slate-900 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold text-[11px] shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-100 px-4 py-2 text-right border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
