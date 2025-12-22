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
  notes?: string;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
  order?: ProductionOrder;
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
