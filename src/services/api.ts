import axios from 'axios';
import type { 
  FurnitureModel, 
  ProductionOrder, 
  DailyProduction, 
  RawMaterial, 
  MaterialPurchase, 
  MaterialConsumption, 
  DailyExpense, 
  DashboardStats, 
  ProductionStatus, 
  ProductionStep, 
  MaterialUnit, 
  ExpenseCategory 
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
  create: (data: { name: string; description?: string }) => 
    api.post<FurnitureModel>('/furniture-models', data),
  update: (id: number, data: { name?: string; description?: string }) => 
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
    notes?: string;
  }) => api.post<MaterialConsumption>('/material-consumption', data),
  update: (id: number, data: {
    quantity?: number;
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

export const dashboardApi = {
  getStats: (date?: string) => 
    api.get<DashboardStats>('/dashboard/stats', { params: { date } }),
};

export default api;
