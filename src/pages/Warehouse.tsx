import { useState, useEffect } from 'react';
import { Plus, Warehouse as WarehouseIcon, Package, ArrowRightLeft, Trash2, Search, Edit2 } from 'lucide-react';
import { warehouseApi } from '../services/api';
import type { Warehouse, FinishedProductInventory } from '../types';

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<FinishedProductInventory[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'warehouses' | 'inventory'>('inventory');
  const [showWHForm, setShowWHForm] = useState(false);
  const [showInvForm, setShowInvForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [whForm, setWhForm] = useState({ name: '', code: '', address: '', description: '' });
  const [invForm, setInvForm] = useState({ modelId: 0, warehouseId: 0, sku: '', quantity: 1, productionCost: 0, batchNumber: '', productionDate: '' });
  const [transferForm, setTransferForm] = useState({ productId: 0, fromWarehouseId: 0, toWarehouseId: 0, quantity: 1, notes: '' });
  const [editingWH, setEditingWH] = useState<Warehouse | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [w, i] = await Promise.all([warehouseApi.getAll(), warehouseApi.getAllInventory(selectedWarehouse)]);
      setWarehouses(w.data);
      setInventory(i.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [selectedWarehouse]);

  const handleCreateWH = async () => {
    try {
      if (editingWH) {
        await warehouseApi.update(editingWH.id, whForm);
      } else {
        await warehouseApi.create(whForm);
      }
      setShowWHForm(false);
      setEditingWH(null);
      setWhForm({ name: '', code: '', address: '', description: '' });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const handleDeleteWH = async (id: number) => {
    if (!confirm('Supprimer cet entrepôt ?')) return;
    try { await warehouseApi.delete(id); loadAll(); } catch (e) { console.error(e); }
  };

  const handleAddInventory = async () => {
    try {
      await warehouseApi.addInventory(invForm);
      setShowInvForm(false);
      setInvForm({ modelId: 0, warehouseId: 0, sku: '', quantity: 1, productionCost: 0, batchNumber: '', productionDate: '' });
      loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const handleTransfer = async () => {
    try {
      await warehouseApi.transfer(transferForm);
      setShowTransferForm(false);
      loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const filtered = inventory.filter(p => {
    const name = p.model?.name ?? p.sku;
    return name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
  });

  const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);
  const lowStock = inventory.filter(i => i.quantity <= 5).length;
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.productionCost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Entrepôts & Stock</h1><p className="text-sm text-gray-500 mt-1">Gestion des produits finis</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransferForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"><ArrowRightLeft size={16} /> Transfert</button>
          <button onClick={() => setShowInvForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"><Package size={16} /> Ajouter Stock</button>
          <button onClick={() => { setEditingWH(null); setWhForm({ name: '', code: '', address: '', description: '' }); setShowWHForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"><Plus size={16} /> Entrepôt</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Entrepôts</p><p className="text-2xl font-bold mt-1">{warehouses.length}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Total Pièces</p><p className="text-2xl font-bold mt-1 text-blue-600">{totalItems.toLocaleString('fr-FR')}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Stock Faible (&le;5)</p><p className="text-2xl font-bold mt-1 text-orange-600">{lowStock}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Valeur Stock</p><p className="text-2xl font-bold mt-1 text-green-600">{totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="border-b flex">
          {(['inventory', 'warehouses'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'inventory' ? 'Inventaire' : 'Entrepôts'}
            </button>
          ))}
        </div>

        {tab === 'inventory' && (
          <div className="p-4 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher produit..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" /></div>
              <select value={selectedWarehouse ?? ''} onChange={e => setSelectedWarehouse(e.target.value ? Number(e.target.value) : undefined)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Tous les entrepôts</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {loading ? <p className="text-center py-8 text-gray-400">Chargement...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50"><th className="text-left p-3 font-medium text-gray-600">Produit</th><th className="text-left p-3 font-medium text-gray-600">SKU</th><th className="text-left p-3 font-medium text-gray-600">Entrepôt</th><th className="text-left p-3 font-medium text-gray-600">Lot</th><th className="text-right p-3 font-medium text-gray-600">Qté</th><th className="text-right p-3 font-medium text-gray-600">Coût/pièce</th><th className="text-right p-3 font-medium text-gray-600">Valeur</th><th className="text-center p-3 font-medium text-gray-600">Statut</th></tr></thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{p.model?.name ?? '—'}<p className="text-xs text-gray-400">{p.model?.size}</p></td>
                        <td className="p-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                        <td className="p-3">{p.warehouse?.name ?? '—'}</td>
                        <td className="p-3 text-gray-500 text-xs">{p.batchNumber ?? '—'}</td>
                        <td className={`p-3 text-right font-bold ${p.quantity <= 5 ? 'text-orange-600' : 'text-gray-900'}`}>{p.quantity}</td>
                        <td className="p-3 text-right text-gray-600">{p.productionCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
                        <td className="p-3 text-right font-medium text-blue-600">{(p.quantity * p.productionCost).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
                        <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${p.quantity > 10 ? 'bg-green-100 text-green-700' : p.quantity > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.quantity > 10 ? 'OK' : p.quantity > 0 ? 'Faible' : 'Épuisé'}</span></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucun produit</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'warehouses' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map(w => (
                <div key={w.id} className="border rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2"><WarehouseIcon size={20} className="text-blue-500" /><div><p className="font-semibold text-gray-900">{w.name}</p>{w.code && <p className="text-xs text-gray-400">{w.code}</p>}</div></div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingWH(w); setWhForm({ name: w.name, code: w.code ?? '', address: w.address ?? '', description: w.description ?? '' }); setShowWHForm(true); }} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteWH(w.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {w.address && <p className="text-xs text-gray-400 mt-2">{w.address}</p>}
                  <p className="text-sm text-gray-500 mt-2">{w._count?.inventoryItems ?? 0} références</p>
                </div>
              ))}
              {warehouses.length === 0 && <p className="col-span-3 text-center py-8 text-gray-400">Aucun entrepôt</p>}
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Form Modal */}
      {showWHForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editingWH ? 'Modifier' : 'Nouvel'} Entrepôt</h2>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Nom *</label><input value={whForm.name} onChange={e => setWhForm(p => ({ ...p, name: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Code</label><input value={whForm.code} onChange={e => setWhForm(p => ({ ...p, code: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Adresse</label><input value={whForm.address} onChange={e => setWhForm(p => ({ ...p, address: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Description</label><input value={whForm.description} onChange={e => setWhForm(p => ({ ...p, description: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowWHForm(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleCreateWH} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Modal */}
      {showInvForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Ajouter au Stock</h2>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Entrepôt *</label>
                <select value={invForm.warehouseId} onChange={e => setInvForm(p => ({ ...p, warehouseId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">SKU *</label><input value={invForm.sku} onChange={e => setInvForm(p => ({ ...p, sku: e.target.value }))} placeholder="ex: PROD-001" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Quantité *</label><input type="number" value={invForm.quantity} onChange={e => setInvForm(p => ({ ...p, quantity: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" min={1} /></div>
              <div><label className="text-sm font-medium text-gray-700">Coût de production (DA)</label><input type="number" value={invForm.productionCost} onChange={e => setInvForm(p => ({ ...p, productionCost: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">N° de lot</label><input value={invForm.batchNumber} onChange={e => setInvForm(p => ({ ...p, batchNumber: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Date de production</label><input type="date" value={invForm.productionDate} onChange={e => setInvForm(p => ({ ...p, productionDate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowInvForm(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleAddInventory} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Transfert de Stock</h2>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Produit *</label>
                <select value={transferForm.productId} onChange={e => setTransferForm(p => ({ ...p, productId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {inventory.map(p => <option key={p.id} value={p.id}>{p.model?.name ?? p.sku} — {p.warehouse?.name} ({p.quantity} dispo)</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">De l'entrepôt *</label>
                <select value={transferForm.fromWarehouseId} onChange={e => setTransferForm(p => ({ ...p, fromWarehouseId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Vers l'entrepôt *</label>
                <select value={transferForm.toWarehouseId} onChange={e => setTransferForm(p => ({ ...p, toWarehouseId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {warehouses.filter(w => w.id !== transferForm.fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Quantité *</label><input type="number" value={transferForm.quantity} onChange={e => setTransferForm(p => ({ ...p, quantity: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" min={1} /></div>
              <div><label className="text-sm font-medium text-gray-700">Notes</label><input value={transferForm.notes} onChange={e => setTransferForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowTransferForm(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleTransfer} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Transférer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
