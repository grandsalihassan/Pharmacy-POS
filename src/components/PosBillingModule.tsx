import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  CreditCard, 
  Banknote, 
  Split, 
  User, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  History,
  Tag,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { MedicineItem, Batch, CartItem, SaleTransaction, PaymentMethod, OnlineProvider, AccountParty, UserProfile } from '../types';
import { formatCurrency, formatDate, getExpiryStatus, generateInvoiceNumber, getEffectiveBatch } from '../utils/formatters';
import { sound } from '../utils/audio';

interface PosBillingModuleProps {
  medicines: MedicineItem[];
  customers: AccountParty[];
  currentUser: UserProfile;
  onCompleteSale: (sale: SaleTransaction) => void;
  onUpdateMedicineStock: (medicineId: string, batchId: string, quantityDeducted: number) => void;
  onOpenReturns: () => void;
}

export const PosBillingModule: React.FC<PosBillingModuleProps> = ({
  medicines,
  customers,
  currentUser,
  onCompleteSale,
  onUpdateMedicineStock,
  onOpenReturns,
}) => {
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || 'cust-1');
  const [billDiscountType, setBillDiscountType] = useState<'percent' | 'flat'>('percent');
  const [billDiscountVal, setBillDiscountVal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [onlineProvider, setOnlineProvider] = useState<OnlineProvider>('EasyPaisa');
  const [onlineAmount, setOnlineAmount] = useState<string>('');
  const [transactionNote, setTransactionNote] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Batch Picker Modal when medicine has multiple batches
  const [batchPickerItem, setBatchPickerItem] = useState<MedicineItem | null>(null);

  // Print Receipt Modal
  const [printedSale, setPrintedSale] = useState<SaleTransaction | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const showFeedback = (type: 'success' | 'error' | 'warning', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Add Item to Cart by Batch
  const addItemToCart = (item: MedicineItem, batch: Batch) => {
    if (batch.stockQty <= 0) {
      sound.playAlert();
      showFeedback('error', `Out of Stock: Batch ${batch.batchNo} has 0 stock available.`);
      return;
    }

    const expiryStatus = getExpiryStatus(batch.expiryDate);
    if (expiryStatus === 'expired') {
      sound.playAlert();
      const confirmSale = window.confirm(`WARNING: Batch ${batch.batchNo} of ${item.name} is EXPIRED (${batch.expiryDate}). Are you sure you want to proceed?`);
      if (!confirmSale) return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (c) => c.medicineId === item.id && c.batchId === batch.id
      );

      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        if (existing.quantity >= batch.stockQty) {
          sound.playAlert();
          showFeedback('warning', `Maximum stock limit reached (${batch.stockQty} ${item.unit}) for this batch.`);
          return prevCart;
        }
        sound.playBeep();
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        showFeedback('success', `Incremented ${item.name} (Qty: ${existing.quantity + 1})`);
        return updated;
      }

      sound.playBeep();
      showFeedback('success', `Added ${item.name} [Batch: ${batch.batchNo}] to bill`);
      return [
        ...prevCart,
        {
          medicineId: item.id,
          batchId: batch.id,
          name: item.name,
          genericName: item.genericName,
          company: item.company,
          batchNo: batch.batchNo,
          expiryDate: batch.expiryDate,
          unit: item.unit,
          purchasePrice: batch.purchasePrice,
          salePrice: batch.salePrice,
          quantity: 1,
          discountPercent: 0,
          maxStock: batch.stockQty,
        },
      ];
    });

    setBatchPickerItem(null);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    // Search by barcode first
    const matchedItem = medicines.find(
      (m) => m.barcode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matchedItem) {
      if (matchedItem.batches.length === 1) {
        addItemToCart(matchedItem, matchedItem.batches[0]);
      } else {
        // Multiple batches: open batch picker
        setBatchPickerItem(matchedItem);
      }
      setBarcodeInput('');
      return;
    }

    // Try finding by exact name or partial match
    const nameMatch = medicines.find((m) =>
      m.name.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (nameMatch) {
      if (nameMatch.batches.length === 1) {
        addItemToCart(nameMatch, nameMatch.batches[0]);
      } else {
        setBatchPickerItem(nameMatch);
      }
      setBarcodeInput('');
      return;
    }

    sound.playAlert();
    showFeedback('error', `Barcode "${cleanCode}" not found in inventory!`);
  };

  // Cart Qty updates
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.maxStock) {
      sound.playAlert();
      showFeedback('warning', `Cannot exceed available batch stock of ${item.maxStock}`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const updateDiscount = (index: number, discount: number) => {
    const updated = [...cart];
    updated[index].discountPercent = Math.max(0, Math.min(100, discount));
    setCart(updated);
  };

  const updatePrice = (index: number, price: number) => {
    // only if owner or permitted
    if (currentUser.role === 'cashier') {
      showFeedback('warning', 'Only Owner/Admin can alter base selling price.');
      return;
    }
    const updated = [...cart];
    updated[index].salePrice = Math.max(0, price);
    setCart(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from current bill?')) {
      setCart([]);
      setCashTendered('');
      setOnlineAmount('');
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => {
    const itemSub = item.salePrice * item.quantity;
    const itemDisc = (itemSub * item.discountPercent) / 100;
    return sum + (itemSub - itemDisc);
  }, 0);

  const calculatedBillDiscount = 
    billDiscountType === 'percent'
      ? (subtotal * Math.min(100, billDiscountVal)) / 100
      : Math.min(subtotal, billDiscountVal);

  const grandTotal = Math.max(0, subtotal - calculatedBillDiscount);

  const parsedCash = parseFloat(cashTendered) || 0;
  const parsedOnline = parseFloat(onlineAmount) || 0;

  let balanceChange = 0;
  if (paymentMethod === 'cash') {
    balanceChange = parsedCash > grandTotal ? parsedCash - grandTotal : 0;
  }

  // Handle Sale Completion
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      sound.playAlert();
      showFeedback('warning', 'Cart is empty. Scan barcodes or select medicines.');
      return;
    }

    if (paymentMethod === 'cash' && parsedCash < grandTotal) {
      const isShort = window.confirm(
        `Cash received (${formatCurrency(parsedCash)}) is less than total (${formatCurrency(grandTotal)}). Record balance as customer debt/credit?`
      );
      if (!isShort) return;
    }

    if (paymentMethod === 'split' && (parsedCash + parsedOnline) < grandTotal) {
      showFeedback('error', 'Combined Cash + Online payment must equal grand total.');
      return;
    }

    const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNo: generateInvoiceNumber('INV'),
      timestamp: new Date().toISOString(),
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      items: [...cart],
      subtotal: subtotal + calculatedBillDiscount,
      discountAmount: calculatedBillDiscount,
      taxAmount: 0,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === 'cash' ? (parsedCash || grandTotal) : (paymentMethod === 'split' ? parsedCash : 0),
      onlineReceived: paymentMethod === 'online' ? grandTotal : (paymentMethod === 'split' ? parsedOnline : 0),
      onlineProvider: paymentMethod !== 'cash' ? onlineProvider : undefined,
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      status: 'completed',
      notes: transactionNote,
    };

    // Deduct stock for all items
    cart.forEach((c) => {
      onUpdateMedicineStock(c.medicineId, c.batchId, c.quantity);
    });

    onCompleteSale(newSale);
    sound.playCashRegister();
    setPrintedSale(newSale);

    // Reset Form
    setCart([]);
    setBillDiscountVal(0);
    setCashTendered('');
    setOnlineAmount('');
    setTransactionNote('');
    showFeedback('success', `Bill ${newSale.invoiceNo} saved & finalized!`);
  };

  // Filtered search list for quick manual pick
  const filteredMedicines = searchQuery.trim()
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.barcode.includes(searchQuery)
      )
    : [];

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div id="pos-billing-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 text-slate-800">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-amber-500 text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {feedbackMessage.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            {feedbackMessage.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Barcode & Quick Search Action Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 text-white flex flex-wrap items-center justify-between gap-2 shadow-xs">
        {/* Hardware / Laser Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <input
              ref={barcodeInputRef}
              id="barcode-scanner-input"
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode or Type Code + Press Enter..."
              className="w-full bg-slate-950 text-white pl-9 pr-3 py-1.5 rounded border border-emerald-500/70 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 font-mono text-xs placeholder:text-slate-500"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            id="scan-barcode-action-btn"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded font-semibold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan [Enter]</span>
          </button>
        </form>

        {/* Quick Test Demo Barcodes Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] py-0.5">
          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">Demo Barcodes:</span>
          {medicines.slice(0, 4).map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setBarcodeInput(m.barcode);
                const matched = medicines.find((x) => x.id === m.id);
                if (matched) {
                  if (matched.batches.length === 1) {
                    addItemToCart(matched, matched.batches[0]);
                  } else {
                    setBatchPickerItem(matched);
                  }
                }
              }}
              title={`Click to simulate scanning ${m.name}`}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition"
            >
              <Tag className="w-2.5 h-2.5 text-emerald-400" />
              <span>{m.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Search by Name / Generic Modal Trigger */}
        <div className="relative w-56">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            id="medicine-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Name/Generic..."
            className="w-full bg-slate-950 text-white pl-8 pr-2.5 py-1.5 rounded border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-400 text-xs placeholder:text-slate-500"
          />
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-800 border border-slate-300 rounded shadow-xl max-h-60 overflow-y-auto z-50">
              {filteredMedicines.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">No medicine matches search</div>
              ) : (
                filteredMedicines.map((med) => {
                  const effective = getEffectiveBatch(med);
                  return (
                    <div
                      key={med.id}
                      onClick={() => {
                        if (med.batches.length === 1) {
                          addItemToCart(med, med.batches[0]);
                        } else {
                          setBatchPickerItem(med);
                        }
                        setSearchQuery('');
                      }}
                      className="p-2 border-b border-slate-100 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{med.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {med.genericName} • {med.company}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-700">
                          {effective ? formatCurrency(effective.salePrice) : '-'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Stock: {med.batches.reduce((s, b) => s + b.stockQty, 0)} {med.unit}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Billing Workspace: Split Screen Table vs Summary */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 p-2 overflow-hidden">
        {/* Left: Active Cart Items Table (Desktop ERP Density) */}
        <div className="lg:col-span-8 bg-white border border-slate-300 rounded-sm flex flex-col shadow-xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="bg-slate-800 text-slate-200 px-3 py-1.5 flex items-center justify-between text-xs font-semibold border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Current Invoice Items ({cart.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-[11px] bg-slate-700 hover:bg-rose-700 text-slate-200 hover:text-white px-2 py-0.5 rounded border border-slate-600 transition disabled:opacity-40 cursor-pointer"
              >
                Clear [Esc]
              </button>
            </div>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center select-none">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400 border border-slate-200">
                  <Scan className="w-7 h-7" />
                </div>
                <div className="text-sm font-semibold text-slate-700">Scan Barcode or Pick Medicine to Start Bill</div>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Connect any laser/USB barcode reader or click the demo buttons above. Item rate, batch number, and expiry date will be registered automatically.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Medicine / Item Details</th>
                    <th className="p-2">Batch No</th>
                    <th className="p-2">Expiry</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-center w-28">Qty</th>
                    <th className="p-2 text-right w-16">Disc %</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {cart.map((item, idx) => {
                    const itemSubtotal = item.salePrice * item.quantity;
                    const itemDiscount = (itemSubtotal * item.discountPercent) / 100;
                    const itemTotal = itemSubtotal - itemDiscount;
                    const expiryStatus = getExpiryStatus(item.expiryDate);

                    return (
                      <tr key={`${item.medicineId}-${item.batchId}`} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.company} • {item.unit}
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                            {item.batchNo}
                          </span>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                              expiryStatus === 'expired'
                                ? 'bg-rose-100 text-rose-700 border border-rose-300 font-bold'
                                : expiryStatus === 'expiring_soon'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {formatDate(item.expiryDate)}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono">
                          {currentUser.role === 'owner' ? (
                            <input
                              type="number"
                              value={item.salePrice}
                              onChange={(e) => updatePrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 text-right px-1 py-0.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(item.salePrice)}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="inline-flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.maxStock}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                              className="w-10 text-center font-mono font-bold text-xs py-0.5 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Max: {item.maxStock}</div>
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => updateDiscount(idx, parseFloat(e.target.value) || 0)}
                            className="w-12 text-right px-1 py-0.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(itemTotal)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Item Entry Bar for Cashier */}
          <div className="bg-slate-50 border-t border-slate-200 p-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Items in Cart:</span>
              <span className="font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                {cart.length}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold">Total Quantity:</span>
              <span className="font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                {cart.reduce((s, i) => s + i.quantity, 0)} Units
              </span>
            </div>
            <button
              onClick={onOpenReturns}
              className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Customer Returns &amp; Refunds [F4]</span>
            </button>
          </div>
        </div>

        {/* Right: Payment, Customer & Checkout Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-sm flex flex-col shadow-xs overflow-hidden">
          {/* Customer Selection */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Customer Account
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  id="customer-account-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.balance > 0 ? `(Bal: Rs. ${c.balance})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedCustomer && selectedCustomer.balance > 0 && (
              <div className="mt-1.5 text-[11px] bg-amber-50 text-amber-800 p-1.5 rounded border border-amber-200 flex items-center justify-between">
                <span>Previous Ledger Balance:</span>
                <span className="font-mono font-bold">{formatCurrency(selectedCustomer.balance)}</span>
              </div>
            )}
          </div>

          {/* Bill Discount & Taxes */}
          <div className="p-3 space-y-2 border-b border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Subtotal Amount:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-600" />
                <span>Overall Discount:</span>
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={billDiscountType}
                  onChange={(e) => setBillDiscountType(e.target.value as 'percent' | 'flat')}
                  className="bg-slate-100 border border-slate-300 text-[11px] rounded px-1 py-0.5"
                >
                  <option value="percent">%</option>
                  <option value="flat">Rs.</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={billDiscountVal}
                  onChange={(e) => setBillDiscountVal(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {calculatedBillDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-semibold text-[11px]">
                <span>Discount Savings:</span>
                <span className="font-mono">- {formatCurrency(calculatedBillDiscount)}</span>
              </div>
            )}
          </div>

          {/* Grand Total Big Display */}
          <div className="p-3 bg-slate-900 text-white flex flex-col justify-between">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Net Payable Amount
            </div>
            <div className="text-2xl font-mono font-black text-emerald-400 tracking-tight my-1">
              {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Payment Method Selector (Cash / Online / Split) */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex-1">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payment Method
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <button
                type="button"
                id="pay-method-cash-btn"
                onClick={() => setPaymentMethod('cash')}
                className={`py-1.5 px-2 rounded border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                id="pay-method-online-btn"
                onClick={() => setPaymentMethod('online')}
                className={`py-1.5 px-2 rounded border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
                  paymentMethod === 'online'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Online</span>
              </button>

              <button
                type="button"
                id="pay-method-split-btn"
                onClick={() => setPaymentMethod('split')}
                className={`py-1.5 px-2 rounded border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
                  paymentMethod === 'split'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Split className="w-4 h-4" />
                <span>Split</span>
              </button>
            </div>

            {/* Method Details */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Cash Received (Rs):</label>
                  <input
                    type="number"
                    id="cash-tendered-input"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={`e.g. ${grandTotal}`}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Quick Tender Buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[grandTotal, Math.ceil(grandTotal / 100) * 100, 500, 1000, 5000].map((amt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer"
                    >
                      Rs. {amt}
                    </button>
                  ))}
                </div>

                {parsedCash >= grandTotal && (
                  <div className="bg-emerald-50 border border-emerald-300 p-2 rounded flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-semibold">Change to Return:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {formatCurrency(balanceChange)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'online' && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Digital Provider:</label>
                  <select
                    value={onlineProvider}
                    onChange={(e) => setOnlineProvider(e.target.value as OnlineProvider)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium"
                  >
                    <option value="EasyPaisa">EasyPaisa (QR / Phone)</option>
                    <option value="JazzCash">JazzCash (Mobile Account)</option>
                    <option value="Card">Visa / MasterCard (POS Machine)</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="UPI">UPI / Instant Online</option>
                    <option value="Other">Other Digital Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Transaction Ref / Note:</label>
                  <input
                    type="text"
                    value={transactionNote}
                    onChange={(e) => setTransactionNote(e.target.value)}
                    placeholder="Ref # or last 4 digits..."
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'split' && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-0.5">Cash (Rs):</label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="Cash part"
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-0.5">Online (Rs):</label>
                    <input
                      type="number"
                      value={onlineAmount}
                      onChange={(e) => setOnlineAmount(e.target.value)}
                      placeholder="Online part"
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Provider: EasyPaisa / Card / JazzCash
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Finalize Bill */}
          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
            <button
              type="button"
              id="finalize-sale-btn"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white py-2.5 px-4 rounded font-bold text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>Complete Sale &amp; Print [F12]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Picker Modal (When medicine has multiple batches) */}
      {batchPickerItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl border border-slate-300 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{batchPickerItem.name}</h3>
                <p className="text-xs text-slate-400">{batchPickerItem.company} • Select Batch</p>
              </div>
              <button
                onClick={() => setBatchPickerItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-slate-600 mb-3">
                Multiple batches found in stock. Choose which batch to dispense (FIFO recommended):
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batchPickerItem.batches.map((b) => {
                  const expiryStatus = getExpiryStatus(b.expiryDate);
                  return (
                    <div
                      key={b.id}
                      onClick={() => addItemToCart(batchPickerItem, b)}
                      className={`p-3 rounded border flex items-center justify-between cursor-pointer transition ${
                        b.stockQty <= 0
                          ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                          : 'hover:border-emerald-500 hover:bg-emerald-50/50 bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            Batch: {b.batchNo}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              expiryStatus === 'expired'
                                ? 'bg-rose-100 text-rose-700'
                                : expiryStatus === 'expiring_soon'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Exp: {formatDate(b.expiryDate)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Available Stock: <strong className="text-slate-800">{b.stockQty}</strong> {batchPickerItem.unit}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-emerald-700">
                          {formatCurrency(b.salePrice)}
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          {b.stockQty > 0 ? 'Select Batch →' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-100 px-4 py-2 text-right border-t border-slate-200">
              <button
                onClick={() => setBatchPickerItem(null)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Preview Modal */}
      {printedSale && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thermal Receipt Print Preview (80mm)</span>
              </span>
              <button onClick={() => setPrintedSale(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-4 overflow-y-auto font-mono text-[11px] text-slate-900 bg-white">
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <div className="font-bold text-sm text-slate-900">AL-SHIFA PHARMACY &amp; SURGICALS</div>
                <div className="text-[10px] text-slate-600">Main Commercial Market, Sector G-10</div>
                <div className="text-[10px] text-slate-600">Drug Lic # 04-29910 • Phone: 051-2244668</div>
                <div className="text-[10px] font-bold text-emerald-700 mt-1">TAX INVOICE / CASH MEMO</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-bold">{printedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{new Date(printedSale.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{printedSale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{printedSale.customerName}</span>
                </div>
              </div>

              {/* Items List */}
              <table className="w-full my-2 text-[10px]">
                <thead>
                  <tr className="border-b border-slate-400 text-left">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Batch</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-slate-300">
                  {printedSale.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-[9px] text-slate-500">Exp: {item.expiryDate}</div>
                      </td>
                      <td className="py-1 text-center text-[9px]">{item.batchNo}</td>
                      <td className="py-1 text-center font-bold">{item.quantity}</td>
                      <td className="py-1 text-right font-bold">
                        {formatCurrency(item.salePrice * item.quantity * (1 - item.discountPercent / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(printedSale.subtotal)}</span>
                </div>
                {printedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>- {formatCurrency(printedSale.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs border-t border-slate-300 pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>{formatCurrency(printedSale.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Paid ({printedSale.paymentMethod.toUpperCase()}):</span>
                  <span>
                    {formatCurrency(printedSale.cashReceived + printedSale.onlineReceived)}
                  </span>
                </div>
              </div>

              {/* Barcode & Footer */}
              <div className="text-center pt-4 border-t border-dashed border-slate-400 mt-3 text-[9px] text-slate-500">
                <div className="font-mono text-center tracking-widest text-[12px] font-bold text-slate-800">
                  * {printedSale.invoiceNo} *
                </div>
                <p className="mt-1">Medicines once sold can only be returned within 3 days with original bill.</p>
                <p className="font-bold text-slate-700">Thank You For Choosing Us! Get Well Soon.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-100 p-3 border-t border-slate-300 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setPrintedSale(null)}
                className="px-3 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
