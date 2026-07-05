export enum ProductionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

export enum ProductionStep {
  CUTTING = 'CUTTING',
  MONTAGE = 'MONTAGE',
  FINITION = 'FINITION',
  PAINT = 'PAINT',
  PACKAGING = 'PACKAGING'
}

export enum MaterialUnit {
  KG = 'KG',
  LITER = 'LITER',
  PIECE = 'PIECE'
}

export enum ExpenseCategory {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  TRANSPORT = 'TRANSPORT',
  SALARIES = 'SALARIES',
  MAINTENANCE = 'MAINTENANCE',
  OTHER = 'OTHER'
}

export enum FurnitureSize {
  SIZE_45CM = 'SIZE_45CM',
  SIZE_60CM = 'SIZE_60CM',
  SIZE_80CM = 'SIZE_80CM',
  SIZE_100CM = 'SIZE_100CM',
  SIZE_120CM = 'SIZE_120CM'
}

export interface ModelMaterialRequirement {
  id: number;
  modelId: number;
  step: ProductionStep;
  materialId: number;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
}

export interface FurnitureModel {
  id: number;
  name: string;
  description?: string;
  size: FurnitureSize;
  createdAt: string;
  updatedAt: string;
  materialRequirements?: ModelMaterialRequirement[];
}

export interface ProductionOrder {
  id: number;
  modelId: number;
  quantity: number;
  startDate: string;
  status: ProductionStatus;
  createdAt: string;
  updatedAt: string;
  model?: FurnitureModel;
}

export interface ProductionColorSplit {
  id: number;
  dailyProductionId: number;
  color: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyProduction {
  id: number;
  orderId: number;
  step: ProductionStep;
  date: string;
  quantityEntered: number;
  quantityCompleted: number;
  quantityLost: number;
  notes?: string;
  colorSplits?: ProductionColorSplit[];
  createdAt: string;
  updatedAt: string;
  order?: ProductionOrder;
}

export interface RawMaterial {
  id: number;
  name: string;
  unit: MaterialUnit;
  currentStock: number;
  minStockAlert: number;
  purchasePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPurchase {
  id: number;
  materialId: number;
  date: string;
  supplierId?: number;
  supplierName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
  supplier?: Supplier;
}

export interface MaterialConsumption {
  id: number;
  materialId: number;
  date: string;
  quantity: number;
  orderId?: number;
  step?: ProductionStep;
  employeeId?: number;
  pieceWorkerId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
  order?: ProductionOrder;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  pieceWorker?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface DailyExpense {
  id: number;
  moneyBoxId?: number;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  moneyBox?: { id: number; name: string };
}

export enum IncomeSource {
  PRODUCT_SALES = 'PRODUCT_SALES',
  SERVICE_REVENUE = 'SERVICE_REVENUE',
  CUSTOM_ORDERS = 'CUSTOM_ORDERS',
  REPAIRS = 'REPAIRS',
  CONSULTING = 'CONSULTING',
  OTHER = 'OTHER'
}

export interface Income {
  id: number;
  moneyBoxId?: number;
  date: string;
  source: IncomeSource;
  amount: number;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  moneyBox?: { id: number; name: string };
}

export interface DashboardStats {
  date: string;
  production: {
    byStep: {
      [key in ProductionStep]: {
        quantityEntered: number;
        quantityCompleted: number;
        items: DailyProduction[];
      };
    };
    finishedToday: number;
    finishedProducts: DailyProduction[];
  };
  materials: {
    lowStockCount: number;
    lowStockItems: RawMaterial[];
  };
  expenses: {
    today: number;
    thisMonth: number;
  };
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE'
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  hireDate: string;
  monthlySalary: number;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  salaryAllowances?: SalaryAllowance[];
}

export interface SalaryCycle {
  start: string;
  end: string;
}

export interface SalaryAllowance {
  id: number;
  employeeId: number;
  date: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    monthlySalary: number;
  };
}

export interface EmployeeSalaryInfo {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    monthlySalary: number;
  };
  salaryCycle: SalaryCycle;
  totalAllowances: number;
  remainingSalary: number;
  allowances: SalaryAllowance[];
}

export enum PieceWorkerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface PieceWorker {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  pricePerPiece: number;
  status: PieceWorkerStatus;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  NOT_PAID = 'NOT_PAID',
  PART_PAID = 'PART_PAID',
  PAID = 'PAID'
}

export interface ReceiptItem {
  id: number;
  receiptId: number;
  itemName: string;
  quantity: number;
  pricePerPiece: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPieceReceipt {
  id: number;
  pieceWorkerId: number;
  expenseId?: number;
  date: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  pieceWorker?: PieceWorker;
  expense?: DailyExpense;
  items?: ReceiptItem[];
}

// Suppliers
export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SupplierOrderStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: SupplierStatus;
  openingCredit?: number;
  openingDebt?: number;
  openingBalanceDate?: string;
  createdAt: string;
  updatedAt: string;
  orders?: SupplierOrder[];
}

export interface SupplierOrder {
  id: number;
  supplierId: number;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  status: SupplierOrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items?: SupplierOrderItem[];
  payments?: SupplierPayment[];
}

export interface SupplierOrderItem {
  id: number;
  orderId: number;
  materialId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
}

export interface SupplierPayment {
  id: number;
  orderId: number;
  expenseId?: number;
  date: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  expense?: DailyExpense;
}

export interface SupplierSummary {
  supplier: Supplier;
  totalOrders: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  pendingOrders: number;
  partialOrders: number;
  completedOrders: number;
}

// ===================== MONEY BOX =====================
export enum MoneyBoxStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionCategory {
  CLIENT_PAYMENT = 'CLIENT_PAYMENT',
  SALE = 'SALE',
  MANUAL_INCOME = 'MANUAL_INCOME',
  OTHER_INCOME = 'OTHER_INCOME',
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
  PIECE_WORKER_PAYMENT = 'PIECE_WORKER_PAYMENT',
  EMPLOYEE_SALARY = 'EMPLOYEE_SALARY',
  UTILITY_BILL = 'UTILITY_BILL',
  RENT = 'RENT',
  TRANSPORTATION = 'TRANSPORTATION',
  MATERIAL_EXPENSE = 'MATERIAL_EXPENSE',
  MAINTENANCE = 'MAINTENANCE',
  MISCELLANEOUS = 'MISCELLANEOUS',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  CASH_DEPOSIT = 'CASH_DEPOSIT',
  CASH_WITHDRAWAL = 'CASH_WITHDRAWAL',
  OPENING_BALANCE = 'OPENING_BALANCE',
}

export interface MoneyBox {
  id: number;
  name: string;
  description?: string;
  currentBalance: number;
  status: MoneyBoxStatus;
  responsibleUser?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
}

export interface FinancialTransaction {
  id: number;
  moneyBoxId: number;
  date: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description?: string;
  reference?: string;
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
  updatedAt: string;
  moneyBox?: { id: number; name: string };
}

export interface DailyCashSummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactions: FinancialTransaction[];
}

// ===================== SUPPLIER LEDGER =====================
export enum SupplierTransactionType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  PURCHASE = 'PURCHASE',
  PAYMENT = 'PAYMENT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export interface SupplierTransaction {
  id: number;
  supplierId: number;
  date: string;
  type: SupplierTransactionType;
  amount: number;
  balance: number;
  description?: string;
  referenceId?: number;
  referenceType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFinancialSummary {
  totalPurchases: number;
  totalPayments: number;
  balance: number;
  remainingDebt: number;
}

// ===================== CLIENT =====================
export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ClientTransactionType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  SALE = 'SALE',
  PAYMENT = 'PAYMENT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit: number;
  outstandingBalance: number;
  notes?: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { sales: number };
}

export interface ClientTransaction {
  id: number;
  clientId: number;
  date: string;
  type: ClientTransactionType;
  amount: number;
  balance: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ===================== SALES =====================
export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHECK = 'CHECK',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT',
  OTHER = 'OTHER',
}

export interface SalesOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: FinishedProductInventory;
}

export interface SalePayment {
  id: number;
  orderId: number;
  clientId: number;
  moneyBoxId: number;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  moneyBox?: { id: number; name: string };
}

export interface SalesOrder {
  id: number;
  clientId: number;
  salesperson?: string;
  orderDate: string;
  status: SalesOrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  items?: SalesOrderItem[];
  payments?: SalePayment[];
}

// ===================== WAREHOUSE / INVENTORY =====================
export interface Warehouse {
  id: number;
  name: string;
  code?: string;
  address?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { inventoryItems: number };
}

export enum InventoryMovementType {
  PRODUCTION_IN = 'PRODUCTION_IN',
  SALE_OUT = 'SALE_OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN_IN = 'RETURN_IN',
  RETURN_OUT = 'RETURN_OUT',
}

export interface InventoryMovement {
  id: number;
  productId: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  type: InventoryMovementType;
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinishedProductInventory {
  id: number;
  modelId: number;
  warehouseId: number;
  sku: string;
  quantity: number;
  productionCost: number;
  batchNumber?: string;
  productionDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  model?: FurnitureModel;
  warehouse?: Warehouse;
  movements?: InventoryMovement[];
}
