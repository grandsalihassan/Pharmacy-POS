import { MedicineItem, Batch, ExpiryStatus, StockStatus } from '../types';

export const CURRENCY_SYMBOL = 'Rs.';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  // reset time
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 60) return 'expiring_soon';
  return 'normal';
}

export function getStockStatus(currentStock: number, minStock: number): StockStatus {
  if (currentStock <= 0) return 'out_of_stock';
  if (currentStock <= minStock) return 'low_stock';
  return 'in_stock';
}

export function getTotalMedicineStock(item: MedicineItem): number {
  return item.batches.reduce((sum, b) => sum + b.stockQty, 0);
}

export function getEffectiveBatch(item: MedicineItem): Batch | null {
  // Return earliest valid non-expired batch, or first batch with stock
  if (!item.batches || item.batches.length === 0) return null;
  const inStockBatches = item.batches.filter(b => b.stockQty > 0);
  if (inStockBatches.length === 0) return item.batches[0];

  // sort by expiry ascending (FIFO - First Expire First Out)
  return [...inStockBatches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
}

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${rand}`;
}
