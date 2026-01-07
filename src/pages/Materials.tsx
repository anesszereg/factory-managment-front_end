import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { rawMaterialsApi, materialPurchasesApi, materialConsumptionApi } from '@/services/api';
import type { RawMaterial, MaterialPurchase, MaterialConsumption } from '@/types';
import { MaterialUnit } from '@/types';
import { Plus, AlertTriangle, TrendingUp, TrendingDown, Package2, ShoppingCart, Minus, Edit2, Trash2 } from 'lucide-react';
import { formatDate, getUnitLabel, formatCurrency } from '@/lib/utils';

export function Materials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [consumption, setConsumption] = useState<MaterialConsumption[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showConsumptionForm, setShowConsumptionForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<MaterialPurchase | null>(null);
  const [editingConsumption, setEditingConsumption] = useState<MaterialConsumption | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'low' | 'good'>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showConsumptionHistory, setShowConsumptionHistory] = useState(false);
  const [consumptionFilterMaterial, setConsumptionFilterMaterial] = useState<number | ''>('');
  const [consumptionStartDate, setConsumptionStartDate] = useState('');
  const [consumptionEndDate, setConsumptionEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsRes, purchasesRes, consumptionRes] = await Promise.all([
        rawMaterialsApi.getAll(),
        materialPurchasesApi.getAll(),
        materialConsumptionApi.getAll(),
      ]);
      setMaterials(materialsRes.data);
      setPurchases(purchasesRes.data);
      setConsumption(consumptionRes.data);
      if (materialsRes.data.length > 0 && !selectedMaterial) {
        setSelectedMaterial(materialsRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load materials data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading('Creating material...');
    
    try {
      await rawMaterialsApi.create({
        name: formData.get('name') as string,
        unit: formData.get('unit') as MaterialUnit,
        currentStock: parseFloat(formData.get('currentStock') as string) || 0,
        minStockAlert: parseFloat(formData.get('minStockAlert') as string) || 0,
      });
      toast.success('Material created successfully!', { id: loadingToast });
      setShowMaterialForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create material:', error);
      toast.error('Failed to create material. Please try again.', { id: loadingToast });
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantity = parseFloat(formData.get('quantity') as string);
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    
    const loadingToast = toast.loading(editingPurchase ? 'Updating purchase...' : 'Recording purchase...');
    
    try {
      if (editingPurchase) {
        await materialPurchasesApi.update(editingPurchase.id, {
          supplier: formData.get('supplier') as string,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        });
        toast.success('Purchase updated successfully!', { id: loadingToast });
        setEditingPurchase(null);
      } else {
        await materialPurchasesApi.create({
          materialId: parseInt(formData.get('materialId') as string),
          date: formData.get('date') as string,
          supplier: formData.get('supplier') as string,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        });
        toast.success('Purchase recorded successfully!', { id: loadingToast });
      }
      setShowPurchaseForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to save purchase:', error);
      toast.error('Failed to save purchase. Please try again.', { id: loadingToast });
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase record?')) return;
    
    const loadingToast = toast.loading('Deleting purchase...');
    
    try {
      await materialPurchasesApi.delete(id);
      toast.success('Purchase deleted successfully!', { id: loadingToast });
      loadData();
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      toast.error('Failed to delete purchase. Please try again.', { id: loadingToast });
    }
  };

  const handleCreateConsumption = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading(editingConsumption ? 'Updating consumption...' : 'Recording consumption...');
    
    try {
      if (editingConsumption) {
        await materialConsumptionApi.update(editingConsumption.id, {
          quantity: parseFloat(formData.get('quantity') as string),
          notes: formData.get('notes') as string || undefined,
        });
        toast.success('Consumption updated successfully!', { id: loadingToast });
        setEditingConsumption(null);
      } else {
        await materialConsumptionApi.create({
          materialId: parseInt(formData.get('materialId') as string),
          date: formData.get('date') as string,
          quantity: parseFloat(formData.get('quantity') as string),
          notes: formData.get('notes') as string || undefined,
        });
        toast.success('Consumption recorded successfully!', { id: loadingToast });
      }
      setShowConsumptionForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to save consumption:', error);
      toast.error('Failed to save consumption. Please try again.', { id: loadingToast });
    }
  };

  const handleDeleteConsumption = async (id: number) => {
    if (!confirm('Are you sure you want to delete this consumption record?')) return;
    
    const loadingToast = toast.loading('Deleting consumption...');
    
    try {
      await materialConsumptionApi.delete(id);
      toast.success('Consumption deleted successfully!', { id: loadingToast });
      loadData();
    } catch (error) {
      console.error('Failed to delete consumption:', error);
      toast.error('Failed to delete consumption. Please try again.', { id: loadingToast });
    }
  };

  const getStockStatus = (material: RawMaterial) => {
    const percentage = (material.currentStock / material.minStockAlert) * 100;
    if (material.currentStock <= material.minStockAlert) return 'critical';
    if (percentage <= 150) return 'low';
    return 'good';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'critical': return 'red';
      case 'low': return 'yellow';
      case 'good': return 'green';
      default: return 'gray';
    }
  };

  const getMaterialIcon = (materialName: string) => {
    const name = materialName.toLowerCase();
    if (name.includes('wood') || name.includes('oak') || name.includes('pine')) return '🪵';
    if (name.includes('paint') || name.includes('color')) return '🎨';
    if (name.includes('screw') || name.includes('nail')) return '🔩';
    if (name.includes('glue') || name.includes('adhesive')) return '🧴';
    if (name.includes('fabric') || name.includes('cloth')) return '🧵';
    return '📦';
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

  const filteredPurchases = purchases.filter(p => filterByDateRange(p.date));
  const filteredConsumption = consumption.filter(c => filterByDateRange(c.date));

  const lowStockMaterials = materials.filter(m => m.currentStock <= m.minStockAlert);
  
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = filterUnit === 'all' || material.unit === filterUnit;
    const status = getStockStatus(material);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesUnit && matchesStatus;
  });

  const materialPurchases = selectedMaterial 
    ? filteredPurchases.filter(p => p.materialId === selectedMaterial.id).slice(0, 5)
    : [];
  const materialConsumption = selectedMaterial
    ? filteredConsumption.filter(c => c.materialId === selectedMaterial.id).slice(0, 5)
    : [];

  const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalMaterialsValue = materials.reduce((sum, m) => {
    const avgPrice = purchases
      .filter(p => p.materialId === m.id)
      .reduce((total, p, _, arr) => total + p.unitPrice / arr.length, 0);
    return sum + (m.currentStock * avgPrice);
  }, 0);
  
  const selectedMaterialSpent = selectedMaterial
    ? filteredPurchases.filter(p => p.materialId === selectedMaterial.id).reduce((sum, p) => sum + p.totalPrice, 0)
    : 0;
  const selectedMaterialAvgPrice = selectedMaterial && purchases.filter(p => p.materialId === selectedMaterial.id).length > 0
    ? purchases.filter(p => p.materialId === selectedMaterial.id).reduce((sum, p) => sum + p.unitPrice, 0) / purchases.filter(p => p.materialId === selectedMaterial.id).length
    : 0;
  const selectedMaterialConsumedQty = selectedMaterial
    ? filteredConsumption.filter(c => c.materialId === selectedMaterial.id).reduce((sum, c) => sum + c.quantity, 0)
    : 0;
  const selectedMaterialConsumedValue = selectedMaterialAvgPrice > 0
    ? selectedMaterialConsumedQty * selectedMaterialAvgPrice
    : 0;
  
  const totalConsumedValue = materials.reduce((sum, m) => {
    const avgPrice = purchases
      .filter(p => p.materialId === m.id)
      .reduce((total, p, _, arr) => arr.length > 0 ? total + p.unitPrice / arr.length : 0, 0);
    const consumedQty = filteredConsumption
      .filter(c => c.materialId === m.id)
      .reduce((total, c) => total + c.quantity, 0);
    return sum + (consumedQty * avgPrice);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage inventory, purchases, and consumption
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowConsumptionHistory(true)} variant="outline">
            <TrendingDown className="h-4 w-4 mr-2" />
            View History
          </Button>
          <Button onClick={() => {
            setEditingConsumption(null);
            setShowConsumptionForm(!showConsumptionForm);
          }} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Record Consumption
          </Button>
          <Button onClick={() => {
            setEditingPurchase(null);
            setShowPurchaseForm(!showPurchaseForm);
          }} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Record Purchase
          </Button>
          <Button onClick={() => setShowMaterialForm(!showMaterialForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {startDate || endDate ? (
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="font-medium text-blue-900">Filtered Results</p>
                  <p className="text-blue-700">
                    {filteredPurchases.length} purchases • {filteredConsumption.length} consumption records
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <p className="font-medium text-gray-900">All Time</p>
                  <p className="text-gray-600">
                    {purchases.length} purchases • {consumption.length} consumption records
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{materials.length}</p>
              </div>
              <Package2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchased</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpent)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consumed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalConsumedValue)}</p>
              </div>
              <Minus className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalMaterialsValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{lowStockMaterials.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockMaterials.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockMaterials.map((material) => (
                <div key={material.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-900">{material.name}</span>
                  <span className="text-sm text-orange-700">
                    {material.currentStock} {getUnitLabel(material.unit)} (Alert: {material.minStockAlert})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showMaterialForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Material</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <Input
                label="Material Name"
                type="text"
                name="name"
                required
                placeholder="e.g., Oak Wood, White Paint"
                helperText="Enter the name of the raw material"
              />
              <Select
                label="Unit"
                name="unit"
                required
                helperText="Select the measurement unit"
              >
                <option value="">Select unit</option>
                {Object.values(MaterialUnit).map((unit) => (
                  <option key={unit} value={unit}>
                    {getUnitLabel(unit)}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Initial Stock"
                  type="number"
                  name="currentStock"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  placeholder="0.00"
                  helperText="Starting quantity"
                />
                <Input
                  label="Min Stock Alert"
                  type="number"
                  name="minStockAlert"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  placeholder="0.00"
                  helperText="Alert threshold"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowMaterialForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Material</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowPurchaseForm(false);
            setEditingPurchase(null);
          }}>
            <DialogTitle>{editingPurchase ? 'Edit Purchase' : 'Record Purchase'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePurchase} className="space-y-4">
              <Select
                label="Material"
                name="materialId"
                required
                disabled={!!editingPurchase}
                defaultValue={editingPurchase?.materialId}
                helperText="Select the material being purchased"
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({getUnitLabel(material.unit)})
                  </option>
                ))}
              </Select>
              <Input
                label="Supplier"
                type="text"
                name="supplier"
                required
                placeholder="Supplier name"
                defaultValue={editingPurchase?.supplier}
                helperText="Name of the supplier"
              />
              <Input
                label="Date"
                type="date"
                name="date"
                required
                disabled={!!editingPurchase}
                defaultValue={editingPurchase ? editingPurchase.date.split('T')[0] : new Date().toISOString().split('T')[0]}
                helperText="Purchase date"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  name="quantity"
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  defaultValue={editingPurchase?.quantity}
                  helperText="Amount purchased"
                />
                <Input
                  label="Unit Price"
                  type="number"
                  name="unitPrice"
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  defaultValue={editingPurchase?.unitPrice}
                  helperText="Price per unit"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => {
                  setShowPurchaseForm(false);
                  setEditingPurchase(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{editingPurchase ? 'Update Purchase' : 'Record Purchase'}</Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConsumptionForm} onOpenChange={setShowConsumptionForm}>
        <DialogContent>
          <DialogHeader onClose={() => {
            setShowConsumptionForm(false);
            setEditingConsumption(null);
          }}>
            <DialogTitle>{editingConsumption ? 'Edit Consumption' : 'Record Consumption'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateConsumption} className="space-y-4">
              <Select
                label="Material"
                name="materialId"
                required
                disabled={!!editingConsumption}
                defaultValue={editingConsumption?.materialId}
                helperText="Select the material being consumed"
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} (Stock: {material.currentStock} {getUnitLabel(material.unit)})
                  </option>
                ))}
              </Select>
              <Input
                label="Date"
                type="date"
                name="date"
                required
                disabled={!!editingConsumption}
                defaultValue={editingConsumption ? editingConsumption.date.split('T')[0] : new Date().toISOString().split('T')[0]}
                helperText="Consumption date"
              />
              <Input
                label="Quantity Used"
                type="number"
                name="quantity"
                required
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={editingConsumption?.quantity}
                helperText="Amount consumed from stock"
              />
              <Textarea
                label="Notes"
                name="notes"
                rows={3}
                placeholder="Add any notes about this consumption..."
                defaultValue={editingConsumption?.notes || ''}
                helperText="Optional: Record details about the usage"
              />
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => {
                  setShowConsumptionForm(false);
                  setEditingConsumption(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{editingConsumption ? 'Update Consumption' : 'Record Consumption'}</Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package2 className="h-5 w-5 mr-2" />
                Materials ({filteredMaterials.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <Input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="critical">Critical</option>
                  <option value="low">Low Stock</option>
                  <option value="good">Good Stock</option>
                </Select>
                <Select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                >
                  <option value="all">All Units</option>
                  {Object.values(MaterialUnit).map((unit) => (
                    <option key={unit} value={unit}>
                      {getUnitLabel(unit)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredMaterials.map((material) => {
                  const status = getStockStatus(material);
                  const color = getStockColor(status);
                  return (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedMaterial?.id === material.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getMaterialIcon(material.name)}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{material.name}</p>
                            <p className="text-xs text-gray-500">{getUnitLabel(material.unit)}</p>
                          </div>
                        </div>
                        {status === 'critical' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Stock</span>
                          <span className={`font-semibold ${
                            color === 'red' ? 'text-red-600' :
                            color === 'yellow' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {material.currentStock}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              color === 'red' ? 'bg-red-500' :
                              color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min((material.currentStock / (material.minStockAlert * 2)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">Alert: {material.minStockAlert}</p>
                      </div>
                    </button>
                  );
                })}
                {filteredMaterials.length === 0 && (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    {materials.length === 0 ? 'No materials yet' : 'No materials match filters'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedMaterial ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{getMaterialIcon(selectedMaterial.name)}</span>
                      <div>
                        <CardTitle>{selectedMaterial.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Unit: {getUnitLabel(selectedMaterial.unit)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{selectedMaterial.currentStock}</p>
                      <p className="text-sm text-gray-500">Current Stock</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-blue-900">Min Alert</p>
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-xl font-bold text-blue-900">{selectedMaterial.minStockAlert}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-green-900">Purchased {startDate || endDate ? '(Filtered)' : ''}</p>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xl font-bold text-green-900">
                        {filteredPurchases.filter(p => p.materialId === selectedMaterial.id).reduce((sum, p) => sum + p.quantity, 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-red-900">Consumed {startDate || endDate ? '(Filtered)' : ''}</p>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-xl font-bold text-red-900">
                        {selectedMaterialConsumedQty.toFixed(1)}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {selectedMaterialConsumedValue > 0 ? formatCurrency(selectedMaterialConsumedValue) : 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-purple-900">Spent {startDate || endDate ? '(Filtered)' : ''}</p>
                        <ShoppingCart className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(selectedMaterialSpent)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Average Unit Price</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMaterialAvgPrice > 0 ? formatCurrency(selectedMaterialAvgPrice) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Stock Value</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMaterialAvgPrice > 0 
                          ? formatCurrency(selectedMaterial.currentStock * selectedMaterialAvgPrice)
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Consumed Value</p>
                      <p className="text-lg font-semibold text-red-600">
                        {selectedMaterialConsumedValue > 0 ? formatCurrency(selectedMaterialConsumedValue) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Purchase Count</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {purchases.filter(p => p.materialId === selectedMaterial.id).length} orders
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Usage Count</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {consumption.filter(c => c.materialId === selectedMaterial.id).length} records
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Net Value</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {selectedMaterialAvgPrice > 0 
                          ? formatCurrency(selectedMaterialSpent - selectedMaterialConsumedValue)
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                      Recent Purchases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {materialPurchases.length > 0 ? (
                      <div className="space-y-3">
                        {materialPurchases.map((purchase) => (
                          <div key={purchase.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-900">{purchase.supplier}</p>
                                <p className="text-xs text-green-700">{formatDate(purchase.date)}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingPurchase(purchase);
                                    setShowPurchaseForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePurchase(purchase.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-800">
                                +{purchase.quantity} {getUnitLabel(selectedMaterial.unit)}
                              </span>
                              <span className="text-sm font-semibold text-green-900">
                                {formatCurrency(purchase.totalPrice)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8 text-sm">No purchases recorded</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Minus className="h-5 w-5 mr-2 text-red-600" />
                      Recent Consumption
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {materialConsumption.length > 0 ? (
                      <div className="space-y-3">
                        {materialConsumption.map((cons) => (
                          <div key={cons.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900">
                                  {cons.notes || 'Production use'}
                                </p>
                                <p className="text-xs text-red-700">{formatDate(cons.date)}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingConsumption(cons);
                                    setShowConsumptionForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteConsumption(cons.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-red-800">
                                -{cons.quantity} {getUnitLabel(selectedMaterial.unit)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8 text-sm">No consumption recorded</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a material to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showConsumptionHistory} onOpenChange={setShowConsumptionHistory}>
        <DialogContent className="max-w-6xl">
          <DialogHeader onClose={() => setShowConsumptionHistory(false)}>
            <DialogTitle>Consumption History</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Material</label>
                    <Select
                      value={consumptionFilterMaterial}
                      onChange={(e) => setConsumptionFilterMaterial(e.target.value ? parseInt(e.target.value) : '')}
                    >
                      <option value="">All Materials</option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={consumptionStartDate}
                      onChange={(e) => setConsumptionStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={consumptionEndDate}
                      onChange={(e) => setConsumptionEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConsumptionFilterMaterial('');
                      setConsumptionStartDate('');
                      setConsumptionEndDate('');
                    }}
                  >
                    Clear Filters
                  </Button>
                  <div className="ml-auto text-sm text-gray-600 flex items-center">
                    Showing {consumption.filter(c => {
                      const matchesMaterial = !consumptionFilterMaterial || c.materialId === consumptionFilterMaterial;
                      const matchesDate = (!consumptionStartDate || new Date(c.date) >= new Date(consumptionStartDate)) &&
                                         (!consumptionEndDate || new Date(c.date) <= new Date(consumptionEndDate));
                      return matchesMaterial && matchesDate;
                    }).length} records
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consumption
                        .filter(c => {
                          const matchesMaterial = !consumptionFilterMaterial || c.materialId === consumptionFilterMaterial;
                          const matchesDate = (!consumptionStartDate || new Date(c.date) >= new Date(consumptionStartDate)) &&
                                             (!consumptionEndDate || new Date(c.date) <= new Date(consumptionEndDate));
                          return matchesMaterial && matchesDate;
                        })
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((cons) => {
                          const material = materials.find(m => m.id === cons.materialId);
                          return (
                            <tr key={cons.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(cons.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-xl mr-2">{material ? getMaterialIcon(material.name) : '📦'}</span>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {material?.name || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {material ? getUnitLabel(material.unit) : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-red-600">
                                  -{cons.quantity} {material ? getUnitLabel(material.unit) : ''}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {cons.notes || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingConsumption(cons);
                                      setShowConsumptionForm(true);
                                      setShowConsumptionHistory(false);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConsumption(cons.id)}
                                    className="text-red-600 hover:text-red-900"
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
                  {consumption.filter(c => {
                    const matchesMaterial = !consumptionFilterMaterial || c.materialId === consumptionFilterMaterial;
                    const matchesDate = (!consumptionStartDate || new Date(c.date) >= new Date(consumptionStartDate)) &&
                                       (!consumptionEndDate || new Date(c.date) <= new Date(consumptionEndDate));
                    return matchesMaterial && matchesDate;
                  }).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {consumption.length === 0 ? 'No consumption records yet' : 'No records match the selected filters'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
