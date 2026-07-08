import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { dailyExpensesApi, moneyBoxApi } from '@/services/api';
import type { DailyExpense, MoneyBox } from '@/types';
import { ExpenseCategory } from '@/types';
import { Plus, DollarSign, TrendingUp, CreditCard, Edit2, Trash2, Wallet, ArrowDownRight, PieChart, Receipt } from 'lucide-react';
import { PageLoading } from '../components/ui/Loading';
import { formatDate, formatCurrency, getCategoryLabel } from '@/lib/utils';
import { PrintButton } from '@/components/ui/PrintButton';
import { printDocument } from '@/lib/print';

export function Expenses() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [moneyBoxes, setMoneyBoxes] = useState<MoneyBox[]>([]);
  const [selectedMoneyBoxId, setSelectedMoneyBoxId] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesRes, boxesRes] = await Promise.all([
        dailyExpensesApi.getAll(),
        moneyBoxApi.getAll(),
      ]);
      setExpenses(expensesRes.data);
      setMoneyBoxes(boxesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load expenses data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading(editingExpense ? 'Updating expense...' : 'Creating expense...');
    
    try {
      const moneyBoxId = selectedMoneyBoxId || undefined;
      if (editingExpense) {
        await dailyExpensesApi.update(editingExpense.id, {
          date: formData.get('date') as string,
          category: formData.get('category') as ExpenseCategory,
          amount: parseFloat(formData.get('amount') as string),
          moneyBoxId: selectedMoneyBoxId || 0,
          paymentMethod: formData.get('paymentMethod') as string || undefined,
          description: formData.get('description') as string || undefined,
        });
        toast.success('Expense updated successfully!', { id: loadingToast });
        setEditingExpense(null);
      } else {
        await dailyExpensesApi.create({
          date: formData.get('date') as string,
          category: formData.get('category') as ExpenseCategory,
          amount: parseFloat(formData.get('amount') as string),
          moneyBoxId,
          paymentMethod: formData.get('paymentMethod') as string || undefined,
          description: formData.get('description') as string || undefined,
        });
        toast.success('Expense created successfully!', { id: loadingToast });
      }
      setShowForm(false);
      setSelectedMoneyBoxId(0);
      loadData();
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast.error('Failed to save expense. Please try again.', { id: loadingToast });
    }
  };

  const handleEdit = (expense: DailyExpense) => {
    setEditingExpense(expense);
    setSelectedMoneyBoxId(expense.moneyBoxId ?? 0);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    const loadingToast = toast.loading('Deleting expense...');
    
    try {
      await dailyExpensesApi.delete(id);
      toast.success('Expense deleted successfully!', { id: loadingToast });
      loadData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense. Please try again.', { id: loadingToast });
    }
  };

  const printExpense = (expense: DailyExpense) => {
    printDocument({
      title: 'Expense Receipt',
      subtitle: `#${expense.id}`,
      fields: [
        { label: 'Date', value: formatDate(expense.date) },
        { label: 'Category', value: getCategoryLabel(expense.category) },
        { label: 'Amount', value: formatCurrency(expense.amount) },
        { label: 'Payment Method', value: expense.paymentMethod || '-' },
        { label: 'Description', value: expense.description || '-' },
      ],
    });
  };

  if (loading) {
    return <PageLoading />;
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

  const filteredExpenses = expenses.filter(expense => {
    const matchesDate = filterByDateRange(expense.date);
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesPayment = filterPayment === 'all' || expense.paymentMethod === filterPayment;
    return matchesDate && matchesCategory && matchesPayment;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
  
  const categoryBreakdown = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethods = Array.from(new Set(expenses.map(e => e.paymentMethod).filter(Boolean)));
  
  const topCategory = Object.entries(categoryBreakdown).length > 0
    ? Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0]
    : null;

  const categoryColors: Record<string, { bg: string; text: string; bar: string; light: string }> = {
    ELECTRICITY: { bg: 'from-yellow-50 to-amber-50', text: 'text-yellow-700', bar: 'bg-yellow-500', light: 'bg-yellow-100' },
    WATER: { bg: 'from-cyan-50 to-blue-50', text: 'text-cyan-700', bar: 'bg-cyan-500', light: 'bg-cyan-100' },
    TRANSPORT: { bg: 'from-indigo-50 to-violet-50', text: 'text-indigo-700', bar: 'bg-indigo-500', light: 'bg-indigo-100' },
    SALARIES: { bg: 'from-emerald-50 to-green-50', text: 'text-emerald-700', bar: 'bg-emerald-500', light: 'bg-emerald-100' },
    MAINTENANCE: { bg: 'from-orange-50 to-red-50', text: 'text-orange-700', bar: 'bg-orange-500', light: 'bg-orange-100' },
    OTHER: { bg: 'from-gray-50 to-slate-50', text: 'text-gray-700', bar: 'bg-gray-500', light: 'bg-gray-100' },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Daily Expenses</h1>
            </div>
            <p className="text-red-100 text-sm sm:text-base ml-14">
              Track and manage daily operational expenses
            </p>
          </div>
          <Button className="w-full sm:w-auto bg-white text-red-600 hover:bg-red-50 font-semibold" onClick={() => {
            setEditingExpense(null);
            setSelectedMoneyBoxId(0);
            setShowForm(!showForm);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Quick Summary */}
        <div className="relative mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">Total Spent</p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">Transactions</p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">{filteredExpenses.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">Avg / Expense</p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">{formatCurrency(avgAmount)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Select
                  label="Category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {Object.values(ExpenseCategory).map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Payment"
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                >
                  <option value="all">All Methods</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </Select>
              </div>
              {(startDate || endDate || filterCategory !== 'all' || filterPayment !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => { setStartDate(''); setEndDate(''); setFilterCategory('all'); setFilterPayment('all'); }}
                >
                  Clear All
                </Button>
              )}
            </div>
            {(startDate || endDate || filterCategory !== 'all' || filterPayment !== 'all') && (
              <div className="p-3 bg-rose-50 rounded-lg">
                <p className="text-sm text-rose-800">
                  Showing <span className="font-semibold">{filteredExpenses.length}</span> of {expenses.length} expenses
                  {filterCategory !== 'all' && ` in ${getCategoryLabel(filterCategory)}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Average</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">Per transaction</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Top Category</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{topCategory ? getCategoryLabel(topCategory[0]) : 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">{topCategory ? formatCurrency(topCategory[1]) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Categories</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(categoryBreakdown).length}</p>
              <p className="text-xs text-gray-500 mt-1">Active categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <Input
                label="Date"
                type="date"
                name="date"
                required
                defaultValue={editingExpense ? editingExpense.date.split('T')[0] : new Date().toISOString().split('T')[0]}
                helperText="Select the date of the expense"
              />
              <Select
                label="Category"
                name="category"
                required
                defaultValue={editingExpense?.category}
                helperText="Choose the expense category"
              >
                <option value="">Select category</option>
                {Object.values(ExpenseCategory).map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </Select>
              <Input
                label="Amount"
                type="number"
                name="amount"
                required
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={editingExpense?.amount}
                helperText="Enter the expense amount"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caisse (Money Box)</label>
                <select
                  value={selectedMoneyBoxId}
                  onChange={e => setSelectedMoneyBoxId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value={0}>-- Sans caisse --</option>
                  {moneyBoxes.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA)</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Le montant sera déduit du solde de la caisse sélectionnée</p>
              </div>
              <Input
                label="Payment Method"
                type="text"
                name="paymentMethod"
                placeholder="e.g., Cash, Bank Transfer, Credit Card"
                defaultValue={editingExpense?.paymentMethod || ''}
                helperText="Optional: Specify how the payment was made"
              />
              <Textarea
                label="Description"
                name="description"
                rows={3}
                placeholder="Add any additional notes..."
                defaultValue={editingExpense?.description || ''}
                helperText="Optional: Provide details about this expense"
              />
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{editingExpense ? 'Update Expense' : 'Add Expense'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-rose-500" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No expenses for selected filters</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const pct = totalAmount > 0 ? ((amount / totalAmount) * 100) : 0;
                    const c = categoryColors[category] || categoryColors.OTHER;
                    return (
                      <div key={category} className={`p-4 rounded-xl border bg-gradient-to-r ${c.bg} hover:shadow-sm transition-shadow`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${c.bar}`}></div>
                            <p className={`text-sm font-bold ${c.text}`}>{getCategoryLabel(category)}</p>
                          </div>
                          <p className="text-base font-bold text-gray-900">{formatCurrency(amount)}</p>
                        </div>
                        <div className="w-full bg-white/60 rounded-full h-2">
                          <div
                            className={`${c.bar} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <p className="text-[11px] text-gray-500">
                            {filteredExpenses.filter(e => e.category === category).length} transactions
                          </p>
                          <p className="text-[11px] font-semibold text-gray-600">{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No payment methods recorded</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method, idx) => {
                  const methodExpenses = filteredExpenses.filter(e => e.paymentMethod === method);
                  const methodTotal = methodExpenses.reduce((sum, e) => sum + e.amount, 0);
                  const pct = totalAmount > 0 ? ((methodTotal / totalAmount) * 100) : 0;
                  const gradients = [
                    'from-blue-50 to-indigo-50 border-blue-200',
                    'from-emerald-50 to-teal-50 border-emerald-200',
                    'from-purple-50 to-pink-50 border-purple-200',
                    'from-orange-50 to-amber-50 border-orange-200',
                  ];
                  return (
                    <div key={method} className={`p-4 rounded-xl border bg-gradient-to-r ${gradients[idx % gradients.length]} hover:shadow-sm transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-white/60 rounded-lg flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{method}</p>
                            <p className="text-xs text-gray-500">{methodExpenses.length} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900">{formatCurrency(methodTotal)}</p>
                          <p className="text-[11px] font-semibold text-gray-500">{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-500" />
            All Expenses
            {(startDate || endDate || filterCategory !== 'all' || filterPayment !== 'all') && (
              <span className="text-sm font-normal text-gray-400">(Filtered)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-400">No expenses match the selected filters</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredExpenses.map((expense) => {
                  const c = categoryColors[expense.category] || categoryColors.OTHER;
                  return (
                    <div key={expense.id} className={`rounded-xl border p-4 bg-gradient-to-r ${c.bg} hover:shadow-sm transition-shadow`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.light} ${c.text}`}>
                            {getCategoryLabel(expense.category)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(expense.date)}</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                      </div>
                      {expense.paymentMethod && (
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Payment:</span> {expense.paymentMethod}
                        </p>
                      )}
                      {expense.description && (
                        <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                      )}
                      <div className="flex gap-2 pt-2 border-t border-gray-200/50">
                        <PrintButton onClick={() => printExpense(expense)} />
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-white/60 text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg hover:bg-white/60 text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 lg:px-6 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredExpenses.map((expense) => {
                      const c = categoryColors[expense.category] || categoryColors.OTHER;
                      return (
                        <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${c.light} ${c.text}`}>
                              {getCategoryLabel(expense.category)}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {expense.paymentMethod || '-'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {expense.description || '-'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-1">
                              <PrintButton onClick={() => printExpense(expense)} label="Print expense" />
                              <button
                                onClick={() => handleEdit(expense)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
