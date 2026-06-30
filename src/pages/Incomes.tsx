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
import { Plus, TrendingUp, DollarSign, Calendar, Edit2, Trash2, ArrowUpRight, Banknote, Layers } from 'lucide-react';
import { formatDate, formatCurrency, getIncomeSourceLabel } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Loading';
import { PrintButton } from '@/components/ui/PrintButton';
import { printDocument } from '@/lib/print';

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

  const printIncome = (income: Income) => {
    printDocument({
      title: 'Income Receipt',
      subtitle: `#${income.id}`,
      fields: [
        { label: 'Date', value: formatDate(income.date) },
        { label: 'Source', value: getIncomeSourceLabel(income.source) },
        { label: 'Amount', value: formatCurrency(income.amount) },
        { label: 'Payment Method', value: income.paymentMethod || '-' },
        { label: 'Description', value: income.description || '-' },
      ],
    });
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const avgIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;

  const sourceBreakdown = incomes.reduce((acc, i) => {
    acc[i.source] = (acc[i.source] || 0) + i.amount;
    return acc;
  }, {} as Record<string, number>);

  const topSource = Object.entries(sourceBreakdown).length > 0
    ? Object.entries(sourceBreakdown).sort(([, a], [, b]) => b - a)[0]
    : null;

  const sourceColors: Record<string, { bg: string; text: string; bar: string; light: string }> = {
    PRODUCT_SALES: { bg: 'from-emerald-50 to-green-50', text: 'text-emerald-700', bar: 'bg-emerald-500', light: 'bg-emerald-100' },
    SERVICE_REVENUE: { bg: 'from-blue-50 to-indigo-50', text: 'text-blue-700', bar: 'bg-blue-500', light: 'bg-blue-100' },
    CUSTOM_ORDERS: { bg: 'from-purple-50 to-violet-50', text: 'text-purple-700', bar: 'bg-purple-500', light: 'bg-purple-100' },
    REPAIRS: { bg: 'from-orange-50 to-amber-50', text: 'text-orange-700', bar: 'bg-orange-500', light: 'bg-orange-100' },
    CONSULTING: { bg: 'from-cyan-50 to-teal-50', text: 'text-cyan-700', bar: 'bg-cyan-500', light: 'bg-cyan-100' },
    OTHER: { bg: 'from-gray-50 to-slate-50', text: 'text-gray-700', bar: 'bg-gray-500', light: 'bg-gray-100' },
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Banknote className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Income Tracking</h1>
            </div>
            <p className="text-green-100 text-sm sm:text-base ml-14">
              Track and manage your revenue sources
            </p>
          </div>
          <Button className="w-full sm:w-auto bg-white text-green-600 hover:bg-green-50 font-semibold" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>

        {/* Quick Summary */}
        <div className="relative mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">Total Revenue</p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">Transactions</p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">{incomes.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">Avg / Income</p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">{formatCurrency(avgIncome)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {(startDate || endDate || filterSource !== 'all') && (
              <Button
                variant="outline"
                onClick={() => { setStartDate(''); setEndDate(''); setFilterSource('all'); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
          {(startDate || endDate || filterSource !== 'all') && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Showing <span className="font-semibold">{incomes.length}</span> income records
                {filterSource !== 'all' && ` from ${getIncomeSourceLabel(filterSource)}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Income</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-gray-500 mt-1">{incomes.length} transactions</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgIncome)}</p>
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
                  <ArrowUpRight className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Top Source</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{topSource ? getIncomeSourceLabel(topSource[0]) : 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">{topSource ? formatCurrency(topSource[1]) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Layers className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Sources</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(sourceBreakdown).length}</p>
              <p className="text-xs text-gray-500 mt-1">Active sources</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
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

      {/* Source Breakdown */}
      {Object.keys(sourceBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-green-500" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(sourceBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([source, amount]) => {
                  const pct = totalIncome > 0 ? ((amount / totalIncome) * 100) : 0;
                  const c = sourceColors[source] || sourceColors.OTHER;
                  return (
                    <div key={source} className={`p-4 rounded-xl border bg-gradient-to-br ${c.bg} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${c.bar}`}></div>
                          <p className={`text-sm font-bold ${c.text}`}>{getIncomeSourceLabel(source)}</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                          {incomes.filter(i => i.source === source).length} txns
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-2">{formatCurrency(amount)}</p>
                      <div className="w-full bg-white/60 rounded-full h-2">
                        <div
                          className={`${c.bar} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-right text-[10px] font-semibold text-gray-600 mt-1">{pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-gray-500" />
            Income History
            {(startDate || endDate || filterSource !== 'all') && (
              <span className="text-sm font-normal text-gray-400">(Filtered)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Banknote className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-900 mb-1">No income records yet</p>
              <p className="text-sm text-gray-500 mb-4">Start tracking your revenue by adding your first income</p>
              <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Income
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {incomes.map((income) => {
                  const c = sourceColors[income.source] || sourceColors.OTHER;
                  return (
                    <div key={income.id} className={`rounded-xl border p-4 bg-gradient-to-r ${c.bg} hover:shadow-sm transition-shadow`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.light} ${c.text}`}>
                            {getIncomeSourceLabel(income.source)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(income.date)}</p>
                        </div>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(income.amount)}</p>
                      </div>
                      {income.paymentMethod && (
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Payment:</span> {income.paymentMethod}
                        </p>
                      )}
                      {income.description && (
                        <p className="text-sm text-gray-600 mb-2">{income.description}</p>
                      )}
                      <div className="flex gap-2 pt-2 border-t border-gray-200/50">
                        <PrintButton onClick={() => printIncome(income)} />
                        <button
                          onClick={() => handleEdit(income)}
                          className="p-1.5 rounded-lg hover:bg-white/60 text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
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
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Source</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 lg:px-6 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incomes.map((income) => {
                      const c = sourceColors[income.source] || sourceColors.OTHER;
                      return (
                        <tr key={income.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              {formatDate(income.date)}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${c.light} ${c.text}`}>
                              {getIncomeSourceLabel(income.source)}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                            {formatCurrency(income.amount)}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {income.paymentMethod || '-'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {income.description || '-'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-1">
                              <PrintButton onClick={() => printIncome(income)} label="Print income" />
                              <button
                                onClick={() => handleEdit(income)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(income.id)}
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
