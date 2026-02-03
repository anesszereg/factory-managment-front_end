import { useState, useEffect } from 'react';
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
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Page transition effect
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => setIsPageTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

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
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li 
                  key={item.name}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:translate-x-1',
                      sidebarCollapsed && 'lg:justify-center lg:px-2'
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                      !sidebarCollapsed && 'mr-3',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    <span className={cn(
                      'transition-all duration-200',
                      sidebarCollapsed && 'lg:hidden'
                    )}>{item.name}</span>
                    {isActive && !sidebarCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
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
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 transition-all duration-200 hover:text-gray-700"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 transition-transform duration-200 hover:translate-x-0.5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2 transition-transform duration-200" />
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
          <div 
            className={cn(
              "max-w-7xl mx-auto transition-all duration-300 ease-out",
              isPageTransitioning 
                ? "opacity-0 translate-y-2" 
                : "opacity-100 translate-y-0"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
