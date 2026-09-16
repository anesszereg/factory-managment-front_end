import React, { useState, useEffect } from 'react';
import { employeesApi, salaryAllowancesApi } from '../services/api';
import { Employee, SalaryAllowance } from '../types';
import { format } from 'date-fns';
import { PageLoading } from '../components/ui/Loading';
import { PrintButton } from '../components/ui/PrintButton';

const FicheDePaie: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesApi.getAll({ status: 'ACTIVE' as any });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryInfo = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoadingSalary(true);
      const [monthStart, monthEnd] = getMonthRange(selectedMonth);
      
      const response = await salaryAllowancesApi.getAll({
        employeeId: selectedEmployee.id,
        startDate: monthStart,
        endDate: monthEnd
      });
      
      setAllowances(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error fetching salary info:', error);
    } finally {
      setLoadingSalary(false);
    }
  };

  const getMonthRange = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return [
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    ];
  };

  const calculateTotalAllowances = () => {
    return allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' DA';
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const printFiche = () => {
    const printContent = document.getElementById('fiche-de-paie-preview');
    if (!printContent) return;

    // Create print-specific styles
    const printStyles = `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .fiche-de-paie-print {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm;
          margin: 0 auto;
          box-sizing: border-box;
          page-break-after: always;
        }
        .fiche-de-paie-print * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    const originalContents = document.body.innerHTML;
    const printHTML = `
      <div class="fiche-de-paie-print">
        ${printContent.innerHTML}
      </div>
    `;
    
    document.body.innerHTML = printHTML;
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContents;
    document.head.removeChild(styleElement);
    window.location.reload();
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Fiche de Paie</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employé
            </label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === Number(e.target.value));
                setSelectedEmployee(employee || null);
                setShowPreview(false);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setShowPreview(false);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchSalaryInfo}
              disabled={!selectedEmployee || loadingSalary}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loadingSalary ? 'Chargement...' : 'Générer Fiche'}
            </button>
          </div>
        </div>
      </div>

      {showPreview && selectedEmployee && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Aperçu de la Fiche de Paie</h2>
            <PrintButton onClick={printFiche} showLabel />
          </div>

          <div 
            id="fiche-de-paie-preview" 
            className="border-2 border-gray-300 p-8 bg-white fiche-de-paie-print"
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              padding: '15mm',
              margin: '0 auto',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-800 mb-1">LUNE SANITAIRE</h1>
              <p className="text-xs text-gray-600 mb-1">
                Adresse : cite ouled larbi 02 gp local 01 khemis el khechna
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Tél. : 0549 20 55 54 / 0540 29 49 35
              </p>
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <p className="text-xs text-gray-500">N° RIB : [À compléter]</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-gray-800">FICHE DE PAIE</h2>
                </div>
              </div>
            </div>

            {/* Employee and Period Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border p-3 rounded">
                <h3 className="font-bold text-gray-800 mb-2 border-b pb-1 text-sm">EMPLOYEUR</h3>
                <p className="font-semibold text-gray-800 text-sm">LUNE SANITAIRE</p>
                <p className="text-xs text-gray-600">
                  Adresse : cite ouled larbi 02 gp local 01 khemis el khechna
                </p>
                <p className="text-xs text-gray-600">
                  Téléphone : 0549 20 55 54 / 0540 29 49 35
                </p>
              </div>

              <div className="border p-3 rounded">
                <h3 className="font-bold text-gray-800 mb-2 border-b pb-1 text-sm">SALARIÉ(E)</h3>
                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-gray-600">Nom et prénom : </span>
                    <span className="font-semibold text-sm">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Fonction : </span>
                    <span className="text-xs">____________________________</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Matricule : </span>
                    <span className="text-xs">____________________________</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Adresse : </span>
                    <span className="text-xs">{selectedEmployee.address || '____________________________'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Info */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
              <div>
                <span className="text-gray-600">N° : </span>
                <span className="border-b inline-block w-24">________</span>
              </div>
              <div>
                <span className="text-gray-600">Période : </span>
                <span className="font-semibold">{getMonthName(selectedMonth)}</span>
              </div>
              <div>
                <span className="text-gray-600">Date : </span>
                <span className="border-b inline-block w-24">{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>

            {/* Salary Details Table */}
            <div className="mb-4">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">Désignation</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Date</th>
                    <th className="border border-gray-300 px-2 py-1 text-right">Montant (DA)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">
                      Salaire de base
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {format(new Date(selectedMonth + '-01'), 'dd/MM/yyyy')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {formatCurrency(selectedEmployee.monthlySalary)}
                    </td>
                  </tr>
                  
                  {allowances
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((allowance) => (
                    <tr key={allowance.id}>
                      <td className="border border-gray-300 px-2 py-1">
                        {allowance.description || `Allocation du ${format(new Date(allowance.date), 'dd/MM/yyyy')}`}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {format(new Date(allowance.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right">
                        {formatCurrency(allowance.amount)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows for additional entries */}
                  {[...Array(Math.max(0, 12 - allowances.length))].map((_, index) => (
                    <tr key={`empty-${index}`}>
                      <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">&nbsp;</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-4">
              <div className="w-48">
                <div className="flex justify-between py-1 border-b text-sm">
                  <span className="font-semibold">Salaire de base :</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedEmployee.monthlySalary)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b text-sm">
                  <span className="font-semibold">Total allocations :</span>
                  <span className="font-semibold">
                    {formatCurrency(calculateTotalAllowances())}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b-2 border-gray-800">
                  <span className="font-bold">NET À PAYER :</span>
                  <span className="font-bold">
                    {formatCurrency(selectedEmployee.monthlySalary + calculateTotalAllowances())}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-700 mb-4 text-center">
                Arrêtée la présente fiche de paie au montant de : 
                <span className="font-semibold border-b inline-block mx-2 min-w-32">
                  {new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    .format(selectedEmployee.monthlySalary + calculateTotalAllowances())} dinars algériens
                </span>
              </p>
              
              <div className="flex justify-between mt-8">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Signature / Cachet :</p>
                  <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Signature du salarié :</p>
                  <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
              </div>
              
              <p className="text-right text-xs text-gray-500 mt-4">1 / 1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FicheDePaie;
