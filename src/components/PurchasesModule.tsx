import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Trash2, 
  Building2, 
  Calendar, 
  CheckCircle, 
  FileText,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { MedicineItem, PurchaseInvoice, AccountParty, PurchaseItem, UserProfile } from '../types';
import { formatCurrency, formatDate, generateInvoiceNumber } from '../utils/formatters';
import { sound } from '../utils/audio';

interface PurchasesModuleProps {
  purchases: PurchaseInvoice[];
  suppliers: AccountParty[];
  medicines: MedicineItem[];
  currentUser: UserProfile;
  onAddPurchase: (newPurchase: PurchaseInvoice) => void;
  onUpdateMedicineStockFromPurchase: (medicineId: string, batchNo: string, expiryDate: string, purchasePrice: number, salePrice: number, qty: number) => void;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  purchases,
  suppliers,
  medicines,
  currentUser,
  onAddPurchase,
  onUpdateMedicineStockFromPurchase,
}) => {
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'pending'>('paid');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Items in active inward purchase order
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  // Item form inside modal
  const [selectedMedId, setSelectedMedId] = useState(medicines[0]?.id || '');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [saleRate, setSaleRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);

  const selectedMed = medicines.find((m) => m.id === selectedMedId);

  // Prefill default rate when medicine changes
  const handleMedicineChange = (medId: string) => {
    setSelectedMedId(medId);
    const med = medicines.find((m) => m.id === medId);
    if (med && med.batches.length > 0) {
      setPurchaseRate(med.batches[0].purchasePrice);
      setSaleRate(med.batches[0].salePrice);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !batchNo || !expiryDate || quantity <= 0) {
      alert('Please fill in batch number, expiry date, and valid quantity.');
      return;
    }

    const itemTotal = purchaseRate * quantity;
    const newItem: PurchaseItem = {
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      company: selectedMed.company,
      batchNo: batchNo.toUpperCase(),
      expiryDate,
      purchasePrice: purchaseRate,
      salePrice: saleRate,
      quantity,
      total: itemTotal,
    };

    setPurchaseItems([...purchaseItems, newItem]);
    sound.playBeep(2000, 0.08);

    // Reset item fields
    setBatchNo('');
    setExpiryDate('');
    setQuantity(10);
  };

  const removeItem = (idx: number) => {
    const copy = [...purchaseItems];
    copy.splice(idx, 1);
    setPurchaseItems(copy);
  };

  const invoiceTotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);

  const handleFinalizePurchase = () => {
    if (purchaseItems.length === 0) {
      alert('Please add at least one medicine item to the purchase invoice.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    const newInvoice: PurchaseInvoice = {
      id: `pur-${Date.now()}`,
      invoiceNo: supplierInvoiceNo || generateInvoiceNumber('PUR'),
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: purchaseDate,
      items: [...purchaseItems],
      totalAmount: invoiceTotal,
      paidAmount: paymentStatus === 'paid' ? invoiceTotal : (paymentStatus === 'pending' ? 0 : paidAmount),
      paymentStatus: paymentStatus,
    };

    // Update stock in inventory
    purchaseItems.forEach((item) => {
      onUpdateMedicineStockFromPurchase(
        item.medicineId,
        item.batchNo,
        item.expiryDate,
        item.purchasePrice,
        item.salePrice,
        item.quantity
      );
    });

    onAddPurchase(newInvoice);
    sound.playCashRegister();
    setIsNewPurchaseOpen(false);
    setPurchaseItems([]);
    setSupplierInvoiceNo('');
    setPaidAmount(0);
  };

  return (
    <div id="purchases-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 p-2">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-300 rounded-sm p-3 mb-2 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span>Supplier Purchases &amp; Inward Stock (GRN)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Record wholesale purchases from medicine companies and distributors. Updates inventory batches automatically.
          </p>
        </div>

        <button
          onClick={() => {
            setIsNewPurchaseOpen(true);
            if (selectedMed && selectedMed.batches.length > 0) {
              setPurchaseRate(selectedMed.batches[0].purchasePrice);
              setSaleRate(selectedMed.batches[0].salePrice);
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Purchase Invoice [GRN]</span>
        </button>
      </div>

      {/* Purchases History Table */}
      <div className="flex-1 bg-white border border-slate-300 rounded-sm overflow-hidden flex flex-col shadow-xs">
        <div className="bg-slate-800 text-slate-200 px-3 py-2 text-xs font-semibold flex items-center justify-between">
          <span>Recent Purchase Invoices ({purchases.length})</span>
          <span className="text-slate-400 text-[11px]">Total Supplier Invoices Recorded</span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-semibold uppercase sticky top-0">
                <th className="p-2.5">Invoice #</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Supplier / Distributor</th>
                <th className="p-2.5">Items Received</th>
                <th className="p-2.5 text-right">Invoice Total</th>
                <th className="p-2.5 text-right">Amount Paid</th>
                <th className="p-2.5 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-indigo-700">{p.invoiceNo}</td>
                  <td className="p-2.5 text-slate-600">{formatDate(p.date)}</td>
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900">{p.supplierName}</div>
                  </td>
                  <td className="p-2.5">
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      {p.items.map((i, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800">{i.medicineName}</span>
                          <span className="text-slate-400">({i.quantity} units @ {formatCurrency(i.purchasePrice)})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(p.totalAmount)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-700">
                    {formatCurrency(p.paidAmount)}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        p.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inward Purchase Modal */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Create New Purchase Invoice / GRN</h3>
              </div>
              <button
                onClick={() => setIsNewPurchaseOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Supplier & Header info */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Select Supplier / Distributor *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Bal: Rs. {s.balance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Supplier Invoice No / Bill #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GETZ-99120"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Add Item Form */}
              <form onSubmit={handleAddItem} className="bg-indigo-50/50 p-3 rounded border border-indigo-200 space-y-3">
                <div className="font-bold text-indigo-900 flex items-center justify-between">
                  <span>Add Received Medicine to Invoice</span>
                  <span className="text-[10px] text-indigo-600 font-normal">
                    Fills batch, expiry and stock automatically
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Select Medicine *</label>
                    <select
                      value={selectedMedId}
                      onChange={(e) => handleMedicineChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.company})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Batch Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BT-3301"
                      value={batchNo}
                      onChange={(e) => setBatchNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Purchase Rate (Rs) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={purchaseRate}
                      onChange={(e) => setPurchaseRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sale Rate (Rs) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={saleRate}
                      onChange={(e) => setSaleRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-emerald-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Quantity Received</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded font-bold whitespace-nowrap cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Items Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-semibold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2">Expiry</th>
                      <th className="p-2 text-right">Cost Rate</th>
                      <th className="p-2 text-right">Sale Rate</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Line Total</th>
                      <th className="p-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">
                          No items added to this purchase invoice yet. Use form above to add items.
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-medium">{item.medicineName}</td>
                          <td className="p-2 font-mono text-[11px]">{item.batchNo}</td>
                          <td className="p-2 font-mono text-[11px]">{item.expiryDate}</td>
                          <td className="p-2 text-right font-mono">{formatCurrency(item.purchasePrice)}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatCurrency(item.salePrice)}</td>
                          <td className="p-2 text-center font-bold">{item.quantity}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Status:</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'partial' | 'pending')}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="paid">Fully Paid (Cash / Bank)</option>
                    <option value="partial">Partially Paid</option>
                    <option value="pending">Credit (Added to Supplier Ledger)</option>
                  </select>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Purchase Value</div>
                  <div className="text-lg font-mono font-bold text-slate-900">{formatCurrency(invoiceTotal)}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewPurchaseOpen(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizePurchase}
                disabled={purchaseItems.length === 0}
                className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Purchase &amp; Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
