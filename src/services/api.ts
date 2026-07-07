import axios from 'axios';
import type { 
  FurnitureModel, 
  ProductionOrder, 
  ProductionOrderWorker,
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
  SupplierSummary,
  MoneyBox,
  FinancialTransaction,
  DailyCashSummary,
  Client,
  ClientTransaction,
  SalesOrder,
  Warehouse,
  FinishedProductInventory,
  SupplierTransaction,
  SupplierFinancialSummary,
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
  create: (data: {
    name: string;
    description?: string;
    size: string;
    materialRequirements?: { step: string; materialId: number; quantity: number; price?: number }[];
  }) => api.post<FurnitureModel>('/furniture-models', data),
  update: (id: number, data: {
    name?: string;
    description?: string;
    size?: string;
    materialRequirements?: { step: string; materialId: number; quantity: number; price?: number }[];
  }) => api.put<FurnitureModel>(`/furniture-models/${id}`, data),
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

export const productionOrderWorkersApi = {
  getByOrderId: (orderId: number) =>
    api.get<ProductionOrderWorker[]>(`/production-order-workers/order/${orderId}`),
  create: (data: {
    orderId: number;
    employeeId?: number;
    pieceWorkerId?: number;
    cost?: number;
    notes?: string;
  }) => api.post<ProductionOrderWorker>('/production-order-workers', data),
  update: (id: number, data: {
    employeeId?: number;
    pieceWorkerId?: number;
    cost?: number;
    notes?: string;
  }) => api.put<ProductionOrderWorker>(`/production-order-workers/${id}`, data),
  delete: (id: number) => api.delete(`/production-order-workers/${id}`),
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
    colorSplits?: { color: string; quantity: number }[];
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
    purchasePrice?: number;
  }) => api.post<RawMaterial>('/raw-materials', data),
  update: (id: number, data: {
    name?: string;
    unit?: MaterialUnit;
    currentStock?: number;
    minStockAlert?: number;
    purchasePrice?: number;
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
    supplierId?: number;
    supplierName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }) => api.post<MaterialPurchase>('/material-purchases', data),
  update: (id: number, data: {
    supplierId?: number;
    supplierName?: string;
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
    moneyBoxId?: number;
    paymentMethod?: string;
    description?: string;
  }) => api.post<DailyExpense>('/daily-expenses', data),
  update: (id: number, data: {
    date?: string;
    category?: ExpenseCategory;
    amount?: number;
    moneyBoxId?: number;
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
    moneyBoxId?: number;
    paymentMethod?: string;
    description?: string;
  }) => api.post<Income>('/incomes', data),
  update: (id: number, data: {
    date?: string;
    source?: string;
    amount?: number;
    moneyBoxId?: number;
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
    moneyBoxId?: number;
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
    createExpense?: boolean;
    moneyBoxId?: number;
  }) => api.post<DailyPieceReceipt>('/daily-piece-receipts', data),
  update: (id: number, data: {
    date?: string;
    items?: { itemName: string; quantity: number; pricePerPiece: number }[];
    paidAmount?: number;
    notes?: string;
    createExpense?: boolean;
    moneyBoxId?: number;
  }) => api.put<DailyPieceReceipt>(`/daily-piece-receipts/${id}`, data),
  addPayment: (id: number, amount: number, createExpense?: boolean, moneyBoxId?: number) => 
    api.post<DailyPieceReceipt>(`/daily-piece-receipts/${id}/payment`, { amount, createExpense, moneyBoxId }),
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
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
    status?: SupplierStatus;
  }) => api.post<Supplier>('/suppliers', data),
  update: (id: number, data: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
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

export const ocrApi = {
  scanImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ text: string }>('/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const moneyBoxApi = {
  getAll: () => api.get<MoneyBox[]>('/money-boxes'),
  getById: (id: number) => api.get<MoneyBox>(`/money-boxes/${id}`),
  create: (data: { name: string; description?: string; currentBalance?: number; responsibleUser?: string }) =>
    api.post<MoneyBox>('/money-boxes', data),
  update: (id: number, data: Partial<MoneyBox>) => api.put<MoneyBox>(`/money-boxes/${id}`, data),
  delete: (id: number) => api.delete(`/money-boxes/${id}`),
  transfer: (data: { fromId: number; toId: number; amount: number; description?: string }) =>
    api.post('/money-boxes/transfer', data),
};

export const financialTransactionApi = {
  getAll: (params?: { moneyBoxId?: number; type?: string; category?: string; startDate?: string; endDate?: string }) =>
    api.get<FinancialTransaction[]>('/financial-transactions', { params }),
  getById: (id: number) => api.get<FinancialTransaction>(`/financial-transactions/${id}`),
  create: (data: { moneyBoxId: number; date: string; amount: number; type: string; category: string; description?: string; reference?: string }) =>
    api.post<FinancialTransaction>('/financial-transactions', data),
  update: (id: number, data: { date?: string; amount?: number; type?: string; category?: string; description?: string; reference?: string }) =>
    api.put<FinancialTransaction>(`/financial-transactions/${id}`, data),
  delete: (id: number) => api.delete(`/financial-transactions/${id}`),
  getDailySummary: (date?: string) => api.get<DailyCashSummary>('/financial-transactions/daily-summary', { params: { date } }),
  getMonthlyReport: (year: number, month: number) =>
    api.get<FinancialTransaction[]>('/financial-transactions/monthly-report', { params: { year, month } }),
};

export const clientApi = {
  getAll: (params?: { status?: string }) => api.get<Client[]>('/clients', { params }),
  getById: (id: number) => api.get<Client>(`/clients/${id}`),
  create: (data: {
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
    notes?: string;
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
  }) => api.post<Client>('/clients', data),
  update: (id: number, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  delete: (id: number) => api.delete(`/clients/${id}`),
  getLedger: (id: number) => api.get<ClientTransaction[]>(`/clients/${id}/ledger`),
  recordPayment: (id: number, data: { moneyBoxId: number; orderId?: number; date: string; amount: number; paymentMethod: string; reference?: string; notes?: string }) =>
    api.post(`/clients/${id}/payments`, data),
  updatePayment: (clientId: number, paymentId: number, data: { amount?: number; date?: string; paymentMethod?: string; reference?: string; notes?: string }) =>
    api.put(`/clients/${clientId}/payments/${paymentId}`, data),
  deletePayment: (clientId: number, paymentId: number) =>
    api.delete(`/clients/${clientId}/payments/${paymentId}`),
};

export const salesApi = {
  getAll: (params?: { clientId?: number; status?: string }) => api.get<SalesOrder[]>('/sales', { params }),
  getById: (id: number) => api.get<SalesOrder>(`/sales/${id}`),
  create: (data: { clientId: number; salesperson?: string; orderDate: string; discount?: number; tax?: number; notes?: string; items: { productId: number; quantity: number; unitPrice: number; discount?: number }[] }) =>
    api.post<SalesOrder>('/sales', data),
  confirm: (id: number) => api.post<SalesOrder>(`/sales/${id}/confirm`, {}),
  update: (id: number, data: { status?: string; notes?: string; salesperson?: string }) =>
    api.put<SalesOrder>(`/sales/${id}`, data),
  delete: (id: number) => api.delete(`/sales/${id}`),
  recordPayment: (id: number, data: { moneyBoxId: number; date: string; amount: number; paymentMethod: string; reference?: string; notes?: string }) =>
    api.post(`/sales/${id}/payments`, data),
};

export const warehouseApi = {
  getAll: () => api.get<Warehouse[]>('/warehouses'),
  getById: (id: number) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: { name: string; code?: string; address?: string; description?: string }) =>
    api.post<Warehouse>('/warehouses', data),
  update: (id: number, data: Partial<Warehouse>) => api.put<Warehouse>(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
  getAllInventory: (warehouseId?: number) => api.get<FinishedProductInventory[]>('/warehouses/inventory', { params: { warehouseId } }),
  getInventoryById: (id: number) => api.get<FinishedProductInventory>(`/warehouses/inventory/${id}`),
  addInventory: (data: { modelId: number; warehouseId: number; sku: string; color?: string; quantity: number; productionCost?: number; batchNumber?: string; productionDate?: string }) =>
    api.post<FinishedProductInventory>('/warehouses/inventory', data),
  updateInventory: (id: number, data: { productionCost?: number; color?: string; sku?: string }) =>
    api.put<FinishedProductInventory>(`/warehouses/inventory/${id}`, data),
  recalculateCosts: () => api.post('/warehouses/inventory/recalculate-costs'),
  adjustInventory: (id: number, quantity: number, notes?: string) =>
    api.patch<FinishedProductInventory>(`/warehouses/inventory/${id}/adjust`, { quantity, notes }),
  transfer: (data: { productId: number; fromWarehouseId: number; toWarehouseId: number; quantity: number; notes?: string }) =>
    api.post('/warehouses/inventory/transfer', data),
};

export const supplierLedgerApi = {
  getLedger: (supplierId: number) => api.get<SupplierTransaction[]>(`/supplier-ledger/${supplierId}/ledger`),
  getSummary: (supplierId: number) => api.get<SupplierFinancialSummary>(`/supplier-ledger/${supplierId}/summary`),
  recordPayment: (supplierId: number, data: { moneyBoxId: number; orderId?: number; date: string; amount: number; paymentMethod?: string; reference?: string; notes?: string }) =>
    api.post(`/supplier-ledger/${supplierId}/payments`, data),
};

export default api;
