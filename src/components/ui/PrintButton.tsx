import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  onClick,
  label = 'Print',
  className = '',
  showLabel = false,
}) => {
  return (
    <button
      onClick={(e) => onClick?.(e)}
      className={`inline-flex items-center justify-center text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors ${
        showLabel ? 'px-3 py-1.5 text-sm font-medium' : 'p-1.5'
      } ${className}`}
      title={label}
      type="button"
    >
      <Printer className="h-4 w-4" />
      {showLabel && <span className="ml-1.5">{label}</span>}
    </button>
  );
};
