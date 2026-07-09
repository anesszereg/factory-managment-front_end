import React, { useState, useEffect } from 'react';
import { salaryAllowancesApi, employeesApi, moneyBoxApi } from '../services/api';
import { SalaryAllowance, Employee, EmployeeStatus, EmployeeSalaryInfo, MoneyBox } from '../types';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import toast from 'react-hot-toast';
import {
  Plus, Users, Calendar, AlertTriangle, Clock, CheckCircle,
  Edit2, Trash2, Printer, X, Filter, TrendingDown,
  Banknote, UserCircle
} from 'lucide-react';

const SalaryAllowances: React.FC = () => {
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<SalaryAllowance | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [salaryInfo, setSalaryInfo] = useState<EmployeeSalaryInfo | null>(null);
  const [lastMonthSalaryInfo, setLastMonthSalaryInfo] = useState<EmployeeSalaryInfo | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    description: ''
  });
  const [salarySummary, setSalarySummary] = useState<any>(null);
  const [moneyBoxes, setMoneyBoxes] = useState<MoneyBox[]>([]);
  const [formMoneyBoxId, setFormMoneyBoxId] = useState<number>(0);

  useEffect(() => {
    fetchEmployees();
    fetchAllowances();
    fetchSalarySummary();
    fetchMoneyBoxes();
  }, [filterEmployeeId, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchSalaryInfo(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchMoneyBoxes = async () => {
    try {
      const response = await moneyBoxApi.getAll();
      setMoneyBoxes(response.data);
    } catch (error) {
      console.error('Error fetching money boxes:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAll({ status: EmployeeStatus.ACTIVE });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAllowances = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (filterEmployeeId) {
        filters.employeeId = filterEmployeeId;
      }
      
      if (filterStartDate) {
        filters.startDate = filterStartDate;
      }
      
      if (filterEndDate) {
        filters.endDate = filterEndDate;
      }
      
      const response = await salaryAllowancesApi.getAll(filters);
      setAllowances(response.data);
    } catch (error) {
      console.error('Error fetching allowances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterEmployeeId('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    setFilterStartDate(format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'));
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setFilterStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
    setFilterEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  const fetchSalarySummary = async () => {
    try {
      const response = await employeesApi.getSalarySummary();
      setSalarySummary(response.data);
    } catch (error) {
      console.error('Error fetching salary summary:', error);
    }
  };

  const getDailyRate = (monthlySalary: number) => monthlySalary / 30;

  const getTotalEarningsForCurrentMonth = (monthlySalary: number, hireDate: string) => {
    const dailyRate = getDailyRate(monthlySalary);
    const today = new Date();
    const hire = new Date(hireDate);
    let startDate = new Date(today.getFullYear(), today.getMonth(), hire.getDate());
    if (startDate > today) {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, hire.getDate());
    }
    const daysWorked = differenceInDays(today, startDate) + 1;
    return dailyRate * Math.max(0, daysWorked);
  };

  // Get all employees with their salary cycle status, grouped by urgency
  const getPaymentAlerts = () => {
    if (!salarySummary?.employees) return { overdue: [], today: [], thisWeek: [], upcoming: [], later: [] };
    const today = new Date();
    const enriched = salarySummary.employees.map((emp: any) => {
      const cycleEnd = new Date(emp.salaryCycle.end);
      const daysLeft = differenceInDays(cycleEnd, today);
      const employee = employees.find(e => e.id === emp.id);
      const dailyRate = getDailyRate(emp.monthlySalary);
      const totalEarningsCurrentMonth = employee
        ? getTotalEarningsForCurrentMonth(emp.monthlySalary, employee.hireDate)
        : 0;
      return { ...emp, daysLeft, cycleEnd, employee, dailyRate, totalEarningsCurrentMonth };
    });

    return {
      overdue: enriched.filter((e: any) => e.daysLeft < 0).sort((a: any, b: any) => a.daysLeft - b.daysLeft),
      today: enriched.filter((e: any) => e.daysLeft === 0),
      thisWeek: enriched.filter((e: any) => e.daysLeft >= 1 && e.daysLeft <= 7).sort((a: any, b: any) => a.daysLeft - b.daysLeft),
      upcoming: enriched.filter((e: any) => e.daysLeft >= 8 && e.daysLeft <= 15).sort((a: any, b: any) => a.daysLeft - b.daysLeft),
      later: enriched.filter((e: any) => e.daysLeft > 15).sort((a: any, b: any) => a.daysLeft - b.daysLeft),
    };
  };

  const fetchSalaryInfo = async (employeeId: number) => {
    try {
      // Fetch current month salary info
      const currentResponse = await employeesApi.getSalaryInfo(employeeId);
      setSalaryInfo(currentResponse.data);
      
      // Fetch last month salary info
      const lastMonth = subMonths(new Date(), 1);
      const lastMonthResponse = await employeesApi.getSalaryInfo(employeeId, format(lastMonth, 'yyyy-MM-dd'));
      setLastMonthSalaryInfo(lastMonthResponse.data);
    } catch (error) {
      console.error('Error fetching salary info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingAllowance ? 'Updating allowance...' : 'Creating allowance...');
    try {
      if (editingAllowance) {
        await salaryAllowancesApi.update(editingAllowance.id, {
          date: formData.date,
          amount: parseFloat(formData.amount),
          description: formData.description,
          moneyBoxId: formMoneyBoxId || 0,
        });
        toast.success('Allowance updated', { id: loadingToast });
      } else {
        await salaryAllowancesApi.create({
          employeeId: parseInt(formData.employeeId),
          date: formData.date,
          amount: parseFloat(formData.amount),
          description: formData.description,
          moneyBoxId: formMoneyBoxId || undefined,
        });
        toast.success('Allowance created', { id: loadingToast });
      }
      resetForm();
      fetchAllowances();
      if (selectedEmployee) fetchSalaryInfo(selectedEmployee);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving allowance', { id: loadingToast });
    }
  };

  const handleEdit = (allowance: SalaryAllowance) => {
    setEditingAllowance(allowance);
    setFormData({
      employeeId: allowance.employeeId.toString(),
      date: format(new Date(allowance.date), 'yyyy-MM-dd'),
      amount: allowance.amount.toString(),
      description: allowance.description || ''
    });
    setFormMoneyBoxId(allowance.moneyBoxId ?? 0);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this allowance?')) return;
    const loadingToast = toast.loading('Deleting...');
    try {
      await salaryAllowancesApi.delete(id);
      toast.success('Allowance deleted', { id: loadingToast });
      fetchAllowances();
      if (selectedEmployee) fetchSalaryInfo(selectedEmployee);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting allowance', { id: loadingToast });
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      description: ''
    });
    setFormMoneyBoxId(0);
    setEditingAllowance(null);
    setShowForm(false);
  };

  const printAllowance = (allowance: SalaryAllowance) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Acompte #${allowance.id}</title>
      <style>
        @page { size: 100mm 100mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 10px; width: 100mm; min-height: 100mm; padding: 4mm; line-height: 1.4; }
        .title { text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 2mm; margin-bottom: 2mm; }
        .row { display: flex; justify-content: space-between; padding: 1mm 0; border-bottom: 1px dotted #ccc; }
        .amount-box { text-align: center; border: 1px solid #000; padding: 2mm; margin: 2mm 0; }
        .amount-val { font-size: 15px; font-weight: bold; }
        .footer { text-align: center; font-size: 8px; color: #666; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #000; }
      </style></head><body>
        <div class="title">ACOMPTE SUR SALAIRE</div>
        <div class="row"><span>Employé:</span><span>${allowance.employee?.firstName || ''} ${allowance.employee?.lastName || ''}</span></div>
        <div class="row"><span>Date:</span><span>${format(new Date(allowance.date), 'dd/MM/yyyy')}</span></div>
        ${allowance.description ? `<div class="row"><span>Motif:</span><span>${allowance.description}</span></div>` : ''}
        <div class="amount-box"><div style="font-size:9px">Montant</div><div class="amount-val">${formatCurrency(allowance.amount)}</div></div>
        <div class="footer"><p>Bon pour acompte</p><p>Imprimé le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p></div>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const alerts = getPaymentAlerts();
  const totalAllowancesAmount = allowances.reduce((s, a) => s + a.amount, 0);
  const overdueCount = alerts.overdue.length + alerts.today.length;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Salary Allowances</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage employee advance payments</p>
        </div>
        <Button onClick={() => { setEditingAllowance(null); resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Allowance
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{employees.length}</p>
                <p className="text-xs text-blue-500 mt-1">active</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Total Advances</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalAllowancesAmount)}</p>
                <p className="text-xs text-orange-500 mt-1">{allowances.length} records</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg"><Banknote className="h-6 w-6 text-orange-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br border ${overdueCount > 0 ? 'from-red-50 to-white border-red-100' : 'from-green-50 to-white border-green-100'}`}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>Overdue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{overdueCount}</p>
                <p className={`text-xs mt-1 ${overdueCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{overdueCount > 0 ? 'needs attention' : 'all clear'}</p>
              </div>
              <div className={`p-2 rounded-lg ${overdueCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {overdueCount > 0 ? <AlertTriangle className="h-6 w-6 text-red-600" /> : <CheckCircle className="h-6 w-6 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Due This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{alerts.thisWeek.length}</p>
                <p className="text-xs text-amber-500 mt-1">payments</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-6 w-6 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Payment Alerts */}
      {(() => {
        const allEmployees = [...alerts.overdue, ...alerts.today, ...alerts.thisWeek, ...alerts.upcoming, ...alerts.later];
        if (allEmployees.length === 0) return null;
        return (
          <Card className="border-amber-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Upcoming Salary Payments
                </CardTitle>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {allEmployees.length} employee{allEmployees.length > 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allEmployees.map((emp: any) => (
                  <div
                    key={emp.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                      emp.daysLeft < 0 ? 'bg-red-50 border-red-200'
                      : emp.daysLeft === 0 ? 'bg-red-50 border-red-200'
                      : emp.daysLeft <= 2 ? 'bg-orange-50 border-orange-200'
                      : emp.daysLeft <= 7 ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        emp.daysLeft < 0 ? 'bg-red-500' : emp.daysLeft === 0 ? 'bg-red-500' : emp.daysLeft <= 2 ? 'bg-orange-500' : emp.daysLeft <= 7 ? 'bg-amber-500' : 'bg-gray-400'
                      }`}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Cycle ends: {format(new Date(emp.salaryCycle.end), 'dd/MM/yyyy')}
                          {emp.daysLeft < 0 && <span className="text-red-600 font-bold ml-1">• {Math.abs(emp.daysLeft)}j en retard!</span>}
                          {emp.daysLeft === 0 && <span className="text-red-600 font-bold ml-1">• AUJOURD'HUI!</span>}
                          {emp.daysLeft === 1 && <span className="text-orange-600 font-semibold ml-1">• Demain</span>}
                          {emp.daysLeft > 1 && <span className="text-amber-600 ml-1">• {emp.daysLeft}j restants</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Salaire</p>
                        <p className="text-sm font-bold text-gray-800">{formatCurrency(emp.monthlySalary)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Acomptes</p>
                        <p className="text-sm font-bold text-red-600">-{formatCurrency(emp.totalAllowances)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Reste</p>
                        <p className={`text-sm font-bold ${emp.remainingSalary > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatCurrency(emp.remainingSalary)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Taux/jour</p>
                        <p className="text-sm font-bold text-blue-600">{formatCurrency(emp.dailyRate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Filters + Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  Filter Allowances
                </CardTitle>
                {(filterEmployeeId || filterStartDate || filterEndDate) && (
                  <button onClick={handleClearFilters} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
                  <select
                    value={filterEmployeeId}
                    onChange={(e) => setFilterEmployeeId(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleSetCurrentMonth}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition">
                  Ce mois
                </button>
                <button onClick={handleSetLastMonth}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition">
                  Mois dernier
                </button>
                <span className="ml-auto text-xs text-gray-500">
                  {allowances.length} acompte{allowances.length !== 1 ? 's' : ''} · {formatCurrency(totalAllowancesAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Allowances Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                Allowances History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Cards */}
              <div className="block md:hidden p-4 space-y-3">
                {allowances.map((allowance) => (
                  <div key={allowance.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {allowance.employee?.firstName?.[0]}{allowance.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{allowance.employee?.firstName} {allowance.employee?.lastName}</p>
                          <p className="text-xs text-gray-500">{format(new Date(allowance.date), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>
                      <span className="text-base font-bold text-orange-600">{formatCurrency(allowance.amount)}</span>
                    </div>
                    {allowance.description && (
                      <p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded px-2 py-1">{allowance.description}</p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => printAllowance(allowance)}
                        className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition">
                        <Printer className="h-3 w-3" /> Imprimer
                      </button>
                      <button onClick={() => handleEdit(allowance)}
                        className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition">
                        <Edit2 className="h-3 w-3" /> Modifier
                      </button>
                      <button onClick={() => handleDelete(allowance.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {allowances.length === 0 && (
                  <div className="text-center py-10">
                    <Banknote className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun acompte trouvé</p>
                  </div>
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {allowances.map((allowance) => (
                      <tr key={allowance.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {allowance.employee?.firstName?.[0]}{allowance.employee?.lastName?.[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {allowance.employee?.firstName} {allowance.employee?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(allowance.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-bold">
                            {formatCurrency(allowance.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                          {allowance.description || <span className="text-gray-300 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => printAllowance(allowance)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Imprimer">
                              <Printer className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleEdit(allowance)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(allowance.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allowances.length === 0 && (
                  <div className="text-center py-12">
                    <Banknote className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun acompte trouvé</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {(filterEmployeeId || filterStartDate || filterEndDate) ? 'Modifiez les filtres.' : 'Ajoutez le premier acompte.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Salary Info Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-blue-500" />
                Salary Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              {!selectedEmployee && (
                <div className="text-center py-8">
                  <UserCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Select an employee to view salary details</p>
                </div>
              )}

              {selectedEmployee && !salaryInfo && (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              )}

              {salaryInfo && (
                <div className="space-y-3">
                  {/* Current Cycle */}
                  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
                    <div className="px-3 py-2 bg-blue-600">
                      <p className="text-xs font-bold text-white uppercase tracking-wide">Current Cycle</p>
                      {salaryInfo.salaryCycle && (
                        <p className="text-[10px] text-blue-100 mt-0.5">
                          {format(new Date(salaryInfo.salaryCycle.start), 'dd/MM')} – {format(new Date(salaryInfo.salaryCycle.end), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Salaire mensuel</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(salaryInfo.employee.monthlySalary)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Acomptes versés</span>
                        <span className="text-sm font-semibold text-red-600">-{formatCurrency(salaryInfo.totalAllowances)}</span>
                      </div>
                      <div className="h-px bg-blue-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">Reste à payer</span>
                        <span className={`text-base font-bold ${salaryInfo.remainingSalary > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatCurrency(salaryInfo.remainingSalary)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      {salaryInfo.employee.monthlySalary > 0 && (
                        <div className="mt-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-400 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (salaryInfo.totalAllowances / salaryInfo.employee.monthlySalary) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 text-right">
                            {Math.round((salaryInfo.totalAllowances / salaryInfo.employee.monthlySalary) * 100)}% avancé
                          </p>
                        </div>
                      )}
                    </div>
                    {salaryInfo.allowances.length > 0 && (
                      <div className="px-3 pb-3">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                          Détail ({salaryInfo.allowances.length})
                        </div>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {salaryInfo.allowances.map((a) => (
                            <div key={a.id} className="flex justify-between text-xs bg-white rounded px-2 py-1 border border-gray-100">
                              <span className="text-gray-500 truncate max-w-[120px]">{format(new Date(a.date), 'dd/MM')} · {a.description || 'Acompte'}</span>
                              <span className="font-medium text-gray-700 ml-1 flex-shrink-0">{formatCurrency(a.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Last Month */}
                  {lastMonthSalaryInfo && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                      <div className="px-3 py-2 bg-gray-600">
                        <p className="text-xs font-bold text-white uppercase tracking-wide">Last Month</p>
                        {lastMonthSalaryInfo.salaryCycle && (
                          <p className="text-[10px] text-gray-300 mt-0.5">
                            {format(new Date(lastMonthSalaryInfo.salaryCycle.start), 'dd/MM')} – {format(new Date(lastMonthSalaryInfo.salaryCycle.end), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Salaire mensuel</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(lastMonthSalaryInfo.employee.monthlySalary)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Acomptes versés</span>
                          <span className="text-sm font-semibold text-red-600">-{formatCurrency(lastMonthSalaryInfo.totalAllowances)}</span>
                        </div>
                        <div className="h-px bg-gray-200" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-700">Reste à payer</span>
                          <span className={`text-base font-bold ${lastMonthSalaryInfo.remainingSalary > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {formatCurrency(lastMonthSalaryInfo.remainingSalary)}
                          </span>
                        </div>
                      </div>
                      {lastMonthSalaryInfo.allowances.length > 0 && (
                        <div className="px-3 pb-3">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                            Détail ({lastMonthSalaryInfo.allowances.length})
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {lastMonthSalaryInfo.allowances.map((a) => (
                              <div key={a.id} className="flex justify-between text-xs bg-white rounded px-2 py-1 border border-gray-100">
                                <span className="text-gray-500 truncate max-w-[120px]">{format(new Date(a.date), 'dd/MM')} · {a.description || 'Acompte'}</span>
                                <span className="font-medium text-gray-700 ml-1 flex-shrink-0">{formatCurrency(a.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Allowance Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader onClose={resetForm}>
            <DialogTitle>
              {editingAllowance ? 'Edit Allowance' : 'New Allowance'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
              <select
                required
                disabled={!!editingAllowance}
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — {formatCurrency(emp.monthlySalary)}/mois
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" required value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" step="0.01" required min="0.01" value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2} placeholder="Motif de l'acompte..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caisse (Money Box) *</label>
              <select
                required
                value={formMoneyBoxId}
                onChange={(e) => setFormMoneyBoxId(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une caisse...</option>
                {moneyBoxes.map(box => (
                  <option key={box.id} value={box.id}>
                    {box.name} — {formatCurrency(box.currentBalance)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" type="button" onClick={resetForm} className="flex-1">Annuler</Button>
              <Button type="submit" className="flex-1">
                {editingAllowance ? <><Edit2 className="h-4 w-4 mr-1" />Modifier</> : <><Plus className="h-4 w-4 mr-1" />Créer</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryAllowances;
