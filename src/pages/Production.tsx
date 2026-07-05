import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { productionOrdersApi, dailyProductionApi, furnitureModelsApi } from '@/services/api';
import type { ProductionOrder, DailyProduction, FurnitureModel } from '@/types';
import { ProductionStatus, ProductionStep } from '@/types';
import { Plus, CheckCircle2, Clock, ArrowDown, Package, Edit2, Trash2, TrendingUp, AlertTriangle, Factory, ChevronRight, Layers, BarChart3 } from 'lucide-react';
import { formatDate, getStepLabel } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Loading';
import { PrintButton } from '@/components/ui/PrintButton';
import { printDocument } from '@/lib/print';

export function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [models, setModels] = useState<FurnitureModel[]>([]);
  const [dailyProduction, setDailyProduction] = useState<DailyProduction[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [editingProduction, setEditingProduction] = useState<DailyProduction | null>(null);
  const [colorSplits, setColorSplits] = useState<{ color: string; quantity: number }[]>([]);
  const [selectedStep, setSelectedStep] = useState<ProductionStep | ''>('');
  const [loading, setLoading] = useState(true);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'IN_PROGRESS' | 'FINISHED'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, modelsRes, productionRes] = await Promise.all([
        productionOrdersApi.getAll(),
        furnitureModelsApi.getAll(),
        dailyProductionApi.getAll(),
      ]);
      setOrders(ordersRes.data);
      setModels(modelsRes.data);
      setDailyProduction(productionRes.data);
      if (ordersRes.data.length > 0 && !selectedOrder) {
        setSelectedOrder(ordersRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading(editingOrder ? 'Updating order...' : 'Creating order...');
    
    try {
      if (editingOrder) {
        await productionOrdersApi.update(editingOrder.id, {
          quantity: parseInt(formData.get('quantity') as string),
          status: formData.get('status') as ProductionStatus,
        });
        toast.success('Order updated successfully!', { id: loadingToast });
        setEditingOrder(null);
      } else {
        await productionOrdersApi.create({
          modelId: parseInt(formData.get('modelId') as string),
          quantity: parseInt(formData.get('quantity') as string),
          startDate: formData.get('startDate') as string,
        });
        toast.success('Order created successfully!', { id: loadingToast });
      }
      setShowOrderForm(false);
      await loadData();
      if (!editingOrder) {
        const newOrders = await productionOrdersApi.getAll();
        setSelectedOrder(newOrders.data[newOrders.data.length - 1]);
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save order. Please try again.', { id: loadingToast });
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this production order? This will also delete all associated production records.')) return;
    
    const loadingToast = toast.loading('Deleting order...');
    
    try {
      await productionOrdersApi.delete(id);
      toast.success('Order deleted successfully!', { id: loadingToast });
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
      loadData();
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order. Please try again.', { id: loadingToast });
    }
  };

  const handleCreateProduction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const step = formData.get('step') as ProductionStep;
    const quantityCompleted = parseInt(formData.get('quantityCompleted') as string);

    const validColorSplits = step === ProductionStep.PAINT
      ? colorSplits.filter(s => s.color.trim() && s.quantity > 0)
      : [];

    if (step === ProductionStep.PAINT && validColorSplits.length > 0) {
      const splitTotal = validColorSplits.reduce((sum, s) => sum + s.quantity, 0);
      if (splitTotal !== quantityCompleted) {
        toast.error(`Color split total (${splitTotal}) must equal completed quantity (${quantityCompleted})`);
        return;
      }
    }

    const loadingToast = toast.loading(editingProduction ? 'Updating production...' : 'Recording production...');

    try {
      if (editingProduction) {
        await dailyProductionApi.update(editingProduction.id, {
          quantityEntered: parseInt(formData.get('quantityEntered') as string),
          quantityCompleted,
          quantityLost: parseInt(formData.get('quantityLost') as string) || 0,
          notes: formData.get('notes') as string || undefined,
        });
        toast.success('Production updated successfully!', { id: loadingToast });
        setEditingProduction(null);
      } else {
        await dailyProductionApi.create({
          orderId: parseInt(formData.get('orderId') as string),
          step,
          date: formData.get('date') as string,
          quantityEntered: parseInt(formData.get('quantityEntered') as string),
          quantityCompleted,
          quantityLost: parseInt(formData.get('quantityLost') as string) || 0,
          notes: formData.get('notes') as string || undefined,
          colorSplits: validColorSplits.length > 0 ? validColorSplits : undefined,
        });
        toast.success('Production recorded successfully!', { id: loadingToast });
      }
      setShowProductionForm(false);
      setColorSplits([]);
      loadData();
    } catch (error) {
      console.error('Failed to save production entry:', error);
      toast.error('Failed to save production. Please try again.', { id: loadingToast });
    }
  };

  const addColorSplit = () => {
    setColorSplits(prev => [...prev, { color: '', quantity: 0 }]);
  };

  const updateColorSplit = (index: number, field: 'color' | 'quantity', value: string | number) => {
    setColorSplits(prev => prev.map((split, i) => i === index ? { ...split, [field]: value } : split));
  };

  const removeColorSplit = (index: number) => {
    setColorSplits(prev => prev.filter((_, i) => i !== index));
  };

  const openProductionForm = (production: DailyProduction | null = null, orderId?: number, step?: ProductionStep) => {
    setEditingProduction(production);
    setSelectedStep(production?.step || step || '');
    if (production?.colorSplits) {
      setColorSplits(production.colorSplits.map(s => ({ color: s.color, quantity: s.quantity })));
    } else {
      setColorSplits([]);
    }
    setShowProductionForm(true);
    setTimeout(() => {
      const orderSelect = document.querySelector('select[name="orderId"]') as HTMLSelectElement;
      const stepSelect = document.querySelector('select[name="step"]') as HTMLSelectElement;
      if (orderId && orderSelect) orderSelect.value = orderId.toString();
      if (step && stepSelect) stepSelect.value = step;
    }, 0);
  };

  const handleDeleteProduction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this production record?')) return;
    
    const loadingToast = toast.loading('Deleting production...');
    
    try {
      await dailyProductionApi.delete(id);
      toast.success('Production deleted successfully!', { id: loadingToast });
      loadData();
    } catch (error) {
      console.error('Failed to delete production record:', error);
      toast.error('Failed to delete production. Please try again.', { id: loadingToast });
    }
  };

  const printOrder = (order: ProductionOrder) => {
    printDocument({
      title: 'Production Order',
      subtitle: `#${order.id}`,
      fields: [
        { label: 'Model', value: order.model?.name || '-' },
        { label: 'Quantity', value: order.quantity },
        { label: 'Status', value: order.status },
        { label: 'Start Date', value: formatDate(order.startDate) },
      ],
    });
  };

  const printProductionRecord = (prod: DailyProduction) => {
    printDocument({
      title: 'Production Record',
      subtitle: `#${prod.id}`,
      fields: [
        { label: 'Order', value: `#${prod.orderId}` },
        { label: 'Step', value: getStepLabel(prod.step) },
        { label: 'Date', value: formatDate(prod.date) },
        { label: 'Entered', value: prod.quantityEntered },
        { label: 'Completed', value: prod.quantityCompleted },
        { label: 'Lost', value: prod.quantityLost },
        { label: 'Notes', value: prod.notes || '-' },
      ],
    });
  };

  const productionSteps = [
    { step: ProductionStep.CUTTING, label: 'Cutting', icon: '✂️', color: 'blue' },
    { step: ProductionStep.MONTAGE, label: 'Montage', icon: '🔧', color: 'purple' },
    { step: ProductionStep.FINITION, label: 'Finition', icon: '✨', color: 'pink' },
    { step: ProductionStep.PAINT, label: 'Paint', icon: '🎨', color: 'green' },
    { step: ProductionStep.PACKAGING, label: 'Packaging', icon: '📦', color: 'orange' },
  ];

  const getStepProgress = (orderId: number, step: ProductionStep) => {
    const stepData = dailyProduction.filter(
      (p) => p.orderId === orderId && p.step === step
    );
    if (stepData.length === 0) return null;
    const totalEntered = stepData.reduce((sum, p) => sum + p.quantityEntered, 0);
    const totalCompleted = stepData.reduce((sum, p) => sum + p.quantityCompleted, 0);
    const totalLost = stepData.reduce((sum, p) => sum + p.quantityLost, 0);
    return { entered: totalEntered, completed: totalCompleted, lost: totalLost };
  };

  const getStepStatus = (orderId: number, step: ProductionStep, targetQuantity: number) => {
    const progress = getStepProgress(orderId, step);
    if (!progress) return 'pending';
    if (progress.completed >= targetQuantity) return 'completed';
    if (progress.entered > 0) return 'in-progress';
    return 'pending';
  };

  // Filter orders by date and status
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const orderDate = new Date(order.startDate);
    const matchesStartDate = !filterStartDate || orderDate >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || orderDate <= new Date(filterEndDate);
    return matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Filter daily production by date
  const filteredDailyProduction = dailyProduction.filter(prod => {
    const prodDate = new Date(prod.date);
    const matchesStartDate = !filterStartDate || prodDate >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || prodDate <= new Date(filterEndDate);
    // Also filter by orders that match the filter
    const orderInFilter = filteredOrders.some(o => o.id === prod.orderId);
    return matchesStartDate && matchesEndDate && orderInFilter;
  });

  const calculateStatistics = () => {
    const totalOrders = filteredOrders.length;
    const activeOrders = filteredOrders.filter(o => o.status === ProductionStatus.IN_PROGRESS).length;
    const completedOrders = filteredOrders.filter(o => o.status === ProductionStatus.FINISHED).length;
    const totalUnitsOrdered = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalUnitsCompleted = filteredOrders.filter(o => o.status === ProductionStatus.FINISHED).reduce((sum, o) => sum + o.quantity, 0);
    const totalUnitsLost = filteredDailyProduction.reduce((sum, p) => sum + p.quantityLost, 0);
    const completionRate = totalUnitsOrdered > 0 ? Math.round((totalUnitsCompleted / totalUnitsOrdered) * 100) : 0;
    
    const totalProductionRecords = filteredDailyProduction.length;
    const totalUnitsEntered = filteredDailyProduction.reduce((sum, p) => sum + p.quantityEntered, 0);
    const totalUnitsProduced = filteredDailyProduction.reduce((sum, p) => sum + p.quantityCompleted, 0);
    const productionEfficiency = totalUnitsEntered > 0 ? Math.round((totalUnitsProduced / totalUnitsEntered) * 100) : 0;
    
    // Calculate total quantity by model
    const quantityByModel = models.map(model => {
      const modelOrders = filteredOrders.filter(o => o.modelId === model.id);
      const totalOrdered = modelOrders.reduce((sum, o) => sum + o.quantity, 0);
      const totalCompleted = modelOrders.filter(o => o.status === ProductionStatus.FINISHED).reduce((sum, o) => sum + o.quantity, 0);
      const inProgress = modelOrders.filter(o => o.status === ProductionStatus.IN_PROGRESS).reduce((sum, o) => sum + o.quantity, 0);
      return {
        model,
        totalOrdered,
        totalCompleted,
        inProgress,
        ordersCount: modelOrders.length,
      };
    }).filter(m => m.totalOrdered > 0);

    const productionByStep = Object.values(ProductionStep).map(step => {
      const stepRecords = filteredDailyProduction.filter(p => p.step === step);
      return {
        step,
        count: stepRecords.length,
        completed: stepRecords.reduce((sum, p) => sum + p.quantityCompleted, 0),
      };
    });
    
    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalUnitsOrdered,
      totalUnitsCompleted,
      totalUnitsLost,
      completionRate,
      totalProductionRecords,
      totalUnitsEntered,
      totalUnitsProduced,
      productionEfficiency,
      productionByStep,
      quantityByModel,
    };
  };

  const stats = calculateStatistics();

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Production Management</h1>
            </div>
            <p className="text-blue-100 text-sm sm:text-base ml-14">
              Track orders, monitor workflow progress, and optimize production
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
            <Button className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm" onClick={() => {
              setEditingProduction(null);
              setShowProductionForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Record Production
            </Button>
            <Button className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-blue-50" onClick={() => {
              setEditingOrder(null);
              setShowOrderForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Mini Pipeline Overview */}
        <div className="relative mt-6 flex items-center justify-center gap-1 sm:gap-2">
          {productionSteps.map((s, i) => {
            const stepData = stats.productionByStep.find(ps => ps.step === s.step);
            return (
              <div key={s.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="text-lg sm:text-xl">{s.icon}</div>
                  <span className="text-[10px] sm:text-xs text-white/80 mt-1">{s.label}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-white">{stepData?.completed || 0}</span>
                </div>
                {i < productionSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-white/40 mx-1 sm:mx-2" />
                )}
              </div>
            );
          })}
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
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'IN_PROGRESS' | 'FINISHED')}
                >
                  <option value="all">All Status</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="FINISHED">Finished</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              {(filterStartDate || filterEndDate || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
          {(filterStartDate || filterEndDate || filterStatus !== 'all') && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Showing <span className="font-semibold">{filteredOrders.length}</span> orders 
                {filterStartDate && ` from ${filterStartDate}`}
                {filterEndDate && ` to ${filterEndDate}`}
                {filterStatus !== 'all' && ` (${filterStatus === 'IN_PROGRESS' ? 'In Progress' : 'Finished'})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{stats.activeOrders} active</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{stats.completedOrders} done</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Layers className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Units Ordered</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUnitsOrdered}</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.totalUnitsOrdered > 0 ? (stats.totalUnitsCompleted / stats.totalUnitsOrdered) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{stats.totalUnitsCompleted} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Efficiency</p>
              </div>
              <div className="flex items-end gap-1">
                <p className="text-3xl font-bold text-gray-900">{stats.productionEfficiency}</p>
                <p className="text-lg font-bold text-gray-400 mb-0.5">%</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">{stats.totalUnitsProduced} / {stats.totalUnitsEntered} units</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Units Lost</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUnitsLost}</p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.totalUnitsEntered > 0 ? ((stats.totalUnitsLost / stats.totalUnitsEntered) * 100).toFixed(1) : 0}% loss rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quantity by Model */}
      {stats.quantityByModel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Production by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.quantityByModel.map((item, idx) => {
                const completionPct = item.totalOrdered > 0 ? Math.round((item.totalCompleted / item.totalOrdered) * 100) : 0;
                const colors = [
                  { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', bar: 'bg-blue-500', text: 'text-blue-700' },
                  { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', bar: 'bg-purple-500', text: 'text-purple-700' },
                  { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' },
                  { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', bar: 'bg-orange-500', text: 'text-orange-700' },
                  { bg: 'from-cyan-50 to-sky-50', border: 'border-cyan-200', bar: 'bg-cyan-500', text: 'text-cyan-700' },
                  { bg: 'from-rose-50 to-red-50', border: 'border-rose-200', bar: 'bg-rose-500', text: 'text-rose-700' },
                ];
                const c = colors[idx % colors.length];
                return (
                  <div key={item.model.id} className={`p-4 rounded-xl border bg-gradient-to-br ${c.bg} ${c.border} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-bold ${c.text}`}>{item.model.name}</h4>
                      <span className="text-xs font-medium text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">{item.ordersCount} orders</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{item.totalOrdered}</p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Ordered</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{item.totalCompleted}</p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Done</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-600">{item.inProgress}</p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Active</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-white/60 rounded-full h-2.5">
                        <div
                          className={`${c.bar} h-2.5 rounded-full transition-all duration-500`}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <p className="text-right text-[10px] font-semibold text-gray-600 mt-1">{completionPct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
          }}>
            <DialogTitle>{editingOrder ? 'Edit Production Order' : 'Create Production Order'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <Select
              label="Model"
              name="modelId"
              required
              disabled={!!editingOrder}
              defaultValue={editingOrder?.modelId}
              helperText="Select the furniture model to produce"
            >
              <option value="">Select a model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>
            <Input
              label="Quantity"
              type="number"
              name="quantity"
              required
              min="1"
              placeholder="Enter quantity"
              defaultValue={editingOrder?.quantity}
              helperText="Number of units to produce"
            />
            <Input
              label="Start Date"
              type="date"
              name="startDate"
              required
              disabled={!!editingOrder}
              defaultValue={editingOrder ? editingOrder.startDate.split('T')[0] : new Date().toISOString().split('T')[0]}
              helperText="When production should begin"
            />
            {editingOrder && (
              <Select
                label="Status"
                name="status"
                required
                defaultValue={editingOrder.status}
                helperText="Update order status"
              >
                <option value={ProductionStatus.IN_PROGRESS}>In Progress</option>
                <option value={ProductionStatus.FINISHED}>Finished</option>
              </Select>
            )}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => {
                setShowOrderForm(false);
                setEditingOrder(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingOrder ? 'Update Order' : 'Create Order'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductionForm} onOpenChange={(open) => {
        setShowProductionForm(open);
        if (!open) {
          setEditingProduction(null);
          setColorSplits([]);
        }
      }}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowProductionForm(false);
            setEditingProduction(null);
            setColorSplits([]);
          }}>
            <DialogTitle>{editingProduction ? 'Edit Production Record' : 'Record Daily Production'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProduction} className="space-y-4">
            <Select
              label="Production Order"
              name="orderId"
              required
              disabled={!!editingProduction}
              defaultValue={editingProduction?.orderId}
              helperText="Select the production order to record"
            >
              <option value="">Select an order</option>
              {orders.filter(o => o.status === ProductionStatus.IN_PROGRESS).map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id} - {order.model?.name} ({order.quantity} units)
                </option>
              ))}
            </Select>
            <Select
              label="Production Step"
              name="step"
              required
              disabled={!!editingProduction}
              defaultValue={editingProduction?.step}
              onChange={(e) => setSelectedStep(e.target.value as ProductionStep)}
              helperText="Which production step is being recorded"
            >
              <option value="">Select a step</option>
              {Object.values(ProductionStep).map((step) => (
                <option key={step} value={step}>
                  {getStepLabel(step)}
                </option>
              ))}
            </Select>
            <Input
              label="Date"
              type="date"
              name="date"
              required
              disabled={!!editingProduction}
              defaultValue={editingProduction ? editingProduction.date.split('T')[0] : new Date().toISOString().split('T')[0]}
              helperText="Date of production activity"
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Quantity Entered"
                type="number"
                name="quantityEntered"
                required
                min="0"
                placeholder="0"
                defaultValue={editingProduction?.quantityEntered}
              />
              <Input
                label="Quantity Completed"
                type="number"
                name="quantityCompleted"
                required
                min="0"
                placeholder="0"
                defaultValue={editingProduction?.quantityCompleted}
              />
              <Input
                label="Quantity Lost"
                type="number"
                name="quantityLost"
                min="0"
                defaultValue={editingProduction?.quantityLost || 0}
                placeholder="0"
              />
            </div>

            {selectedStep === ProductionStep.PAINT && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Paint Colors</h3>
                  {!editingProduction && (
                    <Button type="button" variant="outline" size="sm" onClick={addColorSplit}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add color
                    </Button>
                  )}
                </div>
                {colorSplits.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No colors specified</p>
                ) : (
                  <div className="space-y-2">
                    {colorSplits.map((split, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Color</label>
                          <Input
                            type="text"
                            placeholder="e.g. Black, White"
                            value={split.color}
                            onChange={(e) => !editingProduction && updateColorSplit(index, 'color', e.target.value)}
                            disabled={!!editingProduction}
                            required
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            value={split.quantity || ''}
                            onChange={(e) => !editingProduction && updateColorSplit(index, 'quantity', parseInt(e.target.value) || 0)}
                            disabled={!!editingProduction}
                            required
                          />
                        </div>
                        {!editingProduction && (
                          <button
                            type="button"
                            onClick={() => removeColorSplit(index)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Total: {colorSplits.reduce((sum, s) => sum + s.quantity, 0)} units
                </p>
              </div>
            )}

            <Textarea
              label="Notes"
              name="notes"
              rows={3}
              placeholder="Add any notes about this production..."
              defaultValue={editingProduction?.notes || ''}
              helperText="Optional: Record any issues or observations"
            />
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => {
                setShowProductionForm(false);
                setEditingProduction(null);
                setColorSplits([]);
                setSelectedStep('');
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingProduction ? 'Update Production' : 'Record Production'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Orders & Workflow */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Orders List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span>Orders</span>
              </div>
              <span className="text-sm font-normal text-gray-400">{filteredOrders.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const stepsCompleted = productionSteps.filter(s => getStepStatus(order.id, s.step, order.quantity) === 'completed').length;
                const overallPct = Math.round((stepsCompleted / productionSteps.length) * 100);

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {order.model?.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">#{order.id} • {formatDate(order.startDate)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                            order.status === ProductionStatus.FINISHED
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {order.status === ProductionStatus.FINISHED ? 'Done' : 'Active'}
                        </span>
                        <PrintButton onClick={(e) => { e?.stopPropagation(); printOrder(order); }} label="Print order" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingOrder(order); setShowOrderForm(true); }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-600">{order.quantity} units</span>
                      <div className="flex-1 max-w-[120px]">
                        <div className="flex gap-0.5">
                          {productionSteps.map((s) => {
                            const stepStatus = getStepStatus(order.id, s.step, order.quantity);
                            return (
                              <div
                                key={s.step}
                                className={`flex-1 h-1.5 rounded-full transition-colors ${
                                  stepStatus === 'completed'
                                    ? 'bg-green-500'
                                    : stepStatus === 'in-progress'
                                    ? 'bg-amber-400'
                                    : 'bg-gray-200'
                                }`}
                                title={`${s.label}: ${stepStatus}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{overallPct}%</span>
                    </div>
                  </button>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    {orders.length === 0 ? 'No production orders yet' : 'No orders match filters'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Panel */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>
              {selectedOrder ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedOrder.status === ProductionStatus.FINISHED ? 'bg-green-100' : 'bg-indigo-100'}`}>
                        <Factory className={`h-5 w-5 ${selectedOrder.status === ProductionStatus.FINISHED ? 'text-green-600' : 'text-indigo-600'}`} />
                      </div>
                      <div>
                        <span className="text-lg">{selectedOrder.model?.name}</span>
                        <span className="text-sm font-normal text-gray-400 ml-2">Order #{selectedOrder.id}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                      selectedOrder.status === ProductionStatus.FINISHED
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedOrder.status === ProductionStatus.FINISHED ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 ml-14 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {selectedOrder.quantity} units
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(selectedOrder.startDate)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">Select an order to view workflow</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedOrder ? (
              <div className="space-y-3">
                {productionSteps.map((stepInfo, index) => {
                  const progress = getStepProgress(selectedOrder.id, stepInfo.step);
                  const status = getStepStatus(selectedOrder.id, stepInfo.step, selectedOrder.quantity);
                  const completionPercent = progress
                    ? Math.round((progress.completed / selectedOrder.quantity) * 100)
                    : 0;

                  return (
                    <div key={stepInfo.step}>
                      <div
                        className={`relative p-5 rounded-xl border transition-all duration-200 ${
                          status === 'completed'
                            ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                            : status === 'in-progress'
                            ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Step number badge */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                              status === 'completed'
                                ? 'bg-green-500 text-white'
                                : status === 'in-progress'
                                ? 'bg-amber-400 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <span>{index + 1}</span>}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{stepInfo.icon}</span>
                                <h3 className="text-base font-bold text-gray-900">{stepInfo.label}</h3>
                                {status === 'in-progress' && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-200 text-amber-800 rounded-full">In Progress</span>
                                )}
                              </div>
                              {progress ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-600">
                                      <span className="font-bold text-gray-900">{progress.completed}</span>
                                      <span className="text-gray-400"> / {selectedOrder.quantity}</span>
                                    </span>
                                    {progress.entered !== progress.completed && (
                                      <span className="text-blue-600 text-xs">
                                        {progress.entered} entered
                                      </span>
                                    )}
                                    {progress.lost > 0 && (
                                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                                        <AlertTriangle className="h-3 w-3" />
                                        {progress.lost} lost
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-full bg-gray-200/60 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        status === 'completed' ? 'bg-green-500' : 'bg-amber-400'
                                      }`}
                                      style={{ width: `${completionPercent}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] font-semibold text-gray-500">{completionPercent}% complete</p>
                                  {stepInfo.step === ProductionStep.PAINT && progress && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {dailyProduction
                                        .filter(p => p.orderId === selectedOrder.id && p.step === ProductionStep.PAINT && p.colorSplits && p.colorSplits.length > 0)
                                        .flatMap(p => p.colorSplits!)
                                        .reduce((acc, split) => {
                                          const existing = acc.find(s => s.color.toLowerCase() === split.color.toLowerCase());
                                          if (existing) existing.quantity += split.quantity;
                                          else acc.push({ color: split.color, quantity: split.quantity });
                                          return acc;
                                        }, [] as { color: string; quantity: number }[])
                                        .map((split, idx) => (
                                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                                            {split.color}: {split.quantity}
                                          </span>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 italic">Waiting to start...</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`text-xs ${status === 'pending' ? 'border-dashed' : ''}`}
                              onClick={() => openProductionForm(null, selectedOrder.id, stepInfo.step)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Record
                            </Button>
                            {progress && (
                              <div className="flex gap-1">
                                {dailyProduction.filter((p: DailyProduction) => p.orderId === selectedOrder.id && p.step === stepInfo.step).slice(0, 3).map((prod: DailyProduction) => (
                                  <div key={prod.id} className="flex gap-0.5">
                                    <PrintButton onClick={() => printProductionRecord(prod)} label="Print record" />
                                    <button
                                      onClick={() => openProductionForm(prod)}
                                      className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduction(prod.id)}
                                      className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < productionSteps.length - 1 && (
                        <div className="flex justify-center py-1">
                          <ArrowDown className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Factory className="h-8 w-8 text-gray-300" />
                </div>
                <p className="font-medium">No order selected</p>
                <p className="text-sm mt-1">Click on an order from the list to view its production workflow</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
