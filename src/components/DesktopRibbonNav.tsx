import React from 'react';
import { 
  Scan, 
  Boxes, 
  ShoppingBag, 
  RotateCcw, 
  BookOpen, 
  BarChart3, 
  AlertTriangle, 
  Smartphone,
  Sparkles,
  Search
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveTab = 
  | 'pos' 
  | 'inventory' 
  | 'purchases' 
  | 'returns' 
  | 'accounts' 
  | 'reports' 
  | 'alerts' 
  | 'remote';

interface DesktopRibbonNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  alertsCount: {
    lowStock: number;
    expiring: number;
    expired: number;
  };
}

export const DesktopRibbonNav: React.FC<DesktopRibbonNavProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  alertsCount,
}) => {
  const totalAlerts = alertsCount.lowStock + alertsCount.expiring + alertsCount.expired;

  const navItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'POS Billing',
      sublabel: 'Barcode & Cash Register',
      hotkey: 'F1',
      icon: Scan,
      badge: null,
      color: 'hover:border-emerald-500',
      activeColor: 'bg-emerald-700 text-white border-emerald-600 shadow-xs',
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Stock / Inventory',
      sublabel: 'Batches, Expiry & Rates',
      hotkey: 'F2',
      icon: Boxes,
      badge: null,
      color: 'hover:border-blue-500',
      activeColor: 'bg-blue-700 text-white border-blue-600 shadow-xs',
    },
    {
      id: 'purchases' as ActiveTab,
      label: 'Purchase (Inward)',
      sublabel: 'Supplier Invoices & GRN',
      hotkey: 'F3',
      icon: ShoppingBag,
      badge: null,
      roleRestricted: false,
      color: 'hover:border-indigo-500',
      activeColor: 'bg-indigo-700 text-white border-indigo-600 shadow-xs',
    },
    {
      id: 'returns' as ActiveTab,
      label: 'Sales & Returns',
      sublabel: 'Invoices & Customer Refunds',
      hotkey: 'F4',
      icon: RotateCcw,
      badge: null,
      color: 'hover:border-amber-500',
      activeColor: 'bg-amber-700 text-white border-amber-600 shadow-xs',
    },
    {
      id: 'accounts' as ActiveTab,
      label: 'Accounts & Ledgers',
      sublabel: 'Customer & Supplier Balances',
      hotkey: 'F5',
      icon: BookOpen,
      badge: null,
      color: 'hover:border-purple-500',
      activeColor: 'bg-purple-700 text-white border-purple-600 shadow-xs',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Profit / Loss & Reports',
      sublabel: 'Daily / Monthly P&L Analytics',
      hotkey: 'F6',
      icon: BarChart3,
      badge: userRole === 'cashier' ? 'Owner Only' : null,
      color: 'hover:border-rose-500',
      activeColor: 'bg-rose-700 text-white border-rose-600 shadow-xs',
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Alerts Manager',
      sublabel: 'Low Stock & Expiry Flags',
      hotkey: 'F7',
      icon: AlertTriangle,
      badge: totalAlerts > 0 ? `${totalAlerts}` : null,
      badgeType: 'danger',
      color: 'hover:border-red-500',
      activeColor: 'bg-red-700 text-white border-red-600 shadow-xs',
    },
    {
      id: 'remote' as ActiveTab,
      label: 'Mobile / Laptop Remote',
      sublabel: 'Cloud Access & Live Dock',
      hotkey: 'F9',
      icon: Smartphone,
      badge: 'Live',
      badgeType: 'success',
      color: 'hover:border-cyan-500',
      activeColor: 'bg-cyan-700 text-white border-cyan-600 shadow-xs',
    },
  ];

  return (
    <div 
      id="desktop-ribbon-nav"
      className="bg-slate-900 border-b border-slate-800 text-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-1 select-none overflow-x-auto"
    >
      {/* Ribbon Navigation Buttons */}
      <div className="flex items-center gap-1.5 flex-nowrap min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-sm border text-left transition-all cursor-pointer ${
                isActive
                  ? item.activeColor
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded ${isActive ? 'bg-black/20' : 'bg-slate-900/60 text-slate-400 group-hover:text-slate-200'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs leading-tight whitespace-nowrap">
                    {item.label}
                  </span>
                  <kbd className={`text-[9px] px-1 py-0.2 rounded font-mono font-medium ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400'
                  }`}>
                    {item.hotkey}
                  </kbd>
                </div>
                <span className={`text-[10px] leading-none whitespace-nowrap ${
                  isActive ? 'text-white/80' : 'text-slate-400'
                }`}>
                  {item.sublabel}
                </span>
              </div>

              {item.badge && (
                <span
                  className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                    item.badgeType === 'danger'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : item.badgeType === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Status Tag / System Health */}
      <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400 pl-2">
        <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded">
          <span className="text-[11px] text-slate-300">Engine:</span>
          <span className="text-emerald-400 font-mono font-semibold text-[11px]">SQL-Lite Local Sync</span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-300">Scanner:</span>
          <span className="text-cyan-400 font-semibold text-[11px]">USB/Laser Ready</span>
        </div>
      </div>
    </div>
  );
};
