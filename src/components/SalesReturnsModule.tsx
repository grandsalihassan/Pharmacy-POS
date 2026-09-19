import React, { useState } from 'react';
import { 
  RotateCcw, 
  Search, 
  Calendar, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Receipt,
  FileSpreadsheet,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { SaleTransaction, ReturnRecord, UserProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { sound } from '../utils/audio';

interface SalesReturnsModuleProps {
  sales: SaleTransaction[];
  currentUser: UserProfile;
  onProcessReturn: (returnRecord: ReturnRecord, medicineId: string, batchId: string, quantityRestored: number) => void;
}

export const SalesReturnsModule: React.FC<SalesReturnsModuleProps> = ({
  sales,
  currentUser,
  onProcessReturn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Return item selection
  const [returnItemIndex, setReturnItemIndex] = useState<number>(0);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>('Customer changed mind / unused');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit'>('cash');

  // Returns ledger history
  const [returnHistory, setReturnHistory] = useState<ReturnRecord[]>([
    {
      id: 'ret-1',
      returnNo: 'RET-260918-091',
      invoiceNo: 'INV-260918-3890',
      date: '2026-09-18',
      customerName: 'Walk-in Customer (General)',
      items: [
        {
          medicineId: 'med-7',
          batchId: 'b-701',
          name: 'Disprin Regular Tablets',
          batchNo: 'DSP-5510',
          quantity: 1,
          refundPrice: 25,
          totalRefund: 25,
        },
      ],
      totalRefund: 25,
      reason: 'Excess quantity purchased by patient',
      processedBy: 'Bilal Ahmed',
    },
  ]);

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenReturnModal = (sale: SaleTransaction) => {
    setSelectedSale(sale);
    setReturnItemIndex(0);
    setReturnQty(1);
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || selectedSale.items.length === 0) return;

    const targetItem = selectedSale.items[returnItemIndex];
    if (!targetItem) return;

    if (returnQty > targetItem.quantity) {
      alert(`Cannot return more than sold quantity (${targetItem.quantity})`);
      return;
    }

    const itemEffectivePrice = targetItem.salePrice * (1 - targetItem.discountPercent / 100);
    const refundTotal = itemEffectivePrice * returnQty;

    const returnRec: ReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNo: `RET-${Date.now().toString().slice(-6)}`,
      invoiceNo: selectedSale.invoiceNo,
      date: new Date().toISOString().split('T')[0],
      customerName: selectedSale.customerName,
      items: [
        {
          medicineId: targetItem.medicineId,
          batchId: targetItem.batchId,
          name: targetItem.name,
          batchNo: targetItem.batchNo,
          quantity: returnQty,
          refundPrice: itemEffectivePrice,
          totalRefund: refundTotal,
        },
      ],
      totalRefund: refundTotal,
      reason: returnReason,
      processedBy: currentUser.name,
    };

    onProcessReturn(returnRec, targetItem.medicineId, targetItem.batchId, returnQty);
    setReturnHistory([returnRec, ...returnHistory]);
    sound.playAlert();
    setIsReturnModalOpen(false);
    alert(`Return processed: ${formatCurrency(refundTotal)} refunded to customer and ${returnQty} units restored to inventory.`);
  };

  return (
    <div id="sales-returns-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 p-2">
      {/* Top Header */}
      <div className="bg-white border border-slate-300 rounded-sm p-3 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div>
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Sales Invoices History &amp; Customer Returns</span>
          </h2>
          <p className="text-xs text-slate-500">
            View completed sales, reprint receipts, and process customer medicine returns with automated stock replenishment.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Invoice # or Customer..."
            className="w-full bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
        {/* Left: Sales Register (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-300 rounded-sm flex flex-col overflow-hidden shadow-xs">
          <div className="bg-slate-800 text-slate-200 px-3 py-2 text-xs font-semibold flex items-center justify-between">
            <span>Sales Registry ({filteredSales.length})</span>
            <span className="text-[11px] text-slate-400">Click any invoice to inspect or process return</span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] uppercase font-semibold sticky top-0">
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Date &amp; Time</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Items Summary</th>
                  <th className="p-2.5 text-center">Payment</th>
                  <th className="p-2.5 text-right">Grand Total</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">{sale.invoiceNo}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">
                      {new Date(sale.timestamp).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-800">{sale.customerName}</td>
                    <td className="p-2.5 text-[11px] text-slate-600 max-w-xs truncate">
                      {sale.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          sale.paymentMethod === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentMethod === 'online'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenReturnModal(sale)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition"
                          title="Return Item from this invoice"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Return</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Return History Ledger (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-sm flex flex-col overflow-hidden shadow-xs">
          <div className="bg-slate-800 text-slate-200 px-3 py-2 text-xs font-semibold flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Customer Returns Log ({returnHistory.length})</span>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-2">
            {returnHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No returns recorded yet.</div>
            ) : (
              returnHistory.map((ret) => (
                <div key={ret.id} className="p-2.5 bg-amber-50/60 border border-amber-200 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-amber-900">{ret.returnNo}</span>
                    <span className="text-[10px] text-slate-500">{ret.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Orig Invoice: <span className="font-mono font-semibold">{ret.invoiceNo}</span>
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Customer: <span className="font-semibold">{ret.customerName}</span>
                  </div>

                  <div className="my-1.5 pt-1 border-t border-amber-200/60 text-[11px] space-y-0.5">
                    {ret.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-slate-800 font-medium">
                        <span>{i.name} (x{i.quantity})</span>
                        <span className="font-mono font-bold text-rose-700">
                          - {formatCurrency(i.totalRefund)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500 italic mt-1">
                    Reason: "{ret.reason}" • Handled by {ret.processedBy}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Process Return Modal */}
      {isReturnModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Process Customer Medicine Return</h3>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-slate-700">
                <div className="flex justify-between font-mono">
                  <span>Invoice Number:</span>
                  <span className="font-bold text-slate-900">{selectedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-semibold">{selectedSale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sale Date:</span>
                  <span>{new Date(selectedSale.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Item to Return:
                </label>
                <select
                  value={returnItemIndex}
                  onChange={(e) => {
                    setReturnItemIndex(Number(e.target.value));
                    setReturnQty(1);
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                >
                  {selectedSale.items.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.name} (Sold: {item.quantity} @ {formatCurrency(item.salePrice)}) [Batch: {item.batchNo}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Return Quantity:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedSale.items[returnItemIndex]?.quantity || 1}
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">
                    Max allowed: {selectedSale.items[returnItemIndex]?.quantity || 1}
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Refund Amount:
                  </label>
                  <div className="font-mono text-base font-bold text-rose-700 py-1">
                    {formatCurrency(
                      (selectedSale.items[returnItemIndex]?.salePrice || 0) *
                        (1 - (selectedSale.items[returnItemIndex]?.discountPercent || 0) / 100) *
                        returnQty
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason for Return:
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                >
                  <option value="Customer changed mind / unused pack">Customer changed mind / unused pack</option>
                  <option value="Wrong medicine dispensed">Wrong medicine dispensed</option>
                  <option value="Near expiry / damaged package">Near expiry / damaged package</option>
                  <option value="Doctor altered prescription">Doctor altered prescription</option>
                  <option value="Patient allergic reaction">Patient allergic reaction</option>
                </select>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-[11px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Returning this item will automatically restore <strong>{returnQty} units</strong> back to inventory batch <strong>{selectedSale.items[returnItemIndex]?.batchNo}</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Confirm Return &amp; Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
