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

export interface FurnitureModel {
  id: number;
  name: string;
  description?: string;
  size: FurnitureSize;
  createdAt: string;
  updatedAt: string;
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

export interface DailyProduction {
  id: number;
  orderId: number;
  step: ProductionStep;
  date: string;
  quantityEntered: number;
  quantityCompleted: number;
  quantityLost: number;
  notes?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPurchase {
  id: number;
  materialId: number;
  date: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
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
  date: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
  date: string;
  source: IncomeSource;
  amount: number;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
  date: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  pieceWorker?: PieceWorker;
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
