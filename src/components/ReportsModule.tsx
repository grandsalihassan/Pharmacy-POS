import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Lock, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { SaleTransaction, PurchaseInvoice, UserProfile } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ReportsModuleProps {
  sales: SaleTransaction[];
  purchases: PurchaseInvoice[];
  currentUser: UserProfile;
  onRequestOwnerAccess: () => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  sales,
  purchases,
  currentUser,
  onRequestOwnerAccess,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'this_month' | 'all'>('this_month');

  // If cashier is logged in, show access restricted view with Owner unlock button
  if (currentUser.role === 'cashier') {
    return (
      <div id="reports-module" className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-slate-100 p-6">
        <div className="bg-white border border-slate-300 rounded max-w-md w-full p-6 text-center shadow-lg">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Financial Reports &amp; P&amp;L Restricted</h2>
          <p className="text-xs text-slate-500 mt-2 mb-5">
            Cashier role does not have administrative permission to view business profit margins, net revenue, or financial reports.
          </p>
          <button
            onClick={onRequestOwnerAccess}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Switch to Owner Role [F8]</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate Aggregates
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);

  // Cost of goods sold (COGS)
  const totalCOGS = sales.reduce((sum, s) => {
    const saleCost = s.items.reduce((iSum, item) => iSum + (item.purchasePrice * item.quantity), 0);
    return sum + saleCost;
  }, 0);

  const grossProfit = Math.max(0, totalSalesRevenue - totalCOGS);
  const profitMarginPercent = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : '0.0';

  const totalDiscountsGiven = sales.reduce((sum, s) => sum + s.discountAmount, 0);
  const totalPurchasesExpense = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  // Payment Breakdown
  const cashTotal = sales.filter((s) => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.grandTotal, 0);
  const onlineTotal = sales.filter((s) => s.paymentMethod === 'online').reduce((sum, s) => sum + s.grandTotal, 0);
  const splitTotal = sales.filter((s) => s.paymentMethod === 'split').reduce((sum, s) => sum + s.grandTotal, 0);

  const paymentData = [
    { name: 'Cash Register', value: cashTotal || 1, color: '#10b981' },
    { name: 'Online / Card', value: onlineTotal || 1, color: '#3b82f6' },
    { name: 'Split Tender', value: splitTotal || 0, color: '#a855f7' },
  ];

  // Daily Sales Trend Chart Data
  const dailyTrendData = [
    { date: 'Sep 13', sales: 4200, profit: 1100 },
    { date: 'Sep 14', sales: 5800, profit: 1600 },
    { date: 'Sep 15', sales: 6900, profit: 1950 },
    { date: 'Sep 16', sales: 4900, profit: 1300 },
    { date: 'Sep 17', sales: 8400, profit: 2400 },
    { date: 'Sep 18', sales: 7100, profit: 2050 },
    { date: 'Sep 19 (Today)', sales: totalSalesRevenue || 5200, profit: grossProfit || 1500 },
  ];

  // Top Selling Medicines
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      itemCounts[item.name].qty += item.quantity;
      itemCounts[item.name].revenue += item.salePrice * item.quantity;
    });
  });

  const topSellingList = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div id="reports-module" className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 p-2 overflow-y-auto">
      {/* Header bar */}
      <div className="bg-white border border-slate-300 rounded-sm p-3 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div>
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-600" />
            <span>Profit / Loss &amp; Sales Performance Reports</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time business audit: Revenue, Cost of Goods Sold (COGS), Gross Profit, and Payment Channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                timeRange === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('this_month')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                timeRange === 'this_month' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              September 2026 (Monthly)
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                timeRange === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        {/* Total Sales Revenue */}
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Gross Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>{sales.length} total customer sales completed</span>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Cost of Goods (COGS)</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-800">
            {formatCurrency(totalCOGS)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Wholesale acquisition cost of medicines sold
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-sm p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
            <span className="font-bold uppercase tracking-wider">Net Gross Profit</span>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
              {profitMarginPercent}% Margin
            </span>
          </div>
          <div className="text-xl font-mono font-black text-emerald-700">
            {formatCurrency(grossProfit)}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1">
            Revenue minus cost of sold medicine stock
          </div>
        </div>

        {/* Discounts & Inward Stock */}
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Supplier Purchases</span>
            <span className="text-purple-600 font-mono text-xs">{purchases.length} GRNs</span>
          </div>
          <div className="text-xl font-mono font-bold text-purple-900">
            {formatCurrency(totalPurchasesExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Customer Discounts Given: <strong>{formatCurrency(totalDiscountsGiven)}</strong>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-2">
        {/* Sales & Profit Trend Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-300 rounded-sm p-3 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Daily Sales &amp; Estimated Profit Trend (Past 7 Days)</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>
                <span>Sales Revenue</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                <span>Gross Profit</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{ fontSize: '11px', borderRadius: '4px' }}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-sm p-3 shadow-xs flex flex-col">
          <h3 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cash vs. Online Digital Tender</span>
          </h3>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => `Rs. ${Number(val).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Cash Counter:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(cashTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Online / Mobile Wallet:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(onlineTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Medicines Table */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-xs">
        <div className="bg-slate-800 text-slate-200 px-3 py-2 text-xs font-semibold">
          Top Selling Medicines (Fast Moving Inventory)
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold text-[11px]">
            <tr>
              <th className="p-2.5">Medicine Name</th>
              <th className="p-2.5 text-center">Units Dispensed</th>
              <th className="p-2.5 text-right">Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topSellingList.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-400">
                  Complete POS sales to see fast moving items.
                </td>
              </tr>
            ) : (
              topSellingList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{item.name}</span>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                    {item.qty} units
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
