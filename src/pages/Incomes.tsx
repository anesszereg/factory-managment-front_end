import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { incomesApi } from '@/services/api';
import type { Income } from '@/types';
import { IncomeSource } from '@/types';
import { Plus, TrendingUp, DollarSign, Calendar, Filter, Edit2, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency, getIncomeSourceLabel } from '@/lib/utils';

export function Incomes() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  useEffect(() => {
    loadIncomes();
  }, [startDate, endDate, filterSource]);

  const loadIncomes = async () => {
    try {
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (filterSource && filterSource !== 'all') filters.source = filterSource;

      const response = await incomesApi.getAll(filters);
      setIncomes(response.data);
    } catch (error) {
      console.error('Failed to load incomes:', error);
      toast.error('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      date: formData.get('date') as string,
      source: formData.get('source') as string,
      amount: parseFloat(formData.get('amount') as string),
      paymentMethod: formData.get('paymentMethod') as string || undefined,
      description: formData.get('description') as string || undefined,
    };

    const loadingToast = toast.loading(editingIncome ? 'Updating income...' : 'Creating income...');
    
    try {
      if (editingIncome) {
        await incomesApi.update(editingIncome.id, data);
        toast.success('Income updated successfully!', { id: loadingToast });
      } else {
        await incomesApi.create(data);
        toast.success('Income created successfully!', { id: loadingToast });
      }
      setShowForm(false);
      setEditingIncome(null);
      loadIncomes();
    } catch (error) {
      console.error('Failed to save income:', error);
      toast.error('Failed to save income. Please try again.', { id: loadingToast });
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this income?')) return;

    const loadingToast = toast.loading('Deleting income...');
    try {
      await incomesApi.delete(id);
      toast.success('Income deleted successfully!', { id: loadingToast });
      loadIncomes();
    } catch (error) {
      console.error('Failed to delete income:', error);
      toast.error('Failed to delete income', { id: loadingToast });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIncome(null);
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Income Tracking</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600">
            Track and manage your revenue sources
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {incomes.length} {incomes.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Select
              label="Source"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value={IncomeSource.PRODUCT_SALES}>Product Sales</option>
              <option value={IncomeSource.SERVICE_REVENUE}>Service Revenue</option>
              <option value={IncomeSource.CUSTOM_ORDERS}>Custom Orders</option>
              <option value={IncomeSource.REPAIRS}>Repairs</option>
              <option value={IncomeSource.CONSULTING}>Consulting</option>
              <option value={IncomeSource.OTHER}>Other</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingIncome ? 'Edit Income' : 'Add New Income'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date"
                  name="date"
                  type="date"
                  required
                  defaultValue={editingIncome?.date || new Date().toISOString().split('T')[0]}
                />
                <Select
                  label="Source"
                  name="source"
                  required
                  defaultValue={editingIncome?.source}
                >
                  <option value="">Select source...</option>
                  <option value={IncomeSource.PRODUCT_SALES}>Product Sales</option>
                  <option value={IncomeSource.SERVICE_REVENUE}>Service Revenue</option>
                  <option value={IncomeSource.CUSTOM_ORDERS}>Custom Orders</option>
                  <option value={IncomeSource.REPAIRS}>Repairs</option>
                  <option value={IncomeSource.CONSULTING}>Consulting</option>
                  <option value={IncomeSource.OTHER}>Other</option>
                </Select>
                <Input
                  label="Amount (DZD)"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingIncome?.amount}
                  placeholder="0.00"
                />
                <Input
                  label="Payment Method"
                  name="paymentMethod"
                  type="text"
                  defaultValue={editingIncome?.paymentMethod}
                  placeholder="Cash, Bank Transfer, etc."
                />
              </div>
              <Textarea
                label="Description"
                name="description"
                rows={3}
                defaultValue={editingIncome?.description}
                placeholder="Additional notes..."
              />
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIncome ? 'Update Income' : 'Add Income'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income History</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No income records yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start tracking your revenue by adding your first income
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Income
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {incomes.map((income) => (
                  <div key={income.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {getIncomeSourceLabel(income.source)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(income.date)}</p>
                      </div>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(income.amount)}</p>
                    </div>
                    {income.paymentMethod && (
                      <p className="text-xs text-gray-500 mb-1">Payment: {income.paymentMethod}</p>
                    )}
                    {income.description && (
                      <p className="text-sm text-gray-600 mb-2">{income.description}</p>
                    )}
                    <div className="flex gap-4 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(income)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incomes.map((income) => (
                      <tr key={income.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatDate(income.date)}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {getIncomeSourceLabel(income.source)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(income.amount)}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {income.paymentMethod || '-'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {income.description || '-'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(income)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(income.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
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
