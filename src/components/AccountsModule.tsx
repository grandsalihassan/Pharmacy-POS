import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Building2, 
  Plus, 
  Search, 
  DollarSign, 
  Phone, 
  MapPin, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  CreditCard
} from 'lucide-react';
import { AccountParty, UserProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { sound } from '../utils/audio';

interface AccountsModuleProps {
  accounts: AccountParty[];
  currentUser: UserProfile;
  onAddAccount: (newParty: AccountParty) => void;
  onRecordPayment: (partyId: string, amount: number, paymentType: 'payment_made' | 'payment_received', note: string) => void;
}

export const AccountsModule: React.FC<AccountsModuleProps> = ({
  accounts,
  currentUser,
  onAddAccount,
  onRecordPayment,
}) => {
  const [activeType, setActiveType] = useState<'customer' | 'supplier'>('supplier');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<AccountParty | null>(null);

  // Add Party Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyOrAddress, setCompanyOrAddress] = useState('');
  const [initialBalance, setInitialBalance] = useState<number>(0);

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState('');

  const filteredAccounts = accounts.filter(
    (a) =>
      a.type === activeType &&
      (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.companyOrAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery))
  );

  const totalBalance = filteredAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newParty: AccountParty = {
      id: `${activeType}-${Date.now()}`,
      type: activeType,
      name,
      phone: phone || '+92 300 0000000',
      companyOrAddress: companyOrAddress || 'Local Area',
      balance: Number(initialBalance),
      totalTransactions: 1,
      lastTransactionDate: new Date().toISOString().split('T')[0],
    };

    onAddAccount(newParty);
    sound.playBeep(2000, 0.08);
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setCompanyOrAddress('');
    setInitialBalance(0);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || paymentAmount <= 0) return;

    const paymentType = selectedParty.type === 'supplier' ? 'payment_made' : 'payment_received';
    onRecordPayment(selectedParty.id, paymentAmount, paymentType, paymentNote);
    sound.playCashRegister();
    setIsPaymentModalOpen(false);
    setPaymentAmount(0);
    setPaymentNote('');
    alert(`Payment of ${formatCurrency(paymentAmount)} recorded successfully!`);
  };

  return (
    <div id="accounts-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 p-2">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white border border-slate-300 rounded-sm p-3 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex rounded border border-slate-300 p-0.5 bg-slate-100">
            <button
              onClick={() => {
                setActiveType('supplier');
                setSelectedParty(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeType === 'supplier'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Supplier Accounts (Payables)</span>
            </button>
            <button
              onClick={() => {
                setActiveType('customer');
                setSelectedParty(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeType === 'customer'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Ledgers (Receivables)</span>
            </button>
          </div>

          <div className="text-xs bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded">
            <span>Total {activeType === 'supplier' ? 'Outstanding Payable' : 'Credit Receivable'}: </span>
            <strong className="font-mono text-sm">{formatCurrency(totalBalance)}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeType} name or phone...`}
              className="w-full bg-slate-50 border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New {activeType === 'supplier' ? 'Supplier' : 'Customer'}</span>
          </button>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div className="flex-1 bg-white border border-slate-300 rounded-sm overflow-hidden flex flex-col shadow-xs">
        <div className="bg-slate-800 text-slate-200 px-3 py-2 text-xs font-semibold flex items-center justify-between">
          <span>{activeType === 'supplier' ? 'Suppliers & Distributors List' : 'Customers Account List'}</span>
          <span className="text-slate-400 text-[11px]">Click 'Record Payment' to reconcile ledger balance</span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] uppercase font-semibold sticky top-0">
                <th className="p-2.5">Party Name</th>
                <th className="p-2.5">Company / Address</th>
                <th className="p-2.5">Phone Contact</th>
                <th className="p-2.5 text-center">Invoices / Txns</th>
                <th className="p-2.5 text-center">Last Transaction</th>
                <th className="p-2.5 text-right">Outstanding Balance</th>
                <th className="p-2.5 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50">
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900 text-xs">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{acc.type}</div>
                  </td>
                  <td className="p-2.5 text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{acc.companyOrAddress}</span>
                  </td>
                  <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {acc.phone}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono font-semibold text-slate-700">
                    {acc.totalTransactions}
                  </td>
                  <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                    {formatDate(acc.lastTransactionDate)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-sm">
                    <span
                      className={
                        acc.balance > 0
                          ? activeType === 'supplier'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                          : 'text-slate-600'
                      }
                    >
                      {formatCurrency(acc.balance)}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => {
                        setSelectedParty(acc);
                        setPaymentAmount(acc.balance > 0 ? acc.balance : 1000);
                        setIsPaymentModalOpen(true);
                      }}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer transition"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>{activeType === 'supplier' ? 'Pay Supplier' : 'Receive Payment'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Account Party Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Add New {activeType === 'supplier' ? 'Medicine Supplier' : 'Customer Account'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddParty} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {activeType === 'supplier' ? 'Distributor / Supplier Name *' : 'Customer Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allied Healthcare"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address / Warehouse Location</label>
                <input
                  type="text"
                  placeholder="e.g. Market Plaza, Lahore"
                  value={companyOrAddress}
                  onChange={(e) => setCompanyOrAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Opening Balance (Rs)
                </label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  {activeType === 'supplier' ? 'Amount we already owe to supplier' : 'Amount customer already owes to us'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Reconcile Modal */}
      {isPaymentModalOpen && selectedParty && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Record {selectedParty.type === 'supplier' ? 'Payment to Supplier' : 'Payment from Customer'}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{selectedParty.name}</div>
                <div className="text-[11px] text-slate-500">{selectedParty.companyOrAddress}</div>
                <div className="mt-2 flex justify-between items-center text-xs">
                  <span>Current Ledger Balance:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatCurrency(selectedParty.balance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment Amount (Rs) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-base font-bold text-purple-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Payment Mode &amp; Reference:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash / Bank Cheque #4410 / Online EasyPaisa"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-[11px] text-emerald-800">
                Remaining Balance after Payment:{' '}
                <strong className="font-mono">
                  {formatCurrency(Math.max(0, selectedParty.balance - paymentAmount))}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Confirm &amp; Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
