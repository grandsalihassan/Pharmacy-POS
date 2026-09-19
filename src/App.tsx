import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MEDICINES, 
  INITIAL_USERS, 
  INITIAL_ACCOUNTS, 
  INITIAL_SALES, 
  INITIAL_PURCHASES, 
  INITIAL_DEVICES 
} from './data/mockData';
import { 
  MedicineItem, 
  UserProfile, 
  SaleTransaction, 
  PurchaseInvoice, 
  AccountParty, 
  ConnectedDevice, 
  ReturnRecord 
} from './types';
import { DesktopTitleBar } from './components/DesktopTitleBar';
import { DesktopRibbonNav, ActiveTab } from './components/DesktopRibbonNav';
import { DesktopStatusBar } from './components/DesktopStatusBar';
import { PosBillingModule } from './components/PosBillingModule';
import { InventoryModule } from './components/InventoryModule';
import { PurchasesModule } from './components/PurchasesModule';
import { SalesReturnsModule } from './components/SalesReturnsModule';
import { AccountsModule } from './components/AccountsModule';
import { ReportsModule } from './components/ReportsModule';
import { AlertsModule } from './components/AlertsModule';
import { RemoteAccessModal } from './components/RemoteAccessModal';
import { UserSwitchModal } from './components/UserSwitchModal';
import { CalculatorModal } from './components/CalculatorModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { getDaysUntilExpiry } from './utils/formatters';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Multi-user Login State
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // Default to Owner

  // Core Data States (with local persistence fallback)
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    const saved = localStorage.getItem('pharmapos_medicines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MEDICINES;
      }
    }
    return INITIAL_MEDICINES;
  });

  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('pharmapos_sales');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SALES;
      }
    }
    return INITIAL_SALES;
  });

  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('pharmapos_purchases');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PURCHASES;
      }
    }
    return INITIAL_PURCHASES;
  });

  const [accounts, setAccounts] = useState<AccountParty[]>(() => {
    const saved = localStorage.getItem('pharmapos_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ACCOUNTS;
      }
    }
    return INITIAL_ACCOUNTS;
  });

  const [devices] = useState<ConnectedDevice[]>(INITIAL_DEVICES);

  // Modal Dialogs
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobilePreviewActive, setIsMobilePreviewActive] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('pharmapos_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('pharmapos_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('pharmapos_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('pharmapos_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Global Keyboard Shortcuts (F1 - F10, F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea/select unless it's a function key
      const isFunctionKey = e.key.startsWith('F') || e.key === 'Escape';
      if (isFunctionKey) {
        if (e.key === 'F1') {
          e.preventDefault();
          setActiveTab('pos');
        } else if (e.key === 'F2') {
          e.preventDefault();
          setActiveTab('inventory');
        } else if (e.key === 'F3') {
          e.preventDefault();
          setActiveTab('purchases');
        } else if (e.key === 'F4') {
          e.preventDefault();
          setActiveTab('returns');
        } else if (e.key === 'F5') {
          e.preventDefault();
          setActiveTab('accounts');
        } else if (e.key === 'F6') {
          e.preventDefault();
          setActiveTab('reports');
        } else if (e.key === 'F7') {
          e.preventDefault();
          setActiveTab('alerts');
        } else if (e.key === 'F8') {
          e.preventDefault();
          setIsUserSwitchOpen(true);
        } else if (e.key === 'F9') {
          e.preventDefault();
          setIsRemoteModalOpen(true);
        } else if (e.key === 'F10') {
          e.preventDefault();
          setIsCalculatorOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Alerts Count
  const alertsCount = React.useMemo(() => {
    let lowStock = 0;
    let expiring = 0;
    let expired = 0;

    medicines.forEach((m) => {
      const totalStock = m.batches.reduce((sum, b) => sum + b.stockQty, 0);
      const minAlert = m.batches[0]?.minStockAlert || 10;
      if (totalStock <= minAlert) lowStock++;

      m.batches.forEach((b) => {
        const days = getDaysUntilExpiry(b.expiryDate);
        if (days < 0) expired++;
        else if (days <= 60) expiring++;
      });
    });

    return { lowStock, expiring, expired };
  }, [medicines]);

  // Inventory updates from POS Sale
  const handleUpdateMedicineStock = (medicineId: string, batchId: string, quantityDeducted: number) => {
    setMedicines((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id !== medicineId) return med;
        const updatedBatches = med.batches.map((batch) => {
          if (batch.id !== batchId) return batch;
          return {
            ...batch,
            stockQty: Math.max(0, batch.stockQty - quantityDeducted),
          };
        });
        return { ...med, batches: updatedBatches };
      })
    );
  };

  // Inventory updates from Inward Purchase
  const handleUpdateMedicineStockFromPurchase = (
    medicineId: string,
    batchNo: string,
    expiryDate: string,
    purchasePrice: number,
    salePrice: number,
    qty: number
  ) => {
    setMedicines((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id !== medicineId) return med;
        const existingBatchIndex = med.batches.findIndex(
          (b) => b.batchNo.toLowerCase() === batchNo.toLowerCase()
        );

        if (existingBatchIndex > -1) {
          const updatedBatches = [...med.batches];
          const curr = updatedBatches[existingBatchIndex];
          updatedBatches[existingBatchIndex] = {
            ...curr,
            stockQty: curr.stockQty + qty,
            purchasePrice,
            salePrice,
            expiryDate,
          };
          return { ...med, batches: updatedBatches };
        } else {
          // New batch
          const newBatch = {
            id: `b-${Date.now()}`,
            batchNo,
            expiryDate,
            purchasePrice,
            salePrice,
            stockQty: qty,
            minStockAlert: 10,
          };
          return { ...med, batches: [...med.batches, newBatch] };
        }
      })
    );
  };

  // Process customer sale return
  const handleProcessReturn = (
    returnRecord: ReturnRecord,
    medicineId: string,
    batchId: string,
    quantityRestored: number
  ) => {
    // Restore stock
    setMedicines((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id !== medicineId) return med;
        const updatedBatches = med.batches.map((batch) => {
          if (batch.id !== batchId) return batch;
          return {
            ...batch,
            stockQty: batch.stockQty + quantityRestored,
          };
        });
        return { ...med, batches: updatedBatches };
      })
    );
  };

  // Discard expired batch
  const handleRemoveExpiredBatch = (medicineId: string, batchId: string) => {
    setMedicines((prevMeds) =>
      prevMeds.map((med) => {
        if (med.id !== medicineId) return med;
        return {
          ...med,
          batches: med.batches.filter((b) => b.id !== batchId),
        };
      })
    );
  };

  // Reconcile party payment
  const handleRecordPayment = (
    partyId: string,
    amount: number,
    paymentType: 'payment_made' | 'payment_received'
  ) => {
    setAccounts((prevAccs) =>
      prevAccs.map((acc) => {
        if (acc.id !== partyId) return acc;
        const updatedBalance = Math.max(0, acc.balance - amount);
        return {
          ...acc,
          balance: updatedBalance,
          totalTransactions: acc.totalTransactions + 1,
          lastTransactionDate: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const customersList = accounts.filter((a) => a.type === 'customer');
  const suppliersList = accounts.filter((a) => a.type === 'supplier');

  const content = (
    <div className="flex flex-col h-screen w-full bg-slate-950 font-sans select-none overflow-hidden">
      {/* 1. Desktop Window Title Bar */}
      <DesktopTitleBar
        currentUser={currentUser}
        onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Desktop Command Ribbon / Module Switcher */}
      <DesktopRibbonNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'remote') {
            setIsRemoteModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        userRole={currentUser.role}
        alertsCount={alertsCount}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'pos' && (
          <PosBillingModule
            medicines={medicines}
            customers={customersList}
            currentUser={currentUser}
            onCompleteSale={(newSale) => setSales([newSale, ...sales])}
            onUpdateMedicineStock={handleUpdateMedicineStock}
            onOpenReturns={() => setActiveTab('returns')}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryModule
            medicines={medicines}
            currentUser={currentUser}
            onAddMedicine={(newMed) => setMedicines([newMed, ...medicines])}
            onUpdateMedicine={(updatedMed) =>
              setMedicines(medicines.map((m) => (m.id === updatedMed.id ? updatedMed : m)))
            }
            onDeleteMedicine={(id) => setMedicines(medicines.filter((m) => m.id !== id))}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesModule
            purchases={purchases}
            suppliers={suppliersList}
            medicines={medicines}
            currentUser={currentUser}
            onAddPurchase={(newPur) => setPurchases([newPur, ...purchases])}
            onUpdateMedicineStockFromPurchase={handleUpdateMedicineStockFromPurchase}
          />
        )}

        {activeTab === 'returns' && (
          <SalesReturnsModule
            sales={sales}
            currentUser={currentUser}
            onProcessReturn={handleProcessReturn}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsModule
            accounts={accounts}
            currentUser={currentUser}
            onAddAccount={(newParty) => setAccounts([newParty, ...accounts])}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsModule
            sales={sales}
            purchases={purchases}
            currentUser={currentUser}
            onRequestOwnerAccess={() => setIsUserSwitchOpen(true)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsModule
            medicines={medicines}
            currentUser={currentUser}
            onNavigateToPurchase={() => setActiveTab('purchases')}
            onRemoveExpiredBatch={handleRemoveExpiredBatch}
          />
        )}
      </div>

      {/* 4. Desktop Status Bar */}
      <DesktopStatusBar
        currentUser={currentUser}
        totalSalesToday={sales.reduce((sum, s) => sum + s.grandTotal, 0)}
      />

      {/* Modals & Tools */}
      <UserSwitchModal
        isOpen={isUserSwitchOpen}
        currentUser={currentUser}
        users={users}
        onClose={() => setIsUserSwitchOpen(false)}
        onSelectUser={(u) => setCurrentUser(u)}
      />

      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <RemoteAccessModal
        isOpen={isRemoteModalOpen}
        devices={devices}
        onClose={() => setIsRemoteModalOpen(false)}
        onToggleMobilePreview={() => setIsMobilePreviewActive((prev) => !prev)}
        isMobilePreviewActive={isMobilePreviewActive}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );

  // If Mobile Preview simulator is active, display in phone shell
  if (isMobilePreviewActive) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center justify-center">
        <div className="mb-3 flex items-center justify-between w-full max-w-sm text-xs text-white">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Mobile Remote Access Simulator</span>
          </div>
          <button
            onClick={() => setIsMobilePreviewActive(false)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Exit to Desktop Mode</span>
          </button>
        </div>

        {/* Smartphone Bezel */}
        <div className="w-full max-w-sm h-[820px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-700 flex flex-col overflow-hidden relative ring-8 ring-black/40">
          {/* Phone speaker / camera pill */}
          <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
          </div>
          <div className="flex-1 rounded-[24px] overflow-hidden flex flex-col border border-slate-800">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
}
