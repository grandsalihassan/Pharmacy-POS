import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  Boxes, 
  ArrowRight, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import { MedicineItem, UserProfile } from '../types';
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryStatus } from '../utils/formatters';

interface AlertsModuleProps {
  medicines: MedicineItem[];
  currentUser: UserProfile;
  onNavigateToPurchase: () => void;
  onRemoveExpiredBatch: (medicineId: string, batchId: string) => void;
}

export const AlertsModule: React.FC<AlertsModuleProps> = ({
  medicines,
  currentUser,
  onNavigateToPurchase,
  onRemoveExpiredBatch,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'expired' | 'expiring' | 'low_stock'>('all');

  // Collect all alerts
  const expiredItems: { med: MedicineItem; batch: any; days: number }[] = [];
  const expiringSoonItems: { med: MedicineItem; batch: any; days: number }[] = [];
  const lowStockItems: { med: MedicineItem; totalStock: number; minStock: number }[] = [];

  medicines.forEach((med) => {
    const totalStock = med.batches.reduce((sum, b) => sum + b.stockQty, 0);
    const minAlert = med.batches[0]?.minStockAlert || 10;

    if (totalStock <= minAlert) {
      lowStockItems.push({ med, totalStock, minStock: minAlert });
    }

    med.batches.forEach((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      if (days < 0) {
        expiredItems.push({ med, batch: b, days });
      } else if (days <= 60) {
        expiringSoonItems.push({ med, batch: b, days });
      }
    });
  });

  return (
    <div id="alerts-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 p-2">
      {/* Top Header */}
      <div className="bg-white border border-slate-300 rounded-sm p-3 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div>
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Inventory Alert &amp; Quality Control Center</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time automated detection of critically low stocks, expired batches, and medicines expiring within 60 days.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Alerts ({expiredItems.length + expiringSoonItems.length + lowStockItems.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'expired'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Expired ({expiredItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'expiring'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring Soon ({expiringSoonItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('low_stock')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'low_stock'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-900 hover:bg-orange-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Low Stock ({lowStockItems.length})</span>
          </button>
        </div>
      </div>

      {/* Main Alert Lists */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* 1. Expired Items Warning Section */}
        {(activeTab === 'all' || activeTab === 'expired') && expiredItems.length > 0 && (
          <div className="bg-white border-2 border-rose-500 rounded-sm shadow-xs overflow-hidden">
            <div className="bg-rose-600 text-white px-3 py-2 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span>CRITICAL: Expired Batches in Pharmacy ({expiredItems.length})</span>
              </div>
              <span className="text-[11px] bg-rose-950/50 px-2 py-0.5 rounded font-normal">
                Must be removed from shelves immediately
              </span>
            </div>

            <div className="p-2 divide-y divide-slate-100">
              {expiredItems.map(({ med, batch, days }) => (
                <div key={batch.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-rose-50/50">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {med.company} • Rack: <strong>{med.rackLocation}</strong> • Batch:{' '}
                      <strong className="font-mono text-rose-700">{batch.batchNo}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-700 text-xs">
                        Expired {Math.abs(days)} days ago ({formatDate(batch.expiryDate)})
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Expired Stock on Shelf: <strong>{batch.stockQty} {med.unit}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm(`Discard and remove expired batch ${batch.batchNo} of ${med.name}?`)) {
                          onRemoveExpiredBatch(med.id, batch.id);
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard Stock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Expiring Soon (< 60 days) Section */}
        {(activeTab === 'all' || activeTab === 'expiring') && expiringSoonItems.length > 0 && (
          <div className="bg-white border border-amber-400 rounded-sm shadow-xs overflow-hidden">
            <div className="bg-amber-600 text-white px-3 py-2 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Expiring Within 60 Days ({expiringSoonItems.length})</span>
              </div>
              <span className="text-[11px] bg-amber-950/40 px-2 py-0.5 rounded font-normal">
                FIFO Dispense priority or return to supplier
              </span>
            </div>

            <div className="p-2 divide-y divide-slate-100">
              {expiringSoonItems.map(({ med, batch, days }) => (
                <div key={batch.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-amber-50/50">
                  <div>
                    <div className="font-bold text-slate-900">{med.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {med.company} • Rack: {med.rackLocation} • Batch: <strong className="font-mono">{batch.batchNo}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-800 text-xs">
                        Expires in {days} days ({formatDate(batch.expiryDate)})
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Remaining Stock: <strong>{batch.stockQty} {med.unit}</strong>
                      </div>
                    </div>

                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-1 rounded">
                      Fast Dispense
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Low Stock Section */}
        {(activeTab === 'all' || activeTab === 'low_stock') && lowStockItems.length > 0 && (
          <div className="bg-white border border-orange-400 rounded-sm shadow-xs overflow-hidden">
            <div className="bg-orange-600 text-white px-3 py-2 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <span>Low Stock Threshold Alerts ({lowStockItems.length})</span>
              </div>
              <span className="text-[11px] bg-orange-950/40 px-2 py-0.5 rounded font-normal">
                Stock is below minimum reorder level
              </span>
            </div>

            <div className="p-2 divide-y divide-slate-100">
              {lowStockItems.map(({ med, totalStock, minStock }) => (
                <div key={med.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-orange-50/50">
                  <div>
                    <div className="font-bold text-slate-900">{med.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {med.company} • {med.category} • Rack: {med.rackLocation}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-700 text-xs">
                        Current Stock: {totalStock} {med.unit}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Min Alert Level: {minStock} {med.unit}
                      </div>
                    </div>

                    <button
                      onClick={onNavigateToPurchase}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Order Stock (GRN)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expiredItems.length === 0 && expiringSoonItems.length === 0 && lowStockItems.length === 0 && (
          <div className="bg-white border border-slate-300 rounded p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-800">No Critical Alerts Found</div>
            <p className="text-xs text-slate-500 mt-1">All medicine batches are well within expiry dates and stock levels are healthy.</p>
          </div>
        )}
      </div>
    </div>
  );
};
