import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { dailyExpensesApi } from '@/services/api';
import type { DailyExpense } from '@/types';
import { ExpenseCategory } from '@/types';
import { Plus, DollarSign, TrendingUp, Calendar, CreditCard, Filter, Edit2, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency, getCategoryLabel } from '@/lib/utils';

export function Expenses() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesRes] = await Promise.all([
        dailyExpensesApi.getAll(),
      ]);
      setExpenses(expensesRes.data);
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
      if (editingExpense) {
        await dailyExpensesApi.update(editingExpense.id, {
          date: formData.get('date') as string,
          category: formData.get('category') as ExpenseCategory,
          amount: parseFloat(formData.get('amount') as string),
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
          paymentMethod: formData.get('paymentMethod') as string || undefined,
          description: formData.get('description') as string || undefined,
        });
        toast.success('Expense created successfully!', { id: loadingToast });
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast.error('Failed to save expense. Please try again.', { id: loadingToast });
    }
  };

  const handleEdit = (expense: DailyExpense) => {
    setEditingExpense(expense);
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Expenses</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage daily operational expenses
          </p>
        </div>
        <Button onClick={() => {
          setEditingExpense(null);
          setShowForm(!showForm);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range Filter</label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {startDate || endDate ? (
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <p className="font-medium text-blue-900">Filtered</p>
                    <p className="text-blue-700">{filteredExpenses.length} expenses</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 px-4 py-2 rounded-lg">
                    <p className="font-medium text-gray-900">All Time</p>
                    <p className="text-gray-600">{expenses.length} expenses</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Select
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
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
              >
                <option value="all">All Payment Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
              {(startDate || endDate || filterCategory !== 'all' || filterPayment !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setFilterCategory('all');
                    setFilterPayment('all');
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} expenses</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Expense</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(avgAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Category</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {topCategory ? getCategoryLabel(topCategory[0]) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {topCategory ? formatCurrency(topCategory[1]) : '-'}
                </p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(categoryBreakdown).length}</p>
                <p className="text-xs text-gray-500 mt-1">Active categories</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-red-600" />
              Expenses by Category {startDate || endDate || filterCategory !== 'all' ? '(Filtered)' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No expenses for selected filters</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">{getCategoryLabel(category)}</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(amount)}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{ width: `${(amount / totalAmount) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-600">
                          {filteredExpenses.filter(e => e.category === category).length} transactions
                        </p>
                        <p className="text-xs text-gray-600">
                          {((amount / totalAmount) * 100).toFixed(1)}%
                        </p>
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
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No payment methods recorded</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const methodExpenses = filteredExpenses.filter(e => e.paymentMethod === method);
                  const methodTotal = methodExpenses.reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={method} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-blue-900">{method}</p>
                          <p className="text-xs text-blue-700">{methodExpenses.length} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-900">{formatCurrency(methodTotal)}</p>
                          <p className="text-xs text-blue-700">
                            {((methodTotal / totalAmount) * 100).toFixed(1)}%
                          </p>
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

      <Card>
        <CardHeader>
          <CardTitle>All Expenses {startDate || endDate || filterCategory !== 'all' || filterPayment !== 'all' ? '(Filtered)' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No expenses match the selected filters</p>
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
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getCategoryLabel(expense.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.paymentMethod || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
