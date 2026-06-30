import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Users, Receipt, DollarSign, Calendar, Edit2, Trash2, Printer, X, CreditCard, Eye, Download, Search, UserCircle, TrendingUp, Wallet, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { printDocument } from '../lib/print';
import { pieceWorkersApi, dailyPieceReceiptsApi } from '../services/api';
import { PieceWorker, PieceWorkerStatus, DailyPieceReceipt, PaymentStatus } from '../types';
import { Textarea } from '../components/ui/Textarea';

interface ReceiptItemForm {
  itemName: string;
  quantity: number;
  pricePerPiece: number;
}
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { PageLoading } from '../components/ui/Loading';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DZ';
};

export default function PieceWorkers() {
  const [workers, setWorkers] = useState<PieceWorker[]>([]);
  const [receipts, setReceipts] = useState<DailyPieceReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<PieceWorker | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<DailyPieceReceipt | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<PieceWorker | null>(null);
  const [filterStatus, setFilterStatus] = useState<PieceWorkerStatus | ''>('');
  const [filterWorkerId, setFilterWorkerId] = useState<number | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');

  const [workerFormData, setWorkerFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    pricePerPiece: 0,
    status: PieceWorkerStatus.ACTIVE,
  });

  const [receiptFormData, setReceiptFormData] = useState({
    pieceWorkerId: 0,
    date: new Date().toISOString().split('T')[0],
    items: [{ itemName: '', quantity: 0, pricePerPiece: 0 }] as ReceiptItemForm[],
    paidAmount: 0,
    notes: '',
    createExpense: true,
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCreateExpense, setPaymentCreateExpense] = useState(true);
  const [showWorkerSummary, setShowWorkerSummary] = useState(false);
  const [summaryWorker, setSummaryWorker] = useState<PieceWorker | null>(null);
  const [showWorkerPaymentDialog, setShowWorkerPaymentDialog] = useState(false);
  const [workerPaymentAmount, setWorkerPaymentAmount] = useState(0);
  const [workerPaymentCreateExpense, setWorkerPaymentCreateExpense] = useState(true);
  const [lastWorkerPayment, setLastWorkerPayment] = useState<{
    worker: PieceWorker;
    amount: number;
    date: Date;
    previousBalance: number;
    newBalance: number;
    paidReceipts: { id: number; amount: number }[];
  } | null>(null);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  useEffect(() => {
    fetchReceipts();
  }, [filterWorkerId, filterStartDate, filterEndDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workersRes, receiptsRes] = await Promise.all([
        pieceWorkersApi.getAll(filterStatus ? { status: filterStatus } : undefined),
        dailyPieceReceiptsApi.getAll(),
      ]);
      setWorkers(workersRes.data);
      setReceipts(receiptsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      const filters: { pieceWorkerId?: number; startDate?: string; endDate?: string } = {};
      if (filterWorkerId) filters.pieceWorkerId = filterWorkerId;
      if (filterStartDate) filters.startDate = filterStartDate;
      if (filterEndDate) filters.endDate = filterEndDate;
      
      const res = await dailyPieceReceiptsApi.getAll(Object.keys(filters).length > 0 ? filters : undefined);
      setReceipts(res.data);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    }
  };

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingWorker ? 'Updating worker...' : 'Adding worker...');
    
    try {
      if (editingWorker) {
        await pieceWorkersApi.update(editingWorker.id, workerFormData);
        toast.success('Worker updated successfully', { id: loadingToast });
      } else {
        await pieceWorkersApi.create(workerFormData);
        toast.success('Worker added successfully', { id: loadingToast });
      }
      resetWorkerForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save worker', { id: loadingToast });
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingReceipt ? 'Updating receipt...' : 'Creating receipt...');
    
    try {
      // Filter out empty items
      const validItems = receiptFormData.items.filter(item => item.itemName && item.quantity > 0);
      
      if (validItems.length === 0) {
        toast.error('Please add at least one item', { id: loadingToast });
        return;
      }
      
      const data = {
        pieceWorkerId: receiptFormData.pieceWorkerId,
        date: receiptFormData.date,
        items: validItems,
        paidAmount: receiptFormData.paidAmount,
        notes: receiptFormData.notes,
        createExpense: receiptFormData.createExpense,
      };
      
      if (editingReceipt) {
        await dailyPieceReceiptsApi.update(editingReceipt.id, data);
        toast.success('Receipt updated successfully', { id: loadingToast });
      } else {
        await dailyPieceReceiptsApi.create(data);
        toast.success('Receipt created successfully', { id: loadingToast });
      }
      resetReceiptForm();
      fetchReceipts();
    } catch (error) {
      toast.error('Failed to save receipt', { id: loadingToast });
    }
  };

  const handleAddPayment = async () => {
    if (!paymentReceiptId || paymentAmount <= 0) return;
    
    const loadingToast = toast.loading('Adding payment...');
    try {
      await dailyPieceReceiptsApi.addPayment(paymentReceiptId, paymentAmount, paymentCreateExpense);
      toast.success('Payment added successfully', { id: loadingToast });
      setShowPaymentDialog(false);
      setPaymentReceiptId(null);
      setPaymentAmount(0);
      setPaymentCreateExpense(true);
      fetchReceipts();
    } catch (error) {
      toast.error('Failed to add payment', { id: loadingToast });
    }
  };

  const openPaymentDialog = (receiptId: number) => {
    setPaymentReceiptId(receiptId);
    setPaymentAmount(0);
    setShowPaymentDialog(true);
  };

  const openWorkerSummary = (worker: PieceWorker) => {
    setSummaryWorker(worker);
    setShowWorkerSummary(true);
  };

  // Get receipts for the summary worker, applying date filters
  const getWorkerReceipts = () => {
    if (!summaryWorker) return [];
    return receipts.filter(r => {
      if (r.pieceWorkerId !== summaryWorker.id) return false;
      if (filterStartDate && new Date(r.date) < new Date(filterStartDate)) return false;
      if (filterEndDate && new Date(r.date) > new Date(filterEndDate)) return false;
      return true;
    });
  };

  const getWorkerSummaryStats = () => {
    const workerReceipts = getWorkerReceipts();
    const totalAmount = workerReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPaid = workerReceipts.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalRemaining = totalAmount - totalPaid;
    const paidCount = workerReceipts.filter(r => r.paymentStatus === PaymentStatus.PAID).length;
    const partPaidCount = workerReceipts.filter(r => r.paymentStatus === PaymentStatus.PART_PAID).length;
    const notPaidCount = workerReceipts.filter(r => r.paymentStatus === PaymentStatus.NOT_PAID).length;
    
    return {
      receipts: workerReceipts,
      totalReceipts: workerReceipts.length,
      totalAmount,
      totalPaid,
      totalRemaining,
      paidCount,
      partPaidCount,
      notPaidCount,
    };
  };

  // Get selected worker's balance calculations
  const getSelectedWorkerBalance = () => {
    if (!selectedWorker) return { totalAmount: 0, totalPaid: 0, totalRemaining: 0, unpaidReceipts: [] };
    
    const workerReceipts = receipts.filter(r => r.pieceWorkerId === selectedWorker.id);
    const unpaidReceipts = workerReceipts.filter(r => r.paymentStatus !== PaymentStatus.PAID);
    const totalAmount = workerReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPaid = workerReceipts.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalRemaining = totalAmount - totalPaid;
    
    return { totalAmount, totalPaid, totalRemaining, unpaidReceipts };
  };

  // Open worker payment dialog
  const openWorkerPayment = () => {
    if (!selectedWorker) {
      toast.error('Please select a worker first');
      return;
    }
    const balance = getSelectedWorkerBalance();
    if (balance.totalRemaining <= 0) {
      toast.error('This worker has no outstanding balance');
      return;
    }
    setWorkerPaymentAmount(0);
    setShowWorkerPaymentDialog(true);
  };

  // Handle worker payment - distributes payment across unpaid receipts
  const handleWorkerPayment = async () => {
    if (!selectedWorker || workerPaymentAmount <= 0) return;
    
    const balance = getSelectedWorkerBalance();
    if (workerPaymentAmount > balance.totalRemaining) {
      toast.error(`Payment amount exceeds remaining balance of ${formatCurrency(balance.totalRemaining)}`);
      return;
    }

    const loadingToast = toast.loading('Processing payment...');
    
    try {
      let remainingPayment = workerPaymentAmount;
      const paidReceipts: { id: number; amount: number }[] = [];
      
      // Sort unpaid receipts by date (oldest first)
      const sortedUnpaid = [...balance.unpaidReceipts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Distribute payment across receipts
      for (const receipt of sortedUnpaid) {
        if (remainingPayment <= 0) break;
        
        const receiptRemaining = receipt.totalAmount - receipt.paidAmount;
        const paymentForReceipt = Math.min(remainingPayment, receiptRemaining);
        
        if (paymentForReceipt > 0) {
          await dailyPieceReceiptsApi.addPayment(receipt.id, paymentForReceipt, workerPaymentCreateExpense);
          paidReceipts.push({ id: receipt.id, amount: paymentForReceipt });
          remainingPayment -= paymentForReceipt;
        }
      }
      
      // Store payment info for receipt
      setLastWorkerPayment({
        worker: selectedWorker,
        amount: workerPaymentAmount,
        date: new Date(),
        previousBalance: balance.totalRemaining,
        newBalance: balance.totalRemaining - workerPaymentAmount,
        paidReceipts,
      });
      
      toast.success('Payment processed successfully', { id: loadingToast });
      setShowWorkerPaymentDialog(false);
      setWorkerPaymentCreateExpense(true);
      setShowPaymentReceipt(true);
      fetchReceipts();
    } catch (error) {
      toast.error('Failed to process payment', { id: loadingToast });
    }
  };

  // Print worker payment receipt
  const printWorkerPaymentReceipt = () => {
    if (!lastWorkerPayment) return;
    
    const { worker, amount, date, previousBalance, newBalance, paidReceipts } = lastWorkerPayment;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt - ${worker.firstName} ${worker.lastName}</title>
            <style>
              @page { size: A4; margin: 0; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 11px;
                display: flex;
                justify-content: flex-end;
                align-items: flex-start;
              }
              .receipt-container {
                width: 80mm;
                padding: 5mm;
                line-height: 1.4;
                border: 2px solid #000;
                margin: 5mm;
              }
              .title {
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 3mm;
                border-bottom: 2px solid #000;
                padding-bottom: 2mm;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin: 1.5mm 0;
              }
              .section {
                margin: 3mm 0;
                padding: 2mm 0;
                border-top: 1px dashed #000;
              }
              .amount-box {
                background: #f0f0f0;
                padding: 3mm;
                text-align: center;
                margin: 3mm 0;
                border: 1px solid #000;
              }
              .amount-value {
                font-size: 16px;
                font-weight: bold;
              }
              .balance-row {
                display: flex;
                justify-content: space-between;
                padding: 1mm 0;
              }
              .balance-row.highlight {
                font-weight: bold;
                font-size: 12px;
              }
              .footer {
                text-align: center;
                font-size: 9px;
                margin-top: 4mm;
                padding-top: 2mm;
                border-top: 1px dashed #000;
                color: #666;
              }
              @media print { 
                body { 
                  display: flex;
                  justify-content: flex-end;
                  align-items: flex-start;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="title">REÇU DE PAIEMENT</div>
              
              <div class="info-row">
                <span>Date:</span>
                <span>${format(date, 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div class="info-row">
                <span>Travailleur:</span>
                <span>${worker.firstName} ${worker.lastName}</span>
              </div>
              
              <div class="amount-box">
                <div>Montant Payé</div>
                <div class="amount-value">${formatCurrency(amount)}</div>
              </div>
              
              <div class="section">
                <div class="balance-row">
                  <span>Solde Précédent:</span>
                  <span>${formatCurrency(previousBalance)}</span>
                </div>
                <div class="balance-row">
                  <span>Paiement:</span>
                  <span>- ${formatCurrency(amount)}</span>
                </div>
                <div class="balance-row highlight">
                  <span>Nouveau Solde:</span>
                  <span>${formatCurrency(newBalance)}</span>
                </div>
              </div>
              
              <div class="section">
                <div style="font-weight: bold; margin-bottom: 2mm;">Bons Payés (${paidReceipts.length}):</div>
                ${paidReceipts.map(pr => `
                  <div class="info-row" style="font-size: 9px;">
                    <span>Bon #${pr.id}</span>
                    <span>${formatCurrency(pr.amount)}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="footer">
                <p>Merci pour votre travail</p>
                <p>Imprimé le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printWorker = (worker: PieceWorker) => {
    printDocument({
      title: 'Piece Worker Profile',
      subtitle: `#${worker.id}`,
      fields: [
        { label: 'Name', value: `${worker.firstName} ${worker.lastName}` },
        { label: 'Phone', value: worker.phone || '-' },
        { label: 'Price Per Piece', value: formatCurrency(worker.pricePerPiece) },
        { label: 'Status', value: worker.status },
      ],
    });
  };

  const printWorkerSummary = () => {
    if (!summaryWorker) return;
    const stats = getWorkerSummaryStats();
    
    const itemsHtml = stats.receipts.map(receipt => `
      <tr>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${format(new Date(receipt.date), 'dd/MM/yyyy')}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${receipt.items?.map(item => `${item.itemName} (${item.quantity}×${formatCurrency(item.pricePerPiece)})`).join(', ') || '-'}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(receipt.totalAmount)}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(receipt.paidAmount)}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(receipt.totalAmount - receipt.paidAmount)}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: center;">${getPaymentStatusLabel(receipt.paymentStatus)}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Summary - ${summaryWorker.firstName} ${summaryWorker.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { font-size: 18px; margin: 0; }
              .header p { font-size: 12px; color: #666; margin: 5px 0; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 10px; background: #f5f5f5; }
              .stat { text-align: center; }
              .stat-label { font-size: 10px; color: #666; }
              .stat-value { font-size: 16px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background: #f0f0f0; padding: 6px 8px; text-align: left; font-size: 10px; }
              .footer { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; }
              .footer-row { display: flex; justify-content: space-between; font-weight: bold; }
              @media print { body { padding: 10px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${summaryWorker.firstName} ${summaryWorker.lastName}</h1>
              <p>Receipt Summary Report</p>
              ${filterStartDate || filterEndDate ? `<p>Period: ${filterStartDate ? format(new Date(filterStartDate), 'dd/MM/yyyy') : 'Start'} - ${filterEndDate ? format(new Date(filterEndDate), 'dd/MM/yyyy') : 'End'}</p>` : ''}
            </div>
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Total Receipts</div>
                <div class="stat-value">${stats.totalReceipts}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Total Amount</div>
                <div class="stat-value" style="color: green;">${formatCurrency(stats.totalAmount)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Total Paid</div>
                <div class="stat-value" style="color: blue;">${formatCurrency(stats.totalPaid)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Remaining</div>
                <div class="stat-value" style="color: red;">${formatCurrency(stats.totalRemaining)}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th style="text-align: right;">Total</th>
                  <th style="text-align: right;">Paid</th>
                  <th style="text-align: right;">Remaining</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="footer">
              <div class="footer-row">
                <span>GRAND TOTAL</span>
                <span>Total: ${formatCurrency(stats.totalAmount)} | Paid: ${formatCurrency(stats.totalPaid)} | Remaining: ${formatCurrency(stats.totalRemaining)}</span>
              </div>
            </div>
            <p style="text-align: center; font-size: 10px; color: #999; margin-top: 20px;">
              Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportWorkerSummaryToExcel = () => {
    if (!summaryWorker) return;
    const stats = getWorkerSummaryStats();

    const exportData = stats.receipts.map(receipt => ({
      'Date': format(new Date(receipt.date), 'dd/MM/yyyy'),
      'Items': receipt.items?.map(item => `${item.itemName} (${item.quantity}×${item.pricePerPiece})`).join(', ') || '-',
      'Total Amount': receipt.totalAmount,
      'Paid Amount': receipt.paidAmount,
      'Remaining': receipt.totalAmount - receipt.paidAmount,
      'Status': getPaymentStatusLabel(receipt.paymentStatus),
    }));

    // Add summary row
    exportData.push({
      'Date': 'TOTAL',
      'Items': `${stats.totalReceipts} receipts`,
      'Total Amount': stats.totalAmount,
      'Paid Amount': stats.totalPaid,
      'Remaining': stats.totalRemaining,
      'Status': `${stats.paidCount} Paid, ${stats.partPaidCount} Part, ${stats.notPaidCount} Not Paid`,
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    const dateRange = filterStartDate || filterEndDate 
      ? `_${filterStartDate || 'start'}_to_${filterEndDate || 'end'}` 
      : '';
    const fileName = `${summaryWorker.firstName}_${summaryWorker.lastName}_summary${dateRange}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel file exported successfully');
  };

  const handleDeleteWorker = async (id: number) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    
    const loadingToast = toast.loading('Deleting worker...');
    try {
      await pieceWorkersApi.delete(id);
      toast.success('Worker deleted successfully', { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error('Failed to delete worker', { id: loadingToast });
    }
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;
    
    const loadingToast = toast.loading('Deleting receipt...');
    try {
      await dailyPieceReceiptsApi.delete(id);
      toast.success('Receipt deleted successfully', { id: loadingToast });
      fetchReceipts();
    } catch (error) {
      toast.error('Failed to delete receipt', { id: loadingToast });
    }
  };

  const handleEditWorker = (worker: PieceWorker) => {
    setEditingWorker(worker);
    setWorkerFormData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      phone: worker.phone || '',
      pricePerPiece: worker.pricePerPiece,
      status: worker.status,
    });
    setShowWorkerForm(true);
  };

  const handleEditReceipt = (receipt: DailyPieceReceipt) => {
    setEditingReceipt(receipt);
    setReceiptFormData({
      pieceWorkerId: receipt.pieceWorkerId,
      date: receipt.date.split('T')[0],
      items: receipt.items?.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        pricePerPiece: item.pricePerPiece,
      })) || [{ itemName: '', quantity: 0, pricePerPiece: 0 }],
      paidAmount: receipt.paidAmount,
      notes: receipt.notes || '',
      createExpense: !!receipt.expenseId,
    });
    setShowReceiptForm(true);
  };

  const resetWorkerForm = () => {
    setWorkerFormData({
      firstName: '',
      lastName: '',
      phone: '',
      pricePerPiece: 0,
      status: PieceWorkerStatus.ACTIVE,
    });
    setEditingWorker(null);
    setShowWorkerForm(false);
  };

  const resetReceiptForm = () => {
    setReceiptFormData({
      pieceWorkerId: 0,
      date: new Date().toISOString().split('T')[0],
      items: [{ itemName: '', quantity: 0, pricePerPiece: 0 }],
      paidAmount: 0,
      notes: '',
      createExpense: true,
    });
    setEditingReceipt(null);
    setShowReceiptForm(false);
  };

  const openNewReceipt = (worker?: PieceWorker) => {
    setEditingReceipt(null);
    setReceiptFormData({
      pieceWorkerId: worker?.id || 0,
      date: new Date().toISOString().split('T')[0],
      items: [{ itemName: '', quantity: 0, pricePerPiece: worker?.pricePerPiece || 0 }],
      paidAmount: 0,
      notes: '',
      createExpense: true,
    });
    setShowReceiptForm(true);
  };

  const addReceiptItem = () => {
    setReceiptFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 0, pricePerPiece: 0 }],
    }));
  };

  const removeReceiptItem = (index: number) => {
    setReceiptFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateReceiptItem = (index: number, field: keyof ReceiptItemForm, value: string | number) => {
    setReceiptFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const getReceiptTotal = () => {
    return receiptFormData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerPiece), 0);
  };

  const getInitials = (firstName: string, lastName?: string) => {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return first + last;
  };

  const getWorkerInitials = (worker: PieceWorker) => getInitials(worker.firstName, worker.lastName);

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white',
      'bg-amber-500 text-white',
      'bg-rose-500 text-white',
      'bg-cyan-500 text-white',
      'bg-indigo-500 text-white',
      'bg-orange-500 text-white',
    ];
    return colors[id % colors.length];
  };

  const searchedWorkers = workers.filter((w) => {
    const search = workerSearch.toLowerCase();
    const fullName = `${w.firstName} ${w.lastName}`.toLowerCase();
    return fullName.includes(search) || w.phone?.toLowerCase().includes(search);
  });

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.PART_PAID:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.NOT_PAID:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Paid';
      case PaymentStatus.PART_PAID:
        return 'Part Paid';
      case PaymentStatus.NOT_PAID:
        return 'Not Paid';
      default:
        return status;
    }
  };

  const printReceipt = (receipt: DailyPieceReceipt) => {
    const worker = workers.find(w => w.id === receipt.pieceWorkerId);
    const itemsHtml = receipt.items?.map(item => `
      <tr>
        <td>${item.itemName}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.pricePerPiece)}</td>
        <td class="right">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('') || '';
    
    const subTotal = receipt.totalAmount;
    const remaining = receipt.totalAmount - receipt.paidAmount;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bon #${receipt.id}</title>
            <style>
              @page { size: A4; margin: 0; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: flex-start;
              }
              .receipt-container {
                width: 80mm;
                padding: 4mm;
                line-height: 1.3;
                border: 2px solid #000;
                margin: 5mm;
              }
              .title {
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 2mm;
              }
              .info-center {
                text-align: center;
                font-size: 9px;
                margin-bottom: 1mm;
              }
              .separator {
                border-bottom: 1px dashed #000;
                margin: 2mm 0;
              }
              .ref-section {
                font-size: 9px;
                margin-bottom: 2mm;
              }
              .ref-row {
                display: flex;
                justify-content: space-between;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
                margin-bottom: 2mm;
              }
              th {
                text-align: left;
                border-bottom: 1px solid #000;
                padding: 1mm 0;
                font-size: 9px;
              }
              th.center, td.center { text-align: center; }
              th.right, td.right { text-align: right; }
              td {
                padding: 1mm 0;
                border-bottom: 1px dotted #ccc;
              }
              .totals {
                font-size: 10px;
                margin-top: 2mm;
              }
              .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5mm 0;
              }
              .totals-row.bold {
                font-weight: bold;
              }
              .totals-row.total-line {
                font-size: 12px;
                font-weight: bold;
                border-top: 1px solid #000;
                padding-top: 1mm;
                margin-top: 1mm;
              }
              .totals-row.remaining {
                color: #c00;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                font-size: 8px;
                margin-top: 3mm;
                color: #666;
              }
              @media print { 
                body { 
                  display: flex;
                  justify-content: flex-end;
                  align-items: flex-start;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
            <div class="title">BON DE TRAVAIL</div>
            <div class="info-center">Travailleur: ${worker?.firstName} ${worker?.lastName}</div>
            <div class="info-center">Date: ${format(new Date(receipt.date), 'dd/MM/yyyy HH:mm')}</div>
            
            <div class="separator"></div>
            
            <div class="ref-section">
              <div class="ref-row">
                <span>Référence: ${receipt.id}</span>
                <span>Statut: ${getPaymentStatusLabel(receipt.paymentStatus)}</span>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th class="center">Qté</th>
                  <th class="right">P.U</th>
                  <th class="right">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="totals-row">
                <span>Sous-total:</span>
                <span>${formatCurrency(subTotal)}</span>
              </div>
              <div class="totals-row total-line">
                <span>TOTAL:</span>
                <span>${formatCurrency(receipt.totalAmount)}</span>
              </div>
              <div class="totals-row">
                <span>Payé:</span>
                <span>${formatCurrency(receipt.paidAmount)}</span>
              </div>
              <div class="totals-row remaining">
                <span>Reste à payer:</span>
                <span>${formatCurrency(remaining)}</span>
              </div>
            </div>
            
            ${receipt.notes ? `<div style="font-size: 8px; margin-top: 2mm; color: #666;">Note: ${receipt.notes}</div>` : ''}
            
            <div class="footer">
              <p>Merci pour votre confiance</p>
              <p>Imprimé le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadgeClass = (status: PieceWorkerStatus) => {
    switch (status) {
      case PieceWorkerStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case PieceWorkerStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReceipts = receipts.filter(r => {
    if (filterWorkerId && r.pieceWorkerId !== filterWorkerId) return false;
    if (filterStartDate && new Date(r.date) < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(r.date) > new Date(filterEndDate)) return false;
    return true;
  });

  const todayReceipts = receipts.filter(r => r.date.split('T')[0] === new Date().toISOString().split('T')[0]);
  const totalItemsToday = todayReceipts.reduce((sum, r) => sum + (r.items?.length || 0), 0);
  const totalAmountToday = todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

  const totalAmountFiltered = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Piece Workers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage piece-rate workers and track daily receipts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
          <Button 
            className="w-full sm:w-auto" 
            variant="outline" 
            onClick={openWorkerPayment}
            disabled={!selectedWorker}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Pay Worker
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => openNewReceipt()}>
            <Receipt className="h-4 w-4 mr-2" />
            New Receipt
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => {
            setEditingWorker(null);
            setWorkerFormData({
              firstName: '',
              lastName: '',
              phone: '',
              pricePerPiece: 0,
              status: PieceWorkerStatus.ACTIVE,
            });
            setShowWorkerForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Worker
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Workers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{workers.length}</p>
                <p className="text-xs text-blue-500 mt-1">
                  {workers.filter(w => w.status === PieceWorkerStatus.ACTIVE).length} active
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalItemsToday}</p>
                <p className="text-xs text-green-500 mt-1">items completed</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Today Payout</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmountToday)}</p>
                <p className="text-xs text-orange-500 mt-1">{todayReceipts.length} receipts</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Filtered</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmountFiltered)}</p>
                <p className="text-xs text-purple-500 mt-1">{filteredReceipts.length} receipts</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Worker Snapshot */}
      {selectedWorker && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${getAvatarColor(selectedWorker.id)}`}>
                  {getWorkerInitials(selectedWorker)}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedWorker.firstName} {selectedWorker.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedWorker.phone || 'No phone'}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => printWorker(selectedWorker)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Print Worker"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedWorker.status)}`}>
                    {selectedWorker.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Balance Due</p>
                  <p className="text-xl font-bold text-red-700 mt-1">
                    {formatCurrency(getSelectedWorkerBalance().totalRemaining)}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    {getSelectedWorkerBalance().unpaidReceipts.length} unpaid
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Workers
              </CardTitle>
              <span className="text-xs font-medium text-gray-500">
                {workers.length} total
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workers..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as PieceWorkerStatus | '')}
                  className="text-sm"
                >
                  <option value="">All Status</option>
                  <option value={PieceWorkerStatus.ACTIVE}>Active</option>
                  <option value={PieceWorkerStatus.INACTIVE}>Inactive</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {searchedWorkers.map((worker) => {
                const workerReceipts = receipts.filter(r => r.pieceWorkerId === worker.id);
                const balance = workerReceipts.reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
                return (
                  <div
                    key={worker.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedWorker?.id === worker.id
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(worker.id)}`}>
                        {getWorkerInitials(worker)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-900 truncate">
                            {worker.firstName} {worker.lastName}
                          </p>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getStatusBadgeClass(worker.status)}`}>
                            {worker.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{worker.phone || 'No phone'}</p>
                        <p className="text-xs font-semibold text-green-600 mt-0.5">
                          {formatCurrency(worker.pricePerPiece)}/piece
                        </p>
                      </div>
                    </div>
                    {balance > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Balance</span>
                        <span className="text-xs font-bold text-red-600">{formatCurrency(balance)}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNewReceipt(worker);
                        }}
                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center"
                        title="New Receipt"
                      >
                        <Receipt className="h-3 w-3 mr-1" />
                        Receipt
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openWorkerSummary(worker);
                        }}
                        className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center"
                        title="Summary"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Summary
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorker(worker);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorker(worker.id);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {searchedWorkers.length === 0 && (
                <div className="text-center py-8">
                  <UserCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No workers found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                Daily Receipts
              </CardTitle>
              <span className="text-xs font-medium text-gray-500">
                {filteredReceipts.length} receipts
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {(filterWorkerId || filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterWorkerId('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  value={filterWorkerId}
                  onChange={(e) => setFilterWorkerId(e.target.value ? parseInt(e.target.value) : '')}
                >
                  <option value="">All Workers</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </Select>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">From</label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              {(filterWorkerId || filterStartDate || filterEndDate) && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total: <span className="text-green-600 font-bold">{formatCurrency(totalAmountFiltered)}</span>
                  </span>
                  <span className="text-xs text-gray-500">{filteredReceipts.length} receipts</span>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {filteredReceipts.map((receipt) => {
                const worker = workers.find(w => w.id === receipt.pieceWorkerId);
                const remaining = receipt.totalAmount - receipt.paidAmount;
                return (
                  <div key={receipt.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(receipt.pieceWorkerId)}`}>
                          {getInitials(worker?.firstName || '?', worker?.lastName)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {worker?.firstName} {worker?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(receipt.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(receipt.paymentStatus)}`}>
                        {getPaymentStatusLabel(receipt.paymentStatus)}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {receipt.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-600">
                          <span>{item.itemName}</span>
                          <span className="font-medium">{item.quantity} × {formatCurrency(item.pricePerPiece)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-green-600">Total</p>
                        <p className="font-bold text-sm text-green-700">{formatCurrency(receipt.totalAmount)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-blue-600">Paid</p>
                        <p className="font-bold text-sm text-blue-700">{formatCurrency(receipt.paidAmount)}</p>
                      </div>
                      <div className={`rounded-lg p-2 ${remaining > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${remaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>Remaining</p>
                        <p className={`font-bold text-sm ${remaining > 0 ? 'text-red-700' : 'text-gray-700'}`}>{formatCurrency(remaining)}</p>
                      </div>
                    </div>
                    {receipt.notes && (
                      <p className="text-xs text-gray-500 mb-3 italic">{receipt.notes}</p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      {receipt.paymentStatus !== PaymentStatus.PAID && (
                        <button
                          onClick={() => openPaymentDialog(receipt.id)}
                          className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => printReceipt(receipt)}
                        className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Print
                      </button>
                      <button
                        onClick={() => handleEditReceipt(receipt)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReceipt(receipt.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredReceipts.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No receipts found</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Worker</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Remaining</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => {
                    const worker = workers.find(w => w.id === receipt.pieceWorkerId);
                    const remaining = receipt.totalAmount - receipt.paidAmount;
                    return (
                      <tr key={receipt.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(receipt.pieceWorkerId)}`}>
                              {getInitials(worker?.firstName || '?', worker?.lastName)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {worker?.firstName} {worker?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(receipt.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="max-w-[200px] space-y-0.5">
                            {receipt.items?.map((item, i) => (
                              <div key={i} className="text-xs">
                                <span className="font-medium text-gray-700">{item.itemName}</span>
                                <span className="text-gray-500"> × {item.quantity} @ {formatCurrency(item.pricePerPiece)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                          {formatCurrency(receipt.totalAmount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-right">
                          {formatCurrency(receipt.paidAmount)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold text-right ${remaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(remaining)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(receipt.paymentStatus)}`}>
                            {getPaymentStatusLabel(receipt.paymentStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center justify-center gap-1">
                            {receipt.paymentStatus !== PaymentStatus.PAID && (
                              <button
                                onClick={() => openPaymentDialog(receipt.id)}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                                title="Add Payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => printReceipt(receipt)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50"
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditReceipt(receipt)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReceipt(receipt.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
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
              {filteredReceipts.length === 0 && (
                <div className="text-center py-8 bg-gray-50">
                  <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No receipts found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worker Form Dialog */}
      <Dialog open={showWorkerForm} onOpenChange={setShowWorkerForm}>
        <DialogContent>
          <DialogHeader onClose={resetWorkerForm}>
            <DialogTitle>{editingWorker ? 'Edit Worker' : 'Add New Worker'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWorkerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={workerFormData.firstName}
                onChange={(e) => setWorkerFormData({ ...workerFormData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name *"
                value={workerFormData.lastName}
                onChange={(e) => setWorkerFormData({ ...workerFormData, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Phone"
              value={workerFormData.phone}
              onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
            />
            <Input
              label="Price per Piece *"
              type="number"
              step="0.01"
              min="0"
              value={workerFormData.pricePerPiece}
              onChange={(e) => setWorkerFormData({ ...workerFormData, pricePerPiece: parseFloat(e.target.value) || 0 })}
              required
            />
            <Select
              label="Status"
              value={workerFormData.status}
              onChange={(e) => setWorkerFormData({ ...workerFormData, status: e.target.value as PieceWorkerStatus })}
            >
              <option value={PieceWorkerStatus.ACTIVE}>Active</option>
              <option value={PieceWorkerStatus.INACTIVE}>Inactive</option>
            </Select>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetWorkerForm}>
                Cancel
              </Button>
              <Button type="submit">{editingWorker ? 'Update Worker' : 'Add Worker'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Form Dialog */}
      <Dialog open={showReceiptForm} onOpenChange={setShowReceiptForm}>
        <DialogContent className="max-w-3xl w-full sm:w-[90vw]">
          <DialogHeader onClose={resetReceiptForm}>
            <DialogTitle>{editingReceipt ? 'Edit Receipt' : 'Create Daily Receipt'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReceiptSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Worker *"
                value={receiptFormData.pieceWorkerId}
                onChange={(e) => {
                  const workerId = parseInt(e.target.value);
                  const worker = workers.find(w => w.id === workerId);
                  setReceiptFormData({
                    ...receiptFormData,
                    pieceWorkerId: workerId,
                    items: receiptFormData.items.map(item => ({
                      ...item,
                      pricePerPiece: item.pricePerPiece || worker?.pricePerPiece || 0,
                    })),
                  });
                }}
                required
              >
                <option value={0}>Select a worker</option>
                {workers.filter(w => w.status === PieceWorkerStatus.ACTIVE).map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.firstName} {worker.lastName} ({formatCurrency(worker.pricePerPiece)}/piece)
                  </option>
                ))}
              </Select>
              <Input
                label="Date *"
                type="date"
                value={receiptFormData.date}
                onChange={(e) => setReceiptFormData({ ...receiptFormData, date: e.target.value })}
                required
              />
            </div>

            {/* Items Section */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Items</h3>
                <Button type="button" size="sm" variant="outline" onClick={addReceiptItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {receiptFormData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input
                        label={index === 0 ? "Item Name *" : undefined}
                        placeholder="Item name"
                        value={item.itemName}
                        onChange={(e) => updateReceiptItem(index, 'itemName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label={index === 0 ? "Qty *" : undefined}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => updateReceiptItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        label={index === 0 ? "Price *" : undefined}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={item.pricePerPiece || ''}
                        onChange={(e) => updateReceiptItem(index, 'pricePerPiece', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(item.quantity * item.pricePerPiece)}
                      </span>
                      {receiptFormData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReceiptItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">Total Amount:</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(getReceiptTotal())}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <Input
                  label="Amount Paid"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receiptFormData.paidAmount || ''}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, paidAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Remaining: {formatCurrency(getReceiptTotal() - receiptFormData.paidAmount)}
                </p>
              </div>
            </div>

            <Textarea
              label="Notes"
              value={receiptFormData.notes}
              onChange={(e) => setReceiptFormData({ ...receiptFormData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createExpense"
                checked={receiptFormData.createExpense}
                onChange={(e) => setReceiptFormData({ ...receiptFormData, createExpense: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="createExpense" className="text-sm text-gray-700">
                Also record payment as expense
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetReceiptForm}>
                Cancel
              </Button>
              <Button type="submit">{editingReceipt ? 'Update Receipt' : 'Create Receipt'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader onClose={() => setShowPaymentDialog(false)}>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount || ''}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter payment amount"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paymentCreateExpense"
                checked={paymentCreateExpense}
                onChange={(e) => setPaymentCreateExpense(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="paymentCreateExpense" className="text-sm text-gray-700">
                Also record payment as expense
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Worker Summary Dialog */}
      <Dialog open={showWorkerSummary} onOpenChange={setShowWorkerSummary}>
        <DialogContent className="max-w-4xl w-full sm:w-[95vw] h-[80vh] sm:h-[85vh] flex flex-col">
          <DialogHeader onClose={() => setShowWorkerSummary(false)}>
            <DialogTitle>
              {summaryWorker ? `${summaryWorker.firstName} ${summaryWorker.lastName} - Receipt Summary` : 'Worker Summary'}
            </DialogTitle>
          </DialogHeader>
          
          {summaryWorker && (() => {
            const stats = getWorkerSummaryStats();
            return (
              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                {/* Date Filter Info */}
                {(filterStartDate || filterEndDate) && (
                  <div className="bg-blue-50 p-2 rounded-lg text-sm text-blue-700">
                    Showing receipts {filterStartDate && `from ${format(new Date(filterStartDate), 'dd/MM/yyyy')}`} 
                    {filterEndDate && ` to ${format(new Date(filterEndDate), 'dd/MM/yyyy')}`}
                  </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Total Receipts</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalReceipts}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-600">Total Amount</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Total Paid</p>
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(stats.totalPaid)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-red-600">Remaining</p>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(stats.totalRemaining)}</p>
                  </div>
                </div>

                {/* Payment Status Summary */}
                <div className="flex gap-3 text-sm">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {stats.paidCount} Paid
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {stats.partPaidCount} Part Paid
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    {stats.notPaidCount} Not Paid
                  </span>
                </div>

                {/* Receipts List */}
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.receipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {format(new Date(receipt.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {receipt.items?.map((item, i) => (
                              <div key={i} className="text-xs">
                                {item.itemName} ({item.quantity} × {formatCurrency(item.pricePerPiece)})
                              </div>
                            ))}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                            {formatCurrency(receipt.totalAmount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-blue-600 text-right whitespace-nowrap">
                            {formatCurrency(receipt.paidAmount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-red-600 text-right whitespace-nowrap">
                            {formatCurrency(receipt.totalAmount - receipt.paidAmount)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentStatusBadge(receipt.paymentStatus)}`}>
                              {getPaymentStatusLabel(receipt.paymentStatus)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 sticky bottom-0">
                      <tr className="font-bold">
                        <td className="px-3 py-2 text-sm" colSpan={2}>TOTAL</td>
                        <td className="px-3 py-2 text-sm text-right">{formatCurrency(stats.totalAmount)}</td>
                        <td className="px-3 py-2 text-sm text-blue-600 text-right">{formatCurrency(stats.totalPaid)}</td>
                        <td className="px-3 py-2 text-sm text-red-600 text-right">{formatCurrency(stats.totalRemaining)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  {stats.receipts.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No receipts found for this worker</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={printWorkerSummary}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" onClick={exportWorkerSummaryToExcel} className="text-green-600 border-green-600 hover:bg-green-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => setShowWorkerSummary(false)}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Worker Payment Dialog */}
      <Dialog open={showWorkerPaymentDialog} onOpenChange={setShowWorkerPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader onClose={() => setShowWorkerPaymentDialog(false)}>
            <DialogTitle>Pay Worker</DialogTitle>
          </DialogHeader>
          {selectedWorker && (() => {
            const balance = getSelectedWorkerBalance();
            return (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Worker</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedWorker.firstName} {selectedWorker.lastName}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-600">Total Earned</p>
                    <p className="text-sm font-bold text-green-700">{formatCurrency(balance.totalAmount)}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Total Paid</p>
                    <p className="text-sm font-bold text-blue-700">{formatCurrency(balance.totalPaid)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-red-600">Balance Due</p>
                    <p className="text-sm font-bold text-red-700">{formatCurrency(balance.totalRemaining)}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                  <p><strong>{balance.unpaidReceipts.length}</strong> unpaid receipts will be paid (oldest first)</p>
                </div>

                <Input
                  label="Payment Amount *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balance.totalRemaining}
                  value={workerPaymentAmount || ''}
                  onChange={(e) => setWorkerPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder={`Max: ${formatCurrency(balance.totalRemaining)}`}
                />

                {workerPaymentAmount > 0 && (
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Current Balance:</span>
                      <span className="font-medium">{formatCurrency(balance.totalRemaining)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Payment:</span>
                      <span className="font-medium">- {formatCurrency(workerPaymentAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                      <span>New Balance:</span>
                      <span className={balance.totalRemaining - workerPaymentAmount <= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Math.max(0, balance.totalRemaining - workerPaymentAmount))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="workerPaymentCreateExpense"
                    checked={workerPaymentCreateExpense}
                    onChange={(e) => setWorkerPaymentCreateExpense(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="workerPaymentCreateExpense" className="text-sm text-gray-700">
                    Also record payment as expense
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowWorkerPaymentDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setWorkerPaymentAmount(balance.totalRemaining)} 
                    variant="outline"
                    className="text-blue-600 border-blue-600"
                  >
                    Pay All
                  </Button>
                  <Button 
                    onClick={handleWorkerPayment} 
                    disabled={workerPaymentAmount <= 0 || workerPaymentAmount > balance.totalRemaining}
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Payment Receipt Dialog */}
      <Dialog open={showPaymentReceipt} onOpenChange={setShowPaymentReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader onClose={() => setShowPaymentReceipt(false)}>
            <DialogTitle>Payment Successful</DialogTitle>
          </DialogHeader>
          {lastWorkerPayment && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-green-600 text-sm">Payment Processed</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(lastWorkerPayment.amount)}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  to {lastWorkerPayment.worker.firstName} {lastWorkerPayment.worker.lastName}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Previous Balance:</span>
                  <span className="font-medium">{formatCurrency(lastWorkerPayment.previousBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium text-green-600">- {formatCurrency(lastWorkerPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>New Balance:</span>
                  <span className={lastWorkerPayment.newBalance <= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(lastWorkerPayment.newBalance)}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Receipts paid ({lastWorkerPayment.paidReceipts.length}):</p>
                <div className="max-h-24 overflow-y-auto bg-gray-50 rounded p-2">
                  {lastWorkerPayment.paidReceipts.map((pr, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>Receipt #{pr.id}</span>
                      <span>{formatCurrency(pr.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPaymentReceipt(false)} className="flex-1">
                  Close
                </Button>
                <Button onClick={printWorkerPaymentReceipt} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
