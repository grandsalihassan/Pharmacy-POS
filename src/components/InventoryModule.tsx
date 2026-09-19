import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Calendar, 
  Tag, 
  Barcode, 
  Layers, 
  X, 
  CheckCircle2,
  ArrowUpDown,
  Building2
} from 'lucide-react';
import { MedicineItem, Batch, UserProfile } from '../types';
import { formatCurrency, formatDate, getExpiryStatus, getDaysUntilExpiry } from '../utils/formatters';
import { sound } from '../utils/audio';

interface InventoryModuleProps {
  medicines: MedicineItem[];
  currentUser: UserProfile;
  onAddMedicine: (newMed: MedicineItem) => void;
  onUpdateMedicine: (updatedMed: MedicineItem) => void;
  onDeleteMedicine: (id: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  medicines,
  currentUser,
  onAddMedicine,
  onUpdateMedicine,
  onDeleteMedicine,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'expiring' | 'expired'>('all');

  // Add Medicine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    company: '',
    category: 'Tablet' as MedicineItem['category'],
    unit: 'Strip' as MedicineItem['unit'],
    barcode: '',
    rackLocation: 'Rack A-01',
    batchNo: '',
    expiryDate: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQty: 0,
    minStockAlert: 10,
  });

  // Add Batch Modal State
  const [selectedMedForBatch, setSelectedMedForBatch] = useState<MedicineItem | null>(null);
  const [newBatchData, setNewBatchData] = useState({
    batchNo: '',
    expiryDate: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQty: 0,
    minStockAlert: 10,
  });

  // Extract unique companies & categories
  const companies = Array.from(new Set(medicines.map((m) => m.company)));
  const categories = ['All', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Surgical'];

  // Filter Logic
  const filteredMedicines = medicines.filter((med) => {
    // Search filter
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.barcode.includes(searchQuery) ||
      med.batches.some((b) => b.batchNo.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Category filter
    if (categoryFilter !== 'All' && med.category !== categoryFilter) return false;

    // Company filter
    if (companyFilter !== 'All' && med.company !== companyFilter) return false;

    // Status filter
    if (statusFilter === 'all') return true;

    const totalStock = med.batches.reduce((sum, b) => sum + b.stockQty, 0);
    const minStock = med.batches[0]?.minStockAlert || 10;

    if (statusFilter === 'low_stock') {
      return totalStock <= minStock;
    }

    if (statusFilter === 'expiring') {
      return med.batches.some((b) => {
        const days = getDaysUntilExpiry(b.expiryDate);
        return days >= 0 && days <= 60;
      });
    }

    if (statusFilter === 'expired') {
      return med.batches.some((b) => getDaysUntilExpiry(b.expiryDate) < 0);
    }

    return true;
  });

  // Handle Add Medicine Submit
  const handleCreateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.batchNo || !formData.expiryDate) {
      alert('Please fill in required fields (Name, Company, Batch No, and Expiry Date).');
      return;
    }

    const newMed: MedicineItem = {
      id: `med-${Date.now()}`,
      barcode: formData.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      name: formData.name,
      genericName: formData.genericName || formData.name,
      company: formData.company,
      category: formData.category,
      unit: formData.unit,
      rackLocation: formData.rackLocation,
      batches: [
        {
          id: `b-${Date.now()}`,
          batchNo: formData.batchNo.toUpperCase(),
          expiryDate: formData.expiryDate,
          purchasePrice: Number(formData.purchasePrice),
          salePrice: Number(formData.salePrice),
          stockQty: Number(formData.stockQty),
          minStockAlert: Number(formData.minStockAlert) || 10,
        },
      ],
    };

    onAddMedicine(newMed);
    sound.playBeep(1800, 0.1);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      genericName: '',
      company: '',
      category: 'Tablet',
      unit: 'Strip',
      barcode: '',
      rackLocation: 'Rack A-01',
      batchNo: '',
      expiryDate: '',
      purchasePrice: 0,
      salePrice: 0,
      stockQty: 0,
      minStockAlert: 10,
    });
  };

  // Handle Add Batch to existing item
  const handleAddBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForBatch || !newBatchData.batchNo || !newBatchData.expiryDate) {
      alert('Please enter Batch Number and Expiry Date.');
      return;
    }

    const newBatch: Batch = {
      id: `b-${Date.now()}`,
      batchNo: newBatchData.batchNo.toUpperCase(),
      expiryDate: newBatchData.expiryDate,
      purchasePrice: Number(newBatchData.purchasePrice),
      salePrice: Number(newBatchData.salePrice),
      stockQty: Number(newBatchData.stockQty),
      minStockAlert: Number(newBatchData.minStockAlert) || 10,
    };

    const updatedMed = {
      ...selectedMedForBatch,
      batches: [...selectedMedForBatch.batches, newBatch],
    };

    onUpdateMedicine(updatedMed);
    sound.playBeep(2000, 0.1);
    setSelectedMedForBatch(null);
    setNewBatchData({
      batchNo: '',
      expiryDate: '',
      purchasePrice: 0,
      salePrice: 0,
      stockQty: 0,
      minStockAlert: 10,
    });
  };

  return (
    <div id="inventory-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border-b border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        {/* Left: Quick Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              id="inventory-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Medicine, Generic, Company, Batch or Barcode..."
              className="w-full bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 text-[11px] font-semibold rounded cursor-pointer transition ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              All Items ({medicines.length})
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`px-2 py-1 text-[11px] font-semibold rounded cursor-pointer transition flex items-center gap-1 ${
                statusFilter === 'low_stock'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Low Stock</span>
            </button>
            <button
              onClick={() => setStatusFilter('expiring')}
              className={`px-2 py-1 text-[11px] font-semibold rounded cursor-pointer transition flex items-center gap-1 ${
                statusFilter === 'expiring'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              }`}
            >
              <span>Expiring &lt;60d</span>
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-2 py-1 text-[11px] font-semibold rounded cursor-pointer transition flex items-center gap-1 ${
                statusFilter === 'expired'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              }`}
            >
              <span>Expired</span>
            </button>
          </div>
        </div>

        {/* Right: Dropdown Filters & Add Medicine Button */}
        <div className="flex items-center gap-2">
          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Company dropdown */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-medium max-w-[180px]"
          >
            <option value="All">All Companies</option>
            {companies.map((co) => (
              <option key={co} value={co}>
                {co}
              </option>
            ))}
          </select>

          {/* Add Medicine Button */}
          <button
            id="add-medicine-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine / Item</span>
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-300 rounded-sm flex-1 flex flex-col shadow-xs overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-200 border-b border-slate-700 sticky top-0 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="p-2.5">Barcode / ID</th>
                  <th className="p-2.5">Medicine Name &amp; Generic</th>
                  <th className="p-2.5">Company / Rack</th>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5">Batches, Expiry &amp; Stock</th>
                  <th className="p-2.5 text-right">Purchase Rate</th>
                  <th className="p-2.5 text-right">Sale Rate</th>
                  <th className="p-2.5 text-right">Total Stock</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No medicines match the selected filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((med) => {
                    const totalStock = med.batches.reduce((sum, b) => sum + b.stockQty, 0);
                    const minStock = med.batches[0]?.minStockAlert || 10;
                    const isLow = totalStock <= minStock;
                    const hasExpired = med.batches.some((b) => getExpiryStatus(b.expiryDate) === 'expired');
                    const hasExpiringSoon = med.batches.some((b) => getExpiryStatus(b.expiryDate) === 'expiring_soon');

                    return (
                      <tr key={med.id} className="hover:bg-slate-50">
                        {/* Barcode */}
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          <div className="flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{med.barcode}</span>
                          </div>
                        </td>

                        {/* Medicine & Generic */}
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 text-xs">{med.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {med.genericName}
                          </div>
                        </td>

                        {/* Company & Rack */}
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-700">{med.company}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              {med.rackLocation}
                            </span>
                            <span>• {med.category}</span>
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="p-2.5 font-medium text-slate-700">{med.unit}</td>

                        {/* Batches & Expiry Dates */}
                        <td className="p-2.5">
                          <div className="space-y-1">
                            {med.batches.map((b) => {
                              const expStatus = getExpiryStatus(b.expiryDate);
                              const daysLeft = getDaysUntilExpiry(b.expiryDate);
                              return (
                                <div
                                  key={b.id}
                                  className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                                >
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="font-bold text-slate-800">{b.batchNo}</span>
                                    <span className="text-slate-400">|</span>
                                    <span
                                      className={`px-1 rounded text-[10px] font-semibold ${
                                        expStatus === 'expired'
                                          ? 'bg-rose-100 text-rose-700'
                                          : expStatus === 'expiring_soon'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      Exp: {formatDate(b.expiryDate)} ({daysLeft < 0 ? 'EXPIRED' : `${daysLeft}d`})
                                    </span>
                                  </div>
                                  <div className="font-mono text-slate-700 text-[10px]">
                                    Qty: <strong>{b.stockQty}</strong>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMedForBatch(med);
                              setNewBatchData({
                                batchNo: '',
                                expiryDate: '',
                                purchasePrice: med.batches[0]?.purchasePrice || 0,
                                salePrice: med.batches[0]?.salePrice || 0,
                                stockQty: 0,
                                minStockAlert: 10,
                              });
                            }}
                            className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>+ Add New Batch</span>
                          </button>
                        </td>

                        {/* Purchase Rate */}
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {currentUser.role === 'owner' ? (
                            formatCurrency(med.batches[0]?.purchasePrice || 0)
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Protected</span>
                          )}
                        </td>

                        {/* Sale Rate */}
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(med.batches[0]?.salePrice || 0)}
                        </td>

                        {/* Total Stock */}
                        <td className="p-2.5 text-right font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isLow
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'text-slate-800'
                            }`}
                          >
                            {totalStock} {med.unit}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="p-2.5 text-center">
                          {hasExpired ? (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              EXPIRED
                            </span>
                          ) : hasExpiringSoon ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              EXPIRING SOON
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                              NORMAL
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                if (currentUser.role !== 'owner') {
                                  alert('Only Owner has permission to delete items.');
                                  return;
                                }
                                if (window.confirm(`Delete ${med.name} from inventory?`)) {
                                  onDeleteMedicine(med.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Status */}
          <div className="bg-slate-100 border-t border-slate-300 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <strong>{filteredMedicines.length}</strong> of <strong>{medicines.length}</strong> items in inventory
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                ● Normal
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                ▲ Low Stock Alert
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-semibold">
                ■ Expired / Near Expiry
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Add New Medicine / Product to Inventory</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Medicine / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panadol 500mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Generic Formula / Chemical
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Manufacturer / Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSK, Abbott, Getz"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Barcode (Laser / EAN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 896400010099 (or leave blank to auto-generate)"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as MedicineItem['category'],
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Surgical">Surgical</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: e.target.value as MedicineItem['unit'],
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Strip">Strip</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-02"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Min Stock Alert Level
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockAlert: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Initial Batch Information Header */}
              <div className="bg-slate-100 p-3 rounded border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Initial Batch &amp; Pricing Details</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Batch Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BT-9921"
                      value={formData.batchNo}
                      onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Initial Stock Qty</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Purchase Price (Rs)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sale Price (Rs) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.salePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, salePrice: Number(e.target.value) })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono bg-white font-bold text-emerald-700"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="text-[11px] text-slate-500 pb-1">
                      Profit Margin:{' '}
                      <strong className="text-emerald-700">
                        {formData.purchasePrice > 0
                          ? `${(
                              ((formData.salePrice - formData.purchasePrice) /
                                formData.purchasePrice) *
                              100
                            ).toFixed(1)}%`
                          : '-'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-xs cursor-pointer"
                >
                  Save Item to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch to Existing Medicine Modal */}
      {selectedMedForBatch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Add New Batch</h3>
                <p className="text-xs text-slate-400">{selectedMedForBatch.name}</p>
              </div>
              <button
                onClick={() => setSelectedMedForBatch(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBatchSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BT-2026-09"
                  value={newBatchData.batchNo}
                  onChange={(e) => setNewBatchData({ ...newBatchData, batchNo: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={newBatchData.expiryDate}
                  onChange={(e) => setNewBatchData({ ...newBatchData, expiryDate: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purchase Rate (Rs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBatchData.purchasePrice}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, purchasePrice: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sale Rate (Rs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBatchData.salePrice}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, salePrice: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Batch Stock Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newBatchData.stockQty}
                  onChange={(e) =>
                    setNewBatchData({ ...newBatchData, stockQty: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedMedForBatch(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
