import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  DollarSign,
  TrendingUp,
  Factory,
  Users,
  Wallet,
  Menu,
  X,
  Hammer,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Production', href: '/production', icon: Factory },
    { name: 'Raw Materials', href: '/materials', icon: Boxes },
    { name: 'Suppliers', href: '/suppliers', icon: Truck },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Incomes', href: '/incomes', icon: TrendingUp },
    { name: 'Models', href: '/models', icon: Package },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Piece Workers', href: '/piece-workers', icon: Hammer },
    { name: 'Salary Allowances', href: '/salary-allowances', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64'
        )}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className={cn('flex items-center', sidebarCollapsed && 'lg:justify-center lg:w-full')}>
            <Factory className="h-8 w-8 text-primary flex-shrink-0" />
            <span className={cn(
              'ml-2 text-xl font-bold text-gray-900 whitespace-nowrap',
              sidebarCollapsed && 'lg:hidden'
            )}>
              Factory Manager
            </span>
          </div>
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100',
                      sidebarCollapsed && 'lg:justify-center lg:px-2'
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0', !sidebarCollapsed && 'mr-3')} />
                    <span className={cn(sidebarCollapsed && 'lg:hidden')}>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse button (desktop only) */}
        <div className="hidden lg:block p-3 border-t border-gray-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
          <button
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-3 flex items-center">
            <Factory className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold text-gray-900">Factory Manager</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
