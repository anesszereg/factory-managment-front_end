import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Plus, Truck, Package, DollarSign, CreditCard, Edit2, Trash2, Eye, Download, Printer, X } from 'lucide-react';
import { PageLoading } from '../components/ui/Loading';
import { suppliersApi, supplierOrdersApi, rawMaterialsApi } from '../services/api';
import { 
  Supplier, 
  SupplierStatus, 
  SupplierOrder, 
  SupplierOrderStatus,
  RawMaterial 
} from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';

interface OrderItemForm {
  materialId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Dialogs
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSupplierSummary, setShowSupplierSummary] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  // Editing
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<SupplierOrder | null>(null);
  
  // Filters
  const [filterSupplier, setFilterSupplier] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<SupplierOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Order form items
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([
    { materialId: '', description: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filterSupplier, filterStatus, filterStartDate, filterEndDate]);

  const fetchData = async () => {
    try {
      const [suppliersRes, ordersRes, materialsRes] = await Promise.all([
        suppliersApi.getAll(),
        supplierOrdersApi.getAll(),
        rawMaterialsApi.getAll(),
      ]);
      setSuppliers(suppliersRes.data);
      setOrders(ordersRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await supplierOrdersApi.getAll({
        supplierId: filterSupplier || undefined,
        status: filterStatus || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      });
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: SupplierOrderStatus) => {
    switch (status) {
      case SupplierOrderStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case SupplierOrderStatus.PARTIAL:
        return 'bg-yellow-100 text-yellow-800';
      case SupplierOrderStatus.PENDING:
        return 'bg-red-100 text-red-800';
      case SupplierOrderStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: SupplierOrderStatus) => {
    switch (status) {
      case SupplierOrderStatus.COMPLETED:
        return 'Paid';
      case SupplierOrderStatus.PARTIAL:
        return 'Partial';
      case SupplierOrderStatus.PENDING:
        return 'Unpaid';
      case SupplierOrderStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Supplier CRUD
  const handleSupplierSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading(editingSupplier ? 'Updating supplier...' : 'Creating supplier...');
    
    try {
      const data = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string || undefined,
        address: formData.get('address') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        status: formData.get('status') as SupplierStatus,
      };

      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, data);
        toast.success('Supplier updated', { id: loadingToast });
      } else {
        await suppliersApi.create(data);
        toast.success('Supplier created', { id: loadingToast });
      }
      
      setShowSupplierForm(false);
      setEditingSupplier(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save supplier', { id: loadingToast });
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    const loadingToast = toast.loading('Deleting supplier...');
    try {
      await suppliersApi.delete(id);
      toast.success('Supplier deleted', { id: loadingToast });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete supplier', { id: loadingToast });
    }
  };

  // Order CRUD
  const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading(editingOrder ? 'Updating order...' : 'Creating order...');
    
    try {
      if (editingOrder) {
        await supplierOrdersApi.update(editingOrder.id, {
          orderDate: formData.get('orderDate') as string,
          notes: formData.get('notes') as string || undefined,
        });
        toast.success('Order updated', { id: loadingToast });
      } else {
        const items = orderItems.filter(item => item.description.trim() !== '').map(item => ({
          materialId: item.materialId ? parseInt(item.materialId) : undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        if (items.length === 0) {
          toast.error('Please add at least one item', { id: loadingToast });
          return;
        }

        await supplierOrdersApi.create({
          supplierId: parseInt(formData.get('supplierId') as string),
          orderDate: formData.get('orderDate') as string,
          notes: formData.get('notes') as string || undefined,
          items,
        });
        toast.success('Order created', { id: loadingToast });
      }
      
      setShowOrderForm(false);
      setEditingOrder(null);
      resetOrderForm();
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save order', { id: loadingToast });
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    const loadingToast = toast.loading('Deleting order...');
    try {
      await supplierOrdersApi.delete(id);
      toast.success('Order deleted', { id: loadingToast });
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete order', { id: loadingToast });
    }
  };

  // Payment
  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentOrderId) return;
    
    const formData = new FormData(e.currentTarget);
    const loadingToast = toast.loading('Recording payment...');
    
    try {
      await supplierOrdersApi.addPayment(paymentOrderId, {
        date: formData.get('date') as string,
        amount: parseFloat(formData.get('amount') as string),
        paymentMethod: formData.get('paymentMethod') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        createExpense: formData.get('createExpense') === 'on',
      });
      
      toast.success('Payment recorded', { id: loadingToast });
      setShowPaymentForm(false);
      setPaymentOrderId(null);
      fetchOrders();
      // Refresh selected order if viewing history
      if (selectedOrderForHistory) {
        const updatedOrder = await supplierOrdersApi.getById(selectedOrderForHistory.id);
        setSelectedOrderForHistory(updatedOrder.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record payment', { id: loadingToast });
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    const loadingToast = toast.loading('Deleting payment...');
    try {
      await supplierOrdersApi.deletePayment(paymentId);
      toast.success('Payment deleted', { id: loadingToast });
      fetchOrders();
      // Refresh selected order if viewing history
      if (selectedOrderForHistory) {
        const updatedOrder = await supplierOrdersApi.getById(selectedOrderForHistory.id);
        setSelectedOrderForHistory(updatedOrder.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete payment', { id: loadingToast });
    }
  };

  const openPaymentHistory = async (orderId: number) => {
    try {
      const res = await supplierOrdersApi.getById(orderId);
      setSelectedOrderForHistory(res.data);
      setShowPaymentHistory(true);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  // Order items management
  const addOrderItem = () => {
    setOrderItems([...orderItems, { materialId: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill description from material
    if (field === 'materialId' && value) {
      const material = materials.find(m => m.id === parseInt(value as string));
      if (material) {
        updated[index].description = material.name;
      }
    }
    
    setOrderItems(updated);
  };

  const resetOrderForm = () => {
    setOrderItems([{ materialId: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // Summary
  const openSupplierSummary = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierSummary(true);
  };

  const getSupplierOrders = () => {
    if (!selectedSupplier) return [];
    return orders.filter(o => o.supplierId === selectedSupplier.id);
  };

  const getSupplierStats = () => {
    const supplierOrders = getSupplierOrders();
    const totalAmount = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = supplierOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const totalRemaining = totalAmount - totalPaid;
    
    return {
      orders: supplierOrders,
      totalOrders: supplierOrders.length,
      totalAmount,
      totalPaid,
      totalRemaining,
      pendingCount: supplierOrders.filter(o => o.status === SupplierOrderStatus.PENDING).length,
      partialCount: supplierOrders.filter(o => o.status === SupplierOrderStatus.PARTIAL).length,
      completedCount: supplierOrders.filter(o => o.status === SupplierOrderStatus.COMPLETED).length,
    };
  };

  const printSupplierSummary = () => {
    if (!selectedSupplier) return;
    const stats = getSupplierStats();
    
    const ordersHtml = stats.orders.map(order => `
      <tr>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${format(new Date(order.orderDate), 'dd/MM/yyyy')}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${order.items?.map(i => i.description).join(', ') || '-'}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(order.totalAmount)}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(order.paidAmount)}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(order.totalAmount - order.paidAmount)}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee; text-align: center;">${getStatusLabel(order.status)}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Summary - ${selectedSupplier.name}</title>
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
              <h1>${selectedSupplier.name}</h1>
              <p>Supplier Account Summary</p>
              ${selectedSupplier.phone ? `<p>Phone: ${selectedSupplier.phone}</p>` : ''}
            </div>
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Total Orders</div>
                <div class="stat-value">${stats.totalOrders}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Total Amount</div>
                <div class="stat-value">${formatCurrency(stats.totalAmount)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Total Paid</div>
                <div class="stat-value" style="color: green;">${formatCurrency(stats.totalPaid)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Balance Due</div>
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
                  <th style="text-align: right;">Balance</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${ordersHtml}
              </tbody>
            </table>
            <div class="footer">
              <div class="footer-row">
                <span>TOTAL BALANCE DUE</span>
                <span>${formatCurrency(stats.totalRemaining)}</span>
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

  const exportSupplierToExcel = () => {
    if (!selectedSupplier) return;
    const stats = getSupplierStats();

    const exportData = stats.orders.map(order => ({
      'Date': format(new Date(order.orderDate), 'dd/MM/yyyy'),
      'Items': order.items?.map(i => i.description).join(', ') || '-',
      'Total Amount': order.totalAmount,
      'Paid Amount': order.paidAmount,
      'Balance': order.totalAmount - order.paidAmount,
      'Status': getStatusLabel(order.status),
    }));

    exportData.push({
      'Date': 'TOTAL',
      'Items': `${stats.totalOrders} orders`,
      'Total Amount': stats.totalAmount,
      'Paid Amount': stats.totalPaid,
      'Balance': stats.totalRemaining,
      'Status': '',
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    const fileName = `${selectedSupplier.name.replace(/\s+/g, '_')}_summary_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel file exported');
  };

  const exportAllSuppliersBalance = () => {
    const exportData = suppliers.map(supplier => {
      const supplierOrders = orders.filter(o => o.supplierId === supplier.id);
      const supplierTotal = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const supplierPaid = supplierOrders.reduce((sum, o) => sum + o.paidAmount, 0);
      const supplierBalance = supplierTotal - supplierPaid;
      
      return {
        'Supplier': supplier.name,
        'Phone': supplier.phone || '-',
        'Total Orders': supplierOrders.length,
        'Total Amount': supplierTotal,
        'Total Paid': supplierPaid,
        'Balance Due': supplierBalance,
        'Status': supplier.status,
      };
    });

    // Add totals row
    exportData.push({
      'Supplier': 'TOTAL',
      'Phone': '-',
      'Total Orders': orders.length,
      'Total Amount': totalAmount,
      'Total Paid': totalPaid,
      'Balance Due': totalRemaining,
      'Status': '-' as any,
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers Balance');

    const fileName = `suppliers_balance_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Suppliers balance exported to Excel');
  };

  // Stats
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalRemaining = totalAmount - totalPaid;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage suppliers, orders, and payments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportAllSuppliersBalance} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
            <Download className="h-4 w-4 mr-2" />
            Export Balance
          </Button>
          <Button onClick={() => {
            setEditingSupplier(null);
            setShowSupplierForm(true);
          }} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Button onClick={() => {
            setEditingOrder(null);
            resetOrderForm();
            setShowOrderForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Balance Due</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRemaining)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => {
              const supplierOrders = orders.filter(o => o.supplierId === supplier.id);
              const supplierTotal = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const supplierPaid = supplierOrders.reduce((sum, o) => sum + o.paidAmount, 0);
              const supplierBalance = supplierTotal - supplierPaid;
              
              return (
                <div
                  key={supplier.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      {supplier.phone && (
                        <p className="text-sm text-gray-500">{supplier.phone}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      supplier.status === SupplierStatus.ACTIVE 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Orders:</span>
                      <span className="ml-1 font-medium">{supplierOrders.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <span className="ml-1 font-medium">{formatCurrency(supplierTotal)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Paid:</span>
                      <span className="ml-1 font-medium text-green-600">{formatCurrency(supplierPaid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Balance:</span>
                      <span className={`ml-1 font-medium ${supplierBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatCurrency(supplierBalance)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSupplierSummary(supplier)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Summary
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setShowSupplierForm(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {suppliers.length === 0 && (
              <p className="col-span-full text-center text-gray-500 py-8">
                No suppliers yet. Add your first supplier to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value ? parseInt(e.target.value) : '')}
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as SupplierOrderStatus | '')}
            >
              <option value="">All Status</option>
              <option value={SupplierOrderStatus.PENDING}>Unpaid</option>
              <option value={SupplierOrderStatus.PARTIAL}>Partial</option>
              <option value={SupplierOrderStatus.COMPLETED}>Paid</option>
            </Select>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>

          {/* Orders Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Supplier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Items</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Paid</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Balance</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</td>
                    <td className="py-3 px-4">{order.supplier?.name}</td>
                    <td className="py-3 px-4 text-sm">
                      {order.items?.map(i => i.description).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(order.paidAmount)}</td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(order.totalAmount - order.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentHistory(order.id)}
                          className="text-blue-600"
                          title="View Payments"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status !== SupplierOrderStatus.COMPLETED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPaymentOrderId(order.id);
                              setShowPaymentForm(true);
                            }}
                            className="text-green-600"
                            title="Add Payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No orders found</p>
            )}
          </div>

          {/* Orders - Mobile */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{order.supplier?.name}</p>
                    <p className="text-sm text-gray-500">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {order.items?.map(i => i.description).join(', ') || '-'}
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Paid:</span>
                    <p className="font-medium text-green-600">{formatCurrency(order.paidAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Balance:</span>
                    <p className="font-medium text-red-600">{formatCurrency(order.totalAmount - order.paidAmount)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPaymentHistory(order.id)}
                    className="text-blue-600"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    History
                  </Button>
                  {order.status !== SupplierOrderStatus.COMPLETED && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPaymentOrderId(order.id);
                        setShowPaymentForm(true);
                      }}
                      className="flex-1 text-green-600"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No orders found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supplier Form Dialog */}
      <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowSupplierForm(false);
            setEditingSupplier(null);
          }}>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <Input
              label="Supplier Name"
              name="name"
              required
              defaultValue={editingSupplier?.name || ''}
              placeholder="Enter supplier name"
            />
            <Input
              label="Phone"
              name="phone"
              defaultValue={editingSupplier?.phone || ''}
              placeholder="Phone number"
            />
            <Textarea
              label="Address"
              name="address"
              defaultValue={editingSupplier?.address || ''}
              placeholder="Address"
              rows={2}
            />
            <Textarea
              label="Notes"
              name="notes"
              defaultValue={editingSupplier?.notes || ''}
              placeholder="Additional notes"
              rows={2}
            />
            <Select
              label="Status"
              name="status"
              defaultValue={editingSupplier?.status || SupplierStatus.ACTIVE}
            >
              <option value={SupplierStatus.ACTIVE}>Active</option>
              <option value={SupplierStatus.INACTIVE}>Inactive</option>
            </Select>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => {
                setShowSupplierForm(false);
                setEditingSupplier(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingSupplier ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Form Dialog */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader onClose={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
            resetOrderForm();
          }}>
            <DialogTitle>{editingOrder ? 'Edit Order' : 'New Order'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Supplier"
                name="supplierId"
                required
                disabled={!!editingOrder}
                defaultValue={editingOrder?.supplierId || ''}
              >
                <option value="">Select Supplier</option>
                {suppliers.filter(s => s.status === SupplierStatus.ACTIVE).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
              <Input
                label="Order Date"
                type="date"
                name="orderDate"
                required
                defaultValue={editingOrder?.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0]}
              />
            </div>

            {!editingOrder && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Items</label>
                  <Button type="button" size="sm" variant="outline" onClick={addOrderItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Select
                        label={index === 0 ? "Material" : ""}
                        value={item.materialId}
                        onChange={(e) => updateOrderItem(index, 'materialId', e.target.value)}
                      >
                        <option value="">Select or type</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        label={index === 0 ? "Description" : ""}
                        value={item.description}
                        onChange={(e) => updateOrderItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label={index === 0 ? "Qty" : ""}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label={index === 0 ? "Price" : ""}
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="text-right text-lg font-bold">
                  Total: {formatCurrency(calculateOrderTotal())}
                </div>
              </div>
            )}

            <Textarea
              label="Notes"
              name="notes"
              defaultValue={editingOrder?.notes || ''}
              placeholder="Order notes"
              rows={2}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => {
                setShowOrderForm(false);
                setEditingOrder(null);
                resetOrderForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingOrder ? 'Update' : 'Create Order'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowPaymentForm(false);
            setPaymentOrderId(null);
          }}>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentOrderId && (() => {
            const order = orders.find(o => o.id === paymentOrderId);
            if (!order) return null;
            const remaining = order.totalAmount - order.paidAmount;
            
            return (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p><strong>Supplier:</strong> {order.supplier?.name}</p>
                  <p><strong>Order Total:</strong> {formatCurrency(order.totalAmount)}</p>
                  <p><strong>Already Paid:</strong> {formatCurrency(order.paidAmount)}</p>
                  <p><strong>Remaining:</strong> <span className="text-red-600 font-bold">{formatCurrency(remaining)}</span></p>
                </div>
                
                <Input
                  label="Payment Date"
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="Amount"
                  type="number"
                  name="amount"
                  required
                  min="0.01"
                  max={remaining}
                  step="0.01"
                  defaultValue={remaining}
                  placeholder="Payment amount"
                />
                <Select
                  label="Payment Method"
                  name="paymentMethod"
                >
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Card">Card</option>
                </Select>
                <Textarea
                  label="Notes"
                  name="notes"
                  placeholder="Payment notes"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="createExpense"
                    id="createExpense"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="createExpense" className="text-sm text-gray-700">
                    Also record as expense
                  </label>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentOrderId(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </div>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Supplier Summary Dialog */}
      <Dialog open={showSupplierSummary} onOpenChange={setShowSupplierSummary}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader onClose={() => {
            setShowSupplierSummary(false);
            setSelectedSupplier(null);
          }}>
            <DialogTitle>{selectedSupplier?.name} - Account Summary</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (() => {
            const stats = getSupplierStats();
            
            return (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Total Orders</p>
                    <p className="text-xl font-bold text-blue-900">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-600">Total Paid</p>
                    <p className="text-xl font-bold text-green-900">{formatCurrency(stats.totalPaid)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-red-600">Balance Due</p>
                    <p className="text-xl font-bold text-red-900">{formatCurrency(stats.totalRemaining)}</p>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Items</th>
                        <th className="text-right py-2 px-3">Total</th>
                        <th className="text-right py-2 px-3">Paid</th>
                        <th className="text-right py-2 px-3">Balance</th>
                        <th className="text-center py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.orders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-2 px-3">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</td>
                          <td className="py-2 px-3">{order.items?.map(i => i.description).join(', ') || '-'}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(order.totalAmount)}</td>
                          <td className="py-2 px-3 text-right text-green-600">{formatCurrency(order.paidAmount)}</td>
                          <td className="py-2 px-3 text-right text-red-600">{formatCurrency(order.totalAmount - order.paidAmount)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="py-2 px-3" colSpan={2}>TOTAL</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(stats.totalAmount)}</td>
                        <td className="py-2 px-3 text-right text-green-600">{formatCurrency(stats.totalPaid)}</td>
                        <td className="py-2 px-3 text-right text-red-600">{formatCurrency(stats.totalRemaining)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  {stats.orders.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No orders found for this supplier</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={printSupplierSummary}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" onClick={exportSupplierToExcel} className="text-green-600 border-green-600 hover:bg-green-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => setShowSupplierSummary(false)}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={showPaymentHistory} onOpenChange={setShowPaymentHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader onClose={() => {
            setShowPaymentHistory(false);
            setSelectedOrderForHistory(null);
          }}>
            <DialogTitle>Payment History</DialogTitle>
          </DialogHeader>
          {selectedOrderForHistory && (() => {
            const order = selectedOrderForHistory;
            const remaining = order.totalAmount - order.paidAmount;
            
            return (
              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Supplier</p>
                      <p className="font-medium">{order.supplier?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Order Date</p>
                      <p className="font-medium">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Items</p>
                      <p className="font-medium">{order.items?.map(i => i.description).join(', ') || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-600">Paid</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(order.paidAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-red-600">Remaining</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(remaining)}</p>
                    </div>
                  </div>
                </div>

                {/* Payments List */}
                <div>
                  <h4 className="font-medium mb-2">Payments ({order.payments?.length || 0})</h4>
                  {order.payments && order.payments.length > 0 ? (
                    <div className="space-y-2">
                      {order.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                              <span className="text-sm text-gray-500">{format(new Date(payment.date), 'dd/MM/yyyy')}</span>
                              {payment.paymentMethod && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{payment.paymentMethod}</span>
                              )}
                            </div>
                            {payment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No payments recorded yet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  {order.status !== SupplierOrderStatus.COMPLETED && (
                    <Button
                      onClick={() => {
                        setPaymentOrderId(order.id);
                        setShowPaymentForm(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    setShowPaymentHistory(false);
                    setSelectedOrderForHistory(null);
                  }}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
