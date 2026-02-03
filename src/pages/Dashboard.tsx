import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { dashboardApi, dailyExpensesApi, dailyProductionApi, rawMaterialsApi, productionOrdersApi, salaryAllowancesApi, employeesApi } from '@/services/api';
import type { DashboardStats, DailyExpense, DailyProduction, ProductionOrder, SalaryAllowance, Employee } from '@/types';
import { AlertTriangle, Package, DollarSign, CheckCircle, TrendingUp, TrendingDown, Factory, ShoppingCart, Calendar, Users, Wallet } from 'lucide-react';
import { formatCurrency, getStepLabel, getUnitLabel, formatDate } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Loading';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [production, setProduction] = useState<DailyProduction[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, expensesRes, productionRes, , ordersRes, allowancesRes, employeesRes] = await Promise.all([
        dashboardApi.getStats(),
        dailyExpensesApi.getAll(),
        dailyProductionApi.getAll(),
        rawMaterialsApi.getAll(),
        productionOrdersApi.getAll(),
        salaryAllowancesApi.getAll(),
        employeesApi.getAll({ status: 'ACTIVE' as any }),
      ]);
      setStats(statsRes.data);
      setExpenses(expensesRes.data);
      setProduction(productionRes.data);
      setOrders(ordersRes.data);
      setAllowances(allowancesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!stats) {
    return <div className="text-center py-8">Failed to load dashboard</div>;
  }

  const filterByDateRange = (date: string) => {
    if (!startDate && !endDate) return true;
    const itemDate = new Date(date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      return itemDate >= start && itemDate <= end;
    } else if (start) {
      return itemDate >= start;
    } else if (end) {
      return itemDate <= end;
    }
    return true;
  };

  const filteredExpenses = expenses.filter(e => filterByDateRange(e.date));
  const filteredProduction = production.filter(p => filterByDateRange(p.date));
  
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProduced = filteredProduction.reduce((sum, p) => sum + p.quantityCompleted, 0);
  const totalLost = filteredProduction.reduce((sum, p) => sum + p.quantityLost, 0);
  const activeOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const completedOrders = orders.filter(o => o.status === 'FINISHED').length;
  
  const expensesByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const productionByStep = filteredProduction.reduce((acc, p) => {
    if (!acc[p.step]) {
      acc[p.step] = { completed: 0, entered: 0, lost: 0 };
    }
    acc[p.step].completed += p.quantityCompleted;
    acc[p.step].entered += p.quantityEntered;
    acc[p.step].lost += p.quantityLost;
    return acc;
  }, {} as Record<string, { completed: number; entered: number; lost: number }>);

  const filteredAllowances = allowances.filter(a => filterByDateRange(a.date));
  const totalAllowancesPaid = filteredAllowances.reduce((sum, a) => sum + a.amount, 0);
  const totalMonthlySalaries = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const remainingSalaryBudget = totalMonthlySalaries - totalAllowancesPaid;
  const averageAllowancePerEmployee = employees.length > 0 ? totalAllowancesPaid / employees.length : 0;

  // Chart data preparation
  const expenseChartData = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      const date = e.date.split('T')[0];
      acc[date] = (acc[date] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([date, amount]) => ({ date: formatDate(date), amount })).slice(-14);

  const productionChartData = Object.entries(
    filteredProduction.reduce((acc, p) => {
      const date = p.date.split('T')[0];
      if (!acc[date]) acc[date] = { completed: 0, lost: 0 };
      acc[date].completed += p.quantityCompleted;
      acc[date].lost += p.quantityLost;
      return acc;
    }, {} as Record<string, { completed: number; lost: number }>)
  ).map(([date, data]) => ({ date: formatDate(date), ...data })).slice(-14);

  const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600">
            Overview of production, materials, and expenses
          </p>
        </div>
        <Calendar className="hidden sm:block h-8 w-8 text-blue-500 animate-pulse" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range Filter</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                  className="w-full sm:w-auto"
                />
                <span className="text-gray-500 hidden sm:inline">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                  className="w-full sm:w-auto"
                />
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {startDate || endDate ? (
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="font-medium text-blue-900">Filtered Period</p>
                  <p className="text-blue-700">
                    {filteredExpenses.length} expenses • {filteredProduction.length} production records
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <p className="font-medium text-gray-900">All Time</p>
                  <p className="text-gray-600">
                    {expenses.length} expenses • {production.length} production records
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} records</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Units Produced</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalProduced}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredProduction.length} records</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Units Lost</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalLost}</p>
                <p className="text-xs text-red-500 mt-1">{totalLost > 0 ? `${((totalLost / (totalProduced + totalLost)) * 100).toFixed(1)}% loss` : 'No loss'}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeOrders}</p>
                <p className="text-xs text-gray-500 mt-1">{completedOrders} completed</p>
              </div>
              <Factory className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.materials.lowStockCount}</p>
                <p className="text-xs text-orange-500 mt-1">Need restocking</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Expenses Trend Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <DollarSign className="h-5 w-5 mr-2" />
              Expenses Trend (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={expenseChartData}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Trend Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Factory className="h-5 w-5 mr-2" />
              Production Trend (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" fill="#ef4444" name="Lost" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No production data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category Pie Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length > 0 ? (
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-[40%] space-y-1">
                  {expensePieData.slice(0, 6).map((entry, index) => (
                    <div key={entry.name} className="flex items-center text-xs">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate flex-1">{entry.name}</span>
                      <span className="font-medium ml-1">{((entry.value / totalExpenses) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="card-hover bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg shadow-sm hover-lift">
                <p className="text-xs text-gray-500">Avg Daily Expense</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(expenseChartData.length > 0 ? totalExpenses / expenseChartData.length : 0)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm hover-lift">
                <p className="text-xs text-gray-500">Avg Daily Production</p>
                <p className="text-xl font-bold text-green-600">
                  {productionChartData.length > 0 ? Math.round(totalProduced / productionChartData.length) : 0} units
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm hover-lift">
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  {totalProduced + totalLost > 0 ? ((totalProduced / (totalProduced + totalLost)) * 100).toFixed(1) : 100}%
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm hover-lift">
                <p className="text-xs text-gray-500">Order Completion</p>
                <p className="text-xl font-bold text-purple-600">
                  {orders.length > 0 ? ((completedOrders / orders.length) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Wallet className="h-5 w-5 mr-2" />
            Employee Benefits & Salaries {startDate || endDate ? '(Filtered)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Active Employees</p>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total workforce</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Total Salary Budget</p>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlySalaries)}</p>
              <p className="text-xs text-gray-500 mt-1">Monthly budget</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Allowances Paid</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAllowancesPaid)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredAllowances.length} transactions</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Remaining Budget</p>
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(remainingSalaryBudget)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalMonthlySalaries > 0 ? `${((remainingSalaryBudget / totalMonthlySalaries) * 100).toFixed(1)}% remaining` : 'N/A'}
              </p>
            </div>
          </div>
          
          {employees.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Salary Utilization</p>
                <p className="text-sm font-semibold text-gray-900">
                  {totalMonthlySalaries > 0 ? `${((totalAllowancesPaid / totalMonthlySalaries) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    totalMonthlySalaries > 0 && (totalAllowancesPaid / totalMonthlySalaries) > 0.9
                      ? 'bg-red-500'
                      : totalMonthlySalaries > 0 && (totalAllowancesPaid / totalMonthlySalaries) > 0.7
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${totalMonthlySalaries > 0 ? Math.min((totalAllowancesPaid / totalMonthlySalaries) * 100, 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Average per employee: {formatCurrency(averageAllowancePerEmployee)}</span>
                <span>{filteredAllowances.length} allowance records</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Factory className="h-5 w-5 mr-2 text-blue-600" />
              Production by Step {startDate || endDate ? '(Filtered)' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(productionByStep).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No production data for selected period</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(productionByStep).map(([step, data]) => (
                  <div key={step} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-blue-500" />
                        <p className="text-sm font-semibold">{getStepLabel(step)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{data.completed}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Entered: {data.entered}</span>
                      <span className="text-red-600">Lost: {data.lost}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${data.entered > 0 ? (data.completed / data.entered) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-red-600" />
              Expenses by Category {startDate || endDate ? '(Filtered)' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(expensesByCategory).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No expenses for selected period</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-24">
                          <p className="text-sm font-medium">{category}</p>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(amount / totalExpenses) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold">{formatCurrency(amount)}</p>
                        <p className="text-xs text-gray-500">
                          {((amount / totalExpenses) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Low Stock Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.materials.lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All materials are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.materials.lowStockItems.map((material) => (
                  <div key={material.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-orange-900">{material.name}</p>
                        <p className="text-xs text-orange-700">
                          Alert: {material.minStockAlert} {getUnitLabel(material.unit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          {material.currentStock}
                        </p>
                        <p className="text-xs text-orange-700">{getUnitLabel(material.unit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Recent Production Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProduction.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent production activity</p>
            ) : (
              <div className="space-y-2">
                {filteredProduction.slice(0, 5).map((prod) => (
                  <div key={prod.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">Order #{prod.orderId}</p>
                        <p className="text-xs text-gray-500">{getStepLabel(prod.step)} • {formatDate(prod.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">+{prod.quantityCompleted}</p>
                        {prod.quantityLost > 0 && (
                          <p className="text-xs text-red-600">-{prod.quantityLost} lost</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-purple-600" />
            Recent Expenses {startDate || endDate ? '(Filtered)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No expenses for selected period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.slice(0, 10).map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {expense.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
