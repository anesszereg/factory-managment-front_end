import React, { useState, useEffect } from 'react';
import { salaryAllowancesApi, employeesApi } from '../services/api';
import { SalaryAllowance, Employee, EmployeeStatus, EmployeeSalaryInfo } from '../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const SalaryAllowances: React.FC = () => {
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<SalaryAllowance | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [salaryInfo, setSalaryInfo] = useState<EmployeeSalaryInfo | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchAllowances();
  }, [filterEmployeeId, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchSalaryInfo(selectedEmployee);
    }
  }, [selectedEmployee]);

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

  const fetchSalaryInfo = async (employeeId: number) => {
    try {
      const response = await employeesApi.getSalaryInfo(employeeId);
      setSalaryInfo(response.data);
    } catch (error) {
      console.error('Error fetching salary info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAllowance) {
        await salaryAllowancesApi.update(editingAllowance.id, {
          date: formData.date,
          amount: parseFloat(formData.amount),
          description: formData.description
        });
      } else {
        await salaryAllowancesApi.create({
          employeeId: parseInt(formData.employeeId),
          date: formData.date,
          amount: parseFloat(formData.amount),
          description: formData.description
        });
      }
      resetForm();
      fetchAllowances();
      if (selectedEmployee) {
        fetchSalaryInfo(selectedEmployee);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving allowance');
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
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this allowance?')) {
      try {
        await salaryAllowancesApi.delete(id);
        fetchAllowances();
        if (selectedEmployee) {
          fetchSalaryInfo(selectedEmployee);
        }
      } catch (error: any) {
        alert(error.response?.data?.error || 'Error deleting allowance');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      description: ''
    });
    setEditingAllowance(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Salary Allowances</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Allowance'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Filter Allowances</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSetCurrentMonth}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm"
              >
                Current Month
              </button>
              <button
                onClick={handleSetLastMonth}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm"
              >
                Last Month
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Clear Filters
              </button>
              <div className="ml-auto text-sm text-gray-600 flex items-center">
                Showing {allowances.length} allowance{allowances.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAllowance ? 'Edit Allowance' : 'Add New Allowance'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    disabled={!!editingAllowance}
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - ${emp.monthlySalary}/month
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingAllowance ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Allowances History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                  {allowances.map((allowance) => (
                    <tr key={allowance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(allowance.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {allowance.employee?.firstName} {allowance.employee?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ${allowance.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {allowance.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(allowance)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(allowance.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allowances.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No allowances found. {(filterEmployeeId || filterStartDate || filterEndDate) ? 'Try adjusting your filters.' : 'Add your first allowance to get started.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Employee Salary Info
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Choose an employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            {salaryInfo && (
              <div className="space-y-4">
                {salaryInfo.salaryCycle && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-medium text-blue-800 mb-1">Salary Cycle Period</div>
                    <div className="text-sm text-blue-900">
                      {format(new Date(salaryInfo.salaryCycle.start), 'MMM dd, yyyy')} - {format(new Date(salaryInfo.salaryCycle.end), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Based on hire date: {format(new Date(salaryInfo.salaryCycle.start), 'do')} of each month
                    </div>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Monthly Salary</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${salaryInfo.employee.monthlySalary.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Allowances</span>
                    <span className="text-lg font-semibold text-red-600">
                      -${salaryInfo.totalAllowances.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Remaining Salary</span>
                    <span className="text-xl font-bold text-green-600">
                      ${salaryInfo.remainingSalary.toFixed(2)}
                    </span>
                  </div>
                </div>

                {salaryInfo.allowances.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Allowances in Current Cycle
                    </h3>
                    <div className="space-y-2">
                      {salaryInfo.allowances.slice(0, 5).map((allowance) => (
                        <div key={allowance.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {format(new Date(allowance.date), 'MMM dd')}
                          </span>
                          <span className="font-medium text-gray-900">
                            ${allowance.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!salaryInfo && selectedEmployee && (
              <div className="text-center py-4 text-gray-500">
                Loading salary information...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryAllowances;
