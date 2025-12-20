import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { furnitureModelsApi } from '@/services/api';
import type { FurnitureModel } from '@/types';
import { Plus, Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Models() {
  const [models, setModels] = useState<FurnitureModel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
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

  const handleCreateModel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading('Creating furniture model...');
    
    try {
      await furnitureModelsApi.create({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
      });
      toast.success('Furniture model created successfully!', { id: loadingToast });
      setShowForm(false);
      loadModels();
    } catch (error) {
      console.error('Failed to create model:', error);
      toast.error('Failed to create model. Please try again.', { id: loadingToast });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Furniture Models</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage furniture product models
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
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
              <Textarea
                label="Description"
                name="description"
                rows={3}
                placeholder="Describe the furniture model..."
                helperText="Optional: Add details about materials, dimensions, or features"
              />
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card key={model.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Added {formatDate(model.createdAt)}
                    </p>
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
