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
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
  }).format(amount);
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
