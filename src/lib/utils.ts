import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DZ';
}

export function getStepLabel(step: string): string {
  const labels: Record<string, string> = {
    CUTTING: 'Cutting',
    MONTAGE: 'Montage',
    FINITION: 'Finition',
    PAINT: 'Paint',
    PACKAGING: 'Packaging',
  };
  return labels[step] || step;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ELECTRICITY: 'Electricity',
    WATER: 'Water',
    TRANSPORT: 'Transport',
    SALARIES: 'Salaries',
    MAINTENANCE: 'Maintenance',
    OTHER: 'Other',
  };
  return labels[category] || category;
}

export function getUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    KG: 'kg',
    LITER: 'L',
    PIECE: 'pcs',
  };
  return labels[unit] || unit;
}

export function getSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    SIZE_45CM: '45cm',
    SIZE_60CM: '60cm',
    SIZE_80CM: '80cm',
    SIZE_100CM: '100cm',
    SIZE_120CM: '120cm',
  };
  return labels[size] || size;
}

export function getIncomeSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    PRODUCT_SALES: 'Product Sales',
    SERVICE_REVENUE: 'Service Revenue',
    CUSTOM_ORDERS: 'Custom Orders',
    REPAIRS: 'Repairs',
    CONSULTING: 'Consulting',
    OTHER: 'Other',
  };
  return labels[source] || source;
}
