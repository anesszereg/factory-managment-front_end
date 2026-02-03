import axios from 'axios';
import type { 
  FurnitureModel, 
  ProductionOrder, 
  DailyProduction, 
  RawMaterial, 
  MaterialPurchase, 
  MaterialConsumption, 
  DailyExpense,
  Income,
  DashboardStats, 
  ProductionStatus, 
  ProductionStep, 
  MaterialUnit, 
  ExpenseCategory,
  Employee,
  SalaryAllowance,
  EmployeeStatus,
  PieceWorker,
  PieceWorkerStatus,
  DailyPieceReceipt,
  Supplier,
  SupplierStatus,
  SupplierOrder,
  SupplierOrderStatus,
  SupplierPayment,
  SupplierSummary
} from '../types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const furnitureModelsApi = {
  getAll: () => api.get<FurnitureModel[]>('/furniture-models'),
  getById: (id: number) => api.get<FurnitureModel>(`/furniture-models/${id}`),
  create: (data: { name: string; description?: string; size: string }) => 
    api.post<FurnitureModel>('/furniture-models', data),
  update: (id: number, data: { name?: string; description?: string; size?: string }) => 
    api.put<FurnitureModel>(`/furniture-models/${id}`, data),
  delete: (id: number) => api.delete(`/furniture-models/${id}`),
};

export const productionOrdersApi = {
  getAll: (filters?: { status?: ProductionStatus; modelId?: number }) => 
    api.get<ProductionOrder[]>('/production-orders', { params: filters }),
  getById: (id: number) => api.get<ProductionOrder>(`/production-orders/${id}`),
  create: (data: { modelId: number; quantity: number; startDate: string }) => 
    api.post<ProductionOrder>('/production-orders', data),
  update: (id: number, data: { quantity?: number; startDate?: string; status?: ProductionStatus }) => 
    api.put<ProductionOrder>(`/production-orders/${id}`, data),
  updateStatus: (id: number, status: ProductionStatus) => 
    api.patch<ProductionOrder>(`/production-orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/production-orders/${id}`),
  getProgress: (id: number) => api.get(`/production-orders/${id}/progress`),
};

export const dailyProductionApi = {
  getAll: (filters?: { 
    orderId?: number; 
    step?: ProductionStep; 
    date?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<DailyProduction[]>('/daily-production', { params: filters }),
  getById: (id: number) => api.get<DailyProduction>(`/daily-production/${id}`),
  create: (data: {
    orderId: number;
    step: ProductionStep;
    date: string;
    quantityEntered: number;
    quantityCompleted: number;
    quantityLost?: number;
    notes?: string;
  }) => api.post<DailyProduction>('/daily-production', data),
  update: (id: number, data: {
    quantityEntered?: number;
    quantityCompleted?: number;
    quantityLost?: number;
    notes?: string;
  }) => api.put<DailyProduction>(`/daily-production/${id}`, data),
  delete: (id: number) => api.delete(`/daily-production/${id}`),
  getByStep: (date?: string) => 
    api.get('/daily-production/by-step', { params: { date } }),
  getFinishedProducts: (date?: string) => 
    api.get<DailyProduction[]>('/daily-production/finished', { params: { date } }),
};

export const rawMaterialsApi = {
  getAll: () => api.get<RawMaterial[]>('/raw-materials'),
  getById: (id: number) => api.get<RawMaterial>(`/raw-materials/${id}`),
  create: (data: {
    name: string;
    unit: MaterialUnit;
    currentStock?: number;
    minStockAlert?: number;
  }) => api.post<RawMaterial>('/raw-materials', data),
  update: (id: number, data: {
    name?: string;
    unit?: MaterialUnit;
    currentStock?: number;
    minStockAlert?: number;
  }) => api.put<RawMaterial>(`/raw-materials/${id}`, data),
  delete: (id: number) => api.delete(`/raw-materials/${id}`),
  getLowStock: () => api.get<RawMaterial[]>('/raw-materials/low-stock'),
};

export const materialPurchasesApi = {
  getAll: (filters?: { materialId?: number; startDate?: string; endDate?: string }) => 
    api.get<MaterialPurchase[]>('/material-purchases', { params: filters }),
  getById: (id: number) => api.get<MaterialPurchase>(`/material-purchases/${id}`),
  create: (data: {
    materialId: number;
    date: string;
    supplier: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }) => api.post<MaterialPurchase>('/material-purchases', data),
  update: (id: number, data: {
    supplier?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }) => api.put<MaterialPurchase>(`/material-purchases/${id}`, data),
  delete: (id: number) => api.delete(`/material-purchases/${id}`),
};

export const materialConsumptionApi = {
  getAll: (filters?: { 
    materialId?: number; 
    orderId?: number;
    employeeId?: number;
    pieceWorkerId?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get<MaterialConsumption[]>('/material-consumption', { params: filters }),
  getById: (id: number) => api.get<MaterialConsumption>(`/material-consumption/${id}`),
  create: (data: {
    materialId: number;
    date: string;
    quantity: number;
    orderId?: number;
    step?: ProductionStep;
    employeeId?: number;
    pieceWorkerId?: number;
    notes?: string;
  }) => api.post<MaterialConsumption>('/material-consumption', data),
  update: (id: number, data: {
    quantity?: number;
    employeeId?: number;
    pieceWorkerId?: number;
    notes?: string;
  }) => api.put<MaterialConsumption>(`/material-consumption/${id}`, data),
  delete: (id: number) => api.delete(`/material-consumption/${id}`),
};

export const dailyExpensesApi = {
  getAll: (filters?: { 
    category?: ExpenseCategory;
    startDate?: string;
    endDate?: string;
  }) => api.get<DailyExpense[]>('/daily-expenses', { params: filters }),
  getById: (id: number) => api.get<DailyExpense>(`/daily-expenses/${id}`),
  create: (data: {
    date?: string;
    category: ExpenseCategory;
    amount: number;
    paymentMethod?: string;
    description?: string;
  }) => api.post<DailyExpense>('/daily-expenses', data),
  update: (id: number, data: {
    date?: string;
    category?: ExpenseCategory;
    amount?: number;
    paymentMethod?: string;
    description?: string;
  }) => api.put<DailyExpense>(`/daily-expenses/${id}`, data),
  delete: (id: number) => api.delete(`/daily-expenses/${id}`),
  getSummary: (startDate?: string, endDate?: string) => 
    api.get('/daily-expenses/summary', { params: { startDate, endDate } }),
};

export const incomesApi = {
  getAll: (filters?: { 
    source?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<Income[]>('/incomes', { params: filters }),
  getById: (id: number) => api.get<Income>(`/incomes/${id}`),
  create: (data: {
    date?: string;
    source: string;
    amount: number;
    paymentMethod?: string;
    description?: string;
  }) => api.post<Income>('/incomes', data),
  update: (id: number, data: {
    date?: string;
    source?: string;
    amount?: number;
    paymentMethod?: string;
    description?: string;
  }) => api.put<Income>(`/incomes/${id}`, data),
  delete: (id: number) => api.delete(`/incomes/${id}`),
  getSummary: (startDate?: string, endDate?: string) => 
    api.get('/incomes/summary', { params: { startDate, endDate } }),
};

export const dashboardApi = {
  getStats: (date?: string) => 
    api.get<DashboardStats>('/dashboard/stats', { params: { date } }),
};

export const employeesApi = {
  getAll: (filters?: { 
    status?: EmployeeStatus;
  }) => api.get<Employee[]>('/employees', { params: filters }),
  getById: (id: number) => api.get<Employee>(`/employees/${id}`),
  create: (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    hireDate: string;
    monthlySalary: number;
    status?: EmployeeStatus;
  }) => api.post<Employee>('/employees', data),
  update: (id: number, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    hireDate?: string;
    monthlySalary?: number;
    status?: EmployeeStatus;
  }) => api.put<Employee>(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  getSalaryInfo: (id: number, month?: string) => 
    api.get(`/employees/${id}/salary-info`, { params: { month } }),
  getSalarySummary: (month?: string) => 
    api.get('/employees/salary-summary', { params: { month } }),
};

export const salaryAllowancesApi = {
  getAll: (filters?: { 
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get<SalaryAllowance[]>('/salary-allowances', { params: filters }),
  getById: (id: number) => api.get<SalaryAllowance>(`/salary-allowances/${id}`),
  create: (data: {
    employeeId: number;
    date?: string;
    amount: number;
    description?: string;
  }) => api.post<SalaryAllowance>('/salary-allowances', data),
  update: (id: number, data: {
    date?: string;
    amount?: number;
    description?: string;
  }) => api.put<SalaryAllowance>(`/salary-allowances/${id}`, data),
  delete: (id: number) => api.delete(`/salary-allowances/${id}`),
  getSummary: (startDate?: string, endDate?: string) => 
    api.get('/salary-allowances/summary', { params: { startDate, endDate } }),
};

export const pieceWorkersApi = {
  getAll: (filters?: { 
    status?: PieceWorkerStatus;
  }) => api.get<PieceWorker[]>('/piece-workers', { params: filters }),
  getById: (id: number) => api.get<PieceWorker>(`/piece-workers/${id}`),
  create: (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    pricePerPiece: number;
    status?: PieceWorkerStatus;
  }) => api.post<PieceWorker>('/piece-workers', data),
  update: (id: number, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    pricePerPiece?: number;
    status?: PieceWorkerStatus;
  }) => api.put<PieceWorker>(`/piece-workers/${id}`, data),
  delete: (id: number) => api.delete(`/piece-workers/${id}`),
};

export const dailyPieceReceiptsApi = {
  getAll: (filters?: { 
    pieceWorkerId?: number;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<DailyPieceReceipt[]>('/daily-piece-receipts', { params: filters }),
  getById: (id: number) => api.get<DailyPieceReceipt>(`/daily-piece-receipts/${id}`),
  create: (data: {
    pieceWorkerId: number;
    date: string;
    items: { itemName: string; quantity: number; pricePerPiece: number }[];
    paidAmount?: number;
    notes?: string;
  }) => api.post<DailyPieceReceipt>('/daily-piece-receipts', data),
  update: (id: number, data: {
    date?: string;
    items?: { itemName: string; quantity: number; pricePerPiece: number }[];
    paidAmount?: number;
    notes?: string;
  }) => api.put<DailyPieceReceipt>(`/daily-piece-receipts/${id}`, data),
  addPayment: (id: number, amount: number) => 
    api.post<DailyPieceReceipt>(`/daily-piece-receipts/${id}/payment`, { amount }),
  delete: (id: number) => api.delete(`/daily-piece-receipts/${id}`),
  getSummary: (pieceWorkerId?: number, startDate?: string, endDate?: string) => 
    api.get('/daily-piece-receipts/summary', { params: { pieceWorkerId, startDate, endDate } }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (filters?: { status?: SupplierStatus }) => 
    api.get<Supplier[]>('/suppliers', { params: filters }),
  getById: (id: number) => api.get<Supplier>(`/suppliers/${id}`),
  getSummary: (id: number) => api.get<SupplierSummary>(`/suppliers/${id}/summary`),
  create: (data: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
    status?: SupplierStatus;
  }) => api.post<Supplier>('/suppliers', data),
  update: (id: number, data: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
    status?: SupplierStatus;
  }) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

export const supplierOrdersApi = {
  getAll: (filters?: {
    supplierId?: number;
    status?: SupplierOrderStatus;
    startDate?: string;
    endDate?: string;
  }) => api.get<SupplierOrder[]>('/suppliers/orders/all', { params: filters }),
  getById: (id: number) => api.get<SupplierOrder>(`/suppliers/orders/${id}`),
  create: (data: {
    supplierId: number;
    orderDate: string;
    notes?: string;
    items: {
      materialId?: number;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) => api.post<SupplierOrder>('/suppliers/orders', data),
  update: (id: number, data: {
    orderDate?: string;
    notes?: string;
    status?: SupplierOrderStatus;
  }) => api.put<SupplierOrder>(`/suppliers/orders/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/orders/${id}`),
  addPayment: (orderId: number, data: {
    date: string;
    amount: number;
    paymentMethod?: string;
    notes?: string;
    createExpense?: boolean;
  }) => api.post<SupplierPayment>(`/suppliers/orders/${orderId}/payments`, data),
  deletePayment: (paymentId: number) => api.delete(`/suppliers/payments/${paymentId}`),
};

export default api;
