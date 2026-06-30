import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { furnitureModelsApi, rawMaterialsApi } from '@/services/api';
import type { FurnitureModel, RawMaterial, ModelMaterialRequirement } from '@/types';
import { FurnitureSize, ProductionStep } from '@/types';
import { Plus, Package, Ruler, Trash2 } from 'lucide-react';
import { formatDate, getSizeLabel, getStepLabel, getUnitLabel } from '@/lib/utils';
import { PageLoading } from '@/components/ui/Loading';
import { PrintButton } from '@/components/ui/PrintButton';
import { printDocument } from '@/lib/print';

export function Models() {
  const [models, setModels] = useState<FurnitureModel[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [materialRequirements, setMaterialRequirements] = useState<ModelMaterialRequirement[]>([]);

  useEffect(() => {
    loadModels();
    loadRawMaterials();
  }, []);

  const loadModels = async () => {
    try {
      const response = await furnitureModelsApi.getAll();
      setModels(response.data);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load furniture models');
    } finally {
      setLoading(false);
    }
  };

  const loadRawMaterials = async () => {
    try {
      const response = await rawMaterialsApi.getAll();
      setRawMaterials(response.data);
    } catch (error) {
      console.error('Failed to load raw materials:', error);
    }
  };

  const addMaterialRequirement = (step: ProductionStep) => {
    setMaterialRequirements(prev => [...prev, { id: 0, modelId: 0, step, materialId: 0, quantity: 0, createdAt: '', updatedAt: '' }]);
  };

  const updateMaterialRequirement = (index: number, field: keyof ModelMaterialRequirement, value: string | number) => {
    setMaterialRequirements(prev => prev.map((req, i) => i === index ? { ...req, [field]: value } : req));
  };

  const removeMaterialRequirement = (index: number) => {
    setMaterialRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateModel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading('Creating furniture model...');
    
    try {
      const validRequirements = materialRequirements
        .filter(req => req.materialId > 0 && req.quantity > 0)
        .map(req => ({ step: req.step, materialId: req.materialId, quantity: req.quantity }));

      await furnitureModelsApi.create({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        size: formData.get('size') as FurnitureSize,
        materialRequirements: validRequirements,
      });
      toast.success('Furniture model created successfully!', { id: loadingToast });
      setShowForm(false);
      setMaterialRequirements([]);
      loadModels();
    } catch (error) {
      console.error('Failed to create model:', error);
      toast.error('Failed to create model. Please try again.', { id: loadingToast });
    }
  };

  const printModel = (model: FurnitureModel) => {
    printDocument({
      title: 'Furniture Model',
      subtitle: `#${model.id}`,
      fields: [
        { label: 'Name', value: model.name },
        { label: 'Size', value: getSizeLabel(model.size) },
        { label: 'Description', value: model.description || '-' },
        { label: 'Created', value: formatDate(model.createdAt) },
      ],
    });
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Furniture Models</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600">
            Manage furniture product models
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Furniture Model</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateModel} className="space-y-4">
              <Input
                label="Model Name"
                name="name"
                type="text"
                required
                placeholder="e.g., Oak Dining Table, Modern Sofa"
                helperText="Enter a descriptive name for the furniture model"
              />
              <Select
                label="Size"
                name="size"
                required
                helperText="Select the furniture size"
              >
                <option value="">Select size...</option>
                <option value={FurnitureSize.SIZE_45CM}>45cm</option>
                <option value={FurnitureSize.SIZE_60CM}>60cm</option>
                <option value={FurnitureSize.SIZE_80CM}>80cm</option>
                <option value={FurnitureSize.SIZE_100CM}>100cm</option>
                <option value={FurnitureSize.SIZE_120CM}>120cm</option>
              </Select>
              <Textarea
                label="Description"
                name="description"
                rows={3}
                placeholder="Describe the furniture model..."
                helperText="Optional: Add details about materials, dimensions, or features"
              />

              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Required Raw Materials</h3>
                  <span className="text-xs text-gray-500">Add materials for each production step</span>
                </div>

                {Object.values(ProductionStep).map((step) => {
                  const stepRequirements = materialRequirements.filter(r => r.step === step);
                  return (
                    <div key={step} className="border rounded-md p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-800">{getStepLabel(step)}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addMaterialRequirement(step)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add material
                        </Button>
                      </div>
                      {stepRequirements.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No materials required for this step</p>
                      ) : (
                        <div className="space-y-2">
                          {stepRequirements.map((req) => {
                            const globalIndex = materialRequirements.findIndex(r => r === req);
                            return (
                              <div key={globalIndex} className="flex items-end gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">Material</label>
                                  <select
                                    value={req.materialId}
                                    onChange={(e) => updateMaterialRequirement(globalIndex, 'materialId', parseInt(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                                    required
                                  >
                                    <option value="">Select material...</option>
                                    {rawMaterials.map(m => (
                                      <option key={m.id} value={m.id}>{m.name} ({getUnitLabel(m.unit)})</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="w-28">
                                  <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={req.quantity || ''}
                                    onChange={(e) => updateMaterialRequirement(globalIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMaterialRequirement(globalIndex)}
                                  className="p-2 rounded-md text-red-600 hover:bg-red-50"
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Model</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card key={model.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Ruler className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-medium text-primary">
                        {getSizeLabel(model.size)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Added {formatDate(model.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {model.description ? (
                <p className="text-sm text-gray-600">{model.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No description</p>
              )}
              {model.materialRequirements && model.materialRequirements.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Required Materials</p>
                  <div className="space-y-2">
                    {Object.values(ProductionStep).map(step => {
                      const stepReqs = model.materialRequirements!.filter(r => r.step === step);
                      if (stepReqs.length === 0) return null;
                      return (
                        <div key={step}>
                          <p className="text-xs font-medium text-primary">{getStepLabel(step)}</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {stepReqs.map(req => (
                              <li key={req.id}>
                                {req.material?.name || 'Unknown'} — {req.quantity} {getUnitLabel(req.material?.unit || '')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <PrintButton onClick={() => printModel(model)} label="Print model" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {models.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No furniture models yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by adding your first furniture model
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Model
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
