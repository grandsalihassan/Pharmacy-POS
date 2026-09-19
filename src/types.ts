export type UserRole = 'owner' | 'cashier';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar: string;
  terminalAccess: string;
}

export type ExpiryStatus = 'normal' | 'expiring_soon' | 'expired';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Batch {
  id: string;
  batchNo: string;
  expiryDate: string; // YYYY-MM-DD
  purchasePrice: number;
  salePrice: number;
  stockQty: number;
  minStockAlert: number;
}

export interface MedicineItem {
  id: string;
  barcode: string;
  name: string;
  genericName: string;
  company: string;
  category: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Surgical';
  unit: 'Box' | 'Strip' | 'Bottle' | 'Pcs';
  rackLocation: string;
  batches: Batch[];
}

export interface CartItem {
  medicineId: string;
  batchId: string;
  name: string;
  genericName: string;
  company: string;
  batchNo: string;
  expiryDate: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  discountPercent: number;
  maxStock: number;
}

export type PaymentMethod = 'cash' | 'online' | 'split';
export type OnlineProvider = 'Card' | 'Bank Transfer' | 'EasyPaisa' | 'JazzCash' | 'UPI' | 'Other';

export interface SaleTransaction {
  id: string;
  invoiceNo: string;
  timestamp: string; // ISO string
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  onlineReceived: number;
  onlineProvider?: OnlineProvider;
  cashierName: string;
  cashierId: string;
  status: 'completed' | 'returned' | 'partial_return';
  notes?: string;
}

export interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  company: string;
  batchNo: string;
  expiryDate: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
}

export interface ReturnItem {
  medicineId: string;
  batchId: string;
  name: string;
  batchNo: string;
  quantity: number;
  refundPrice: number;
  totalRefund: number;
}

export interface ReturnRecord {
  id: string;
  returnNo: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  items: ReturnItem[];
  totalRefund: number;
  reason: string;
  processedBy: string;
}

export interface AccountParty {
  id: string;
  type: 'customer' | 'supplier';
  name: string;
  phone: string;
  companyOrAddress: string;
  balance: number; // positive: receivable for customer, payable for supplier
  totalTransactions: number;
  lastTransactionDate: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  date: string;
  description: string;
  referenceNo: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ConnectedDevice {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet';
  location: string;
  user: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}
