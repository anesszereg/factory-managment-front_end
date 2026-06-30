import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="flex min-h-full items-start justify-center p-2 sm:p-4 pt-4 sm:pt-8">
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  const baseClasses = 'relative z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 sm:p-6 overflow-y-auto my-4 sm:my-8';
  
  // Check if className contains width/height classes to override defaults
  const hasWidthClass = className.includes('max-w-') || className.includes('w-[') || className.includes('w-full');
  const hasHeightClass = className.includes('max-h-') || className.includes('h-[') || className.includes('h-full');
  
  const sizeClasses = `${hasWidthClass ? '' : 'w-full max-w-2xl'} ${hasHeightClass ? '' : 'max-h-[85vh] sm:max-h-[90vh]'}`;
  
  return (
    <div className={`${baseClasses} ${sizeClasses} ${className}`}>
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5 sm:mb-6 pb-4 sm:pb-5 border-b border-gray-100 sticky top-0 bg-white z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 -mt-5 sm:-mt-6 pt-5 sm:pt-6">
      <div className="flex-1 pr-2">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all p-1.5 flex-shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p className="text-sm text-gray-500 mt-1.5">
      {children}
    </p>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100">
      {children}
    </div>
  );
}
