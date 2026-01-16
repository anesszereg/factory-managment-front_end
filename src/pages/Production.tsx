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
import { Plus, CheckCircle2, Circle, Clock, ArrowRight, Package, Edit2, Trash2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate, getStepLabel } from '@/lib/utils';

export function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [models, setModels] = useState<FurnitureModel[]>([]);
  const [dailyProduction, setDailyProduction] = useState<DailyProduction[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [editingProduction, setEditingProduction] = useState<DailyProduction | null>(null);
  const [loading, setLoading] = useState(true);

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
    
    const loadingToast = toast.loading(editingProduction ? 'Updating production...' : 'Recording production...');
    
    try {
      if (editingProduction) {
        await dailyProductionApi.update(editingProduction.id, {
          quantityEntered: parseInt(formData.get('quantityEntered') as string),
          quantityCompleted: parseInt(formData.get('quantityCompleted') as string),
          quantityLost: parseInt(formData.get('quantityLost') as string) || 0,
          notes: formData.get('notes') as string || undefined,
        });
        toast.success('Production updated successfully!', { id: loadingToast });
        setEditingProduction(null);
      } else {
        await dailyProductionApi.create({
          orderId: parseInt(formData.get('orderId') as string),
          step: formData.get('step') as ProductionStep,
          date: formData.get('date') as string,
          quantityEntered: parseInt(formData.get('quantityEntered') as string),
          quantityCompleted: parseInt(formData.get('quantityCompleted') as string),
          quantityLost: parseInt(formData.get('quantityLost') as string) || 0,
          notes: formData.get('notes') as string || undefined,
        });
        toast.success('Production recorded successfully!', { id: loadingToast });
      }
      setShowProductionForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to save production entry:', error);
      toast.error('Failed to save production. Please try again.', { id: loadingToast });
    }
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

  const calculateStatistics = () => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => o.status === ProductionStatus.IN_PROGRESS).length;
    const completedOrders = orders.filter(o => o.status === ProductionStatus.FINISHED).length;
    const totalUnitsOrdered = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalUnitsCompleted = orders.filter(o => o.status === ProductionStatus.FINISHED).reduce((sum, o) => sum + o.quantity, 0);
    const totalUnitsLost = dailyProduction.reduce((sum, p) => sum + p.quantityLost, 0);
    const completionRate = totalUnitsOrdered > 0 ? Math.round((totalUnitsCompleted / totalUnitsOrdered) * 100) : 0;
    
    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalUnitsOrdered,
      totalUnitsCompleted,
      totalUnitsLost,
      completionRate,
    };
  };

  const stats = calculateStatistics();

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage production orders and daily production tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => {
            setEditingProduction(null);
            setShowProductionForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Record Production
          </Button>
          <Button onClick={() => {
            setEditingOrder(null);
            setShowOrderForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeOrders} active</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedOrders}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalUnitsCompleted} units</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalUnitsCompleted} / {stats.totalUnitsOrdered} units</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Units Lost</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUnitsLost}</p>
                <p className="text-xs text-gray-500 mt-1">Across all production</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      <Dialog open={showProductionForm} onOpenChange={setShowProductionForm}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowProductionForm(false);
            setEditingProduction(null);
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
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingProduction ? 'Update Production' : 'Record Production'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Production Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOrder?.id === order.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">#{order.id} - {order.model?.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(order.startDate)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === ProductionStatus.FINISHED
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status === ProductionStatus.FINISHED ? 'Done' : 'Active'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOrder(order);
                          setShowOrderForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{order.quantity} units</span>
                    <div className="flex gap-1">
                      {productionSteps.map((s) => {
                        const status = getStepStatus(order.id, s.step, order.quantity);
                        return (
                          <div
                            key={s.step}
                            className={`w-2 h-2 rounded-full ${
                              status === 'completed'
                                ? 'bg-green-500'
                                : status === 'in-progress'
                                ? 'bg-yellow-500'
                                : 'bg-gray-300'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </button>
              ))}
              {orders.length === 0 && (
                <p className="text-center text-gray-500 py-8">No production orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedOrder ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span>Production Workflow - Order #{selectedOrder.id}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {selectedOrder.model?.name}
                    </span>
                  </div>
                  <p className="text-sm font-normal text-gray-500 mt-2">
                    Target: {selectedOrder.quantity} units • Started {formatDate(selectedOrder.startDate)}
                  </p>
                </div>
              ) : (
                'Select an order to view workflow'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedOrder ? (
              <div className="space-y-4">
                {productionSteps.map((stepInfo, index) => {
                  const progress = getStepProgress(selectedOrder.id, stepInfo.step);
                  const status = getStepStatus(selectedOrder.id, stepInfo.step, selectedOrder.quantity);
                  const completionPercent = progress
                    ? Math.round((progress.completed / selectedOrder.quantity) * 100)
                    : 0;

                  return (
                    <div key={stepInfo.step}>
                      <div
                        className={`relative p-6 rounded-xl border-2 transition-all ${
                          status === 'completed'
                            ? 'border-green-500 bg-green-50'
                            : status === 'in-progress'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="text-3xl">{stepInfo.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {index + 1}. {stepInfo.label}
                                </h3>
                                {status === 'completed' && (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                )}
                                {status === 'in-progress' && (
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                )}
                                {status === 'pending' && (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              {progress ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-4 text-sm">
                                    <span className="text-gray-700">
                                      <span className="font-semibold">{progress.completed}</span> / {selectedOrder.quantity} completed
                                    </span>
                                    {progress.lost > 0 && (
                                      <span className="text-red-600">
                                        {progress.lost} lost
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${
                                        status === 'completed' ? 'bg-green-600' : 'bg-yellow-500'
                                      }`}
                                      style={{ width: `${completionPercent}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-600">{completionPercent}% complete</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Not started</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingProduction(null);
                                setShowProductionForm(true);
                                setTimeout(() => {
                                  const orderSelect = document.querySelector('select[name="orderId"]') as HTMLSelectElement;
                                  const stepSelect = document.querySelector('select[name="step"]') as HTMLSelectElement;
                                  if (orderSelect) orderSelect.value = selectedOrder.id.toString();
                                  if (stepSelect) stepSelect.value = stepInfo.step;
                                }, 0);
                              }}
                            >
                              Record
                            </Button>
                            {progress && (
                              <div className="flex space-x-1">
                                {dailyProduction.filter((p: DailyProduction) => p.orderId === selectedOrder.id && p.step === stepInfo.step).slice(0, 3).map((prod: DailyProduction) => (
                                  <div key={prod.id} className="flex space-x-1">
                                    <button
                                      onClick={() => {
                                        setEditingProduction(prod);
                                        setShowProductionForm(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="Edit"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduction(prod.id)}
                                      className="text-red-600 hover:text-red-900"
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
                        <div className="flex justify-center py-2">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a production order from the list to view its workflow</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
