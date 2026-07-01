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
  const baseClasses = 'relative z-50 bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-200 overflow-hidden flex flex-col my-4 sm:my-8';
  
  // Check if className contains width/height classes to override defaults
  const hasWidthClass = className.includes('max-w-') || className.includes('w-[') || className.includes('w-full');
  const hasHeightClass = className.includes('max-h-') || className.includes('h-[') || className.includes('h-full');
  
  const sizeClasses = `${hasWidthClass ? '' : 'w-full max-w-2xl'} ${hasHeightClass ? '' : 'max-h-[85vh] sm:max-h-[90vh]'}`;
  
  return (
    <div className={`${baseClasses} ${sizeClasses} ${className}`}>
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 flex-shrink-0" />
      <div className="overflow-y-auto p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 px-4 sm:px-5 py-3 sm:py-4 mb-4 sm:mb-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
      <div className="flex-1 pr-3">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 rounded-lg transition-all p-1 flex-shrink-0 mt-0.5"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
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
    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
      {children}
    </p>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50">
      {children}
    </div>
  );
}

export function DialogBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 sm:px-5 py-4 sm:py-5 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}
