import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', text = 'Loading...', fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50'
    : 'w-full';

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[200px]', containerClasses)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          'rounded-full border-4 border-blue-100 animate-pulse',
          sizeClasses[size]
        )} />
        
        {/* Spinning ring */}
        <div className={cn(
          'absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin',
          sizeClasses[size]
        )} />
        
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'rounded-full bg-blue-600 animate-ping',
            size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
        </div>
      </div>
      
      {text && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-8 w-32" />
        </div>
        <LoadingSkeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 bg-gray-50 rounded-t-lg">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-28" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton className="h-10 w-32 rounded-md" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="bg-white rounded-lg border p-6">
        <LoadingSkeleton className="h-6 w-32 mb-4" />
        <TableSkeleton rows={5} />
      </div>
      
      {/* Loading indicator */}
      <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full p-3 border animate-bounce">
        <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );
}
