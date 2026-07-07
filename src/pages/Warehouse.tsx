import { useState, useEffect } from 'react';
import {
  Plus, Warehouse as WarehouseIcon, Package, ArrowRightLeft, Trash2,
  Search, Edit2, TrendingUp, AlertTriangle, DollarSign, BarChart2, Boxes,
} from 'lucide-react';
import { warehouseApi } from '../services/api';
import type { Warehouse, FinishedProductInventory } from '../types';

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString('fr-FR');

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<FinishedProductInventory[]>([]);
  const [allInventory, setAllInventory] = useState<FinishedProductInventory[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'analytics' | 'inventory' | 'warehouses'>('analytics');
  const [showWHForm, setShowWHForm] = useState(false);
  const [showInvForm, setShowInvForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [whForm, setWhForm] = useState({ name: '', code: '', address: '', description: '' });
  const [invForm, setInvForm] = useState({ modelId: 0, warehouseId: 0, sku: '', color: '', quantity: 1, productionCost: 0, batchNumber: '', productionDate: '' });
  const [transferForm, setTransferForm] = useState({ productId: 0, fromWarehouseId: 0, toWarehouseId: 0, quantity: 1, notes: '' });
  const [editingWH, setEditingWH] = useState<Warehouse | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [w, i, all] = await Promise.all([
        warehouseApi.getAll(),
        warehouseApi.getAllInventory(selectedWarehouse),
        warehouseApi.getAllInventory(undefined),
      ]);
      setWarehouses(w.data);
      setInventory(i.data);
      setAllInventory(all.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [selectedWarehouse]);

  const handleCreateWH = async () => {
    try {
      if (editingWH) { await warehouseApi.update(editingWH.id, whForm); }
      else { await warehouseApi.create(whForm); }
      setShowWHForm(false); setEditingWH(null);
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
      setInvForm({ modelId: 0, warehouseId: 0, sku: '', color: '', quantity: 1, productionCost: 0, batchNumber: '', productionDate: '' });
      loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const handleTransfer = async () => {
    try {
      await warehouseApi.transfer(transferForm);
      setShowTransferForm(false); loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const handleRecalculateCosts = async () => {
    try {
      const res = await warehouseApi.recalculateCosts();
      alert((res.data as any).message ?? 'Coûts recalculés');
      loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const filtered = inventory.filter(p => {
    const s = search.toLowerCase();
    const name = p.model?.name ?? p.sku;
    return name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.color ?? '').toLowerCase().includes(s);
  });

  // ── KPI computations (always from allInventory for accuracy) ──────────────
  const totalItems = allInventory.reduce((s, i) => s + i.quantity, 0);
  const outOfStock = allInventory.filter(i => i.quantity === 0).length;
  const lowStock = allInventory.filter(i => i.quantity > 0 && i.quantity <= 5).length;
  const goodStock = allInventory.filter(i => i.quantity > 10).length;
  const totalValue = allInventory.reduce((s, i) => s + i.quantity * i.productionCost, 0);
  const avgCostPerPiece = totalItems > 0
    ? allInventory.reduce((s, i) => s + i.productionCost * i.quantity, 0) / totalItems
    : 0;

  // ── Analytics: stock per warehouse ────────────────────────────────────────
  const byWarehouse = warehouses.map(w => {
    const items = allInventory.filter(i => i.warehouseId === w.id);
    const qty = items.reduce((s, i) => s + i.quantity, 0);
    const val = items.reduce((s, i) => s + i.quantity * i.productionCost, 0);
    return { ...w, qty, val, refs: items.length };
  });
  const maxWHQty = Math.max(1, ...byWarehouse.map(w => w.qty));

  // ── Analytics: cost per product (group by model) ──────────────────────────
  const byProduct: Record<string, { name: string; qty: number; totalCost: number; avgCost: number }> = {};
  allInventory.forEach(item => {
    const key = item.model?.name ?? item.sku;
    if (!byProduct[key]) byProduct[key] = { name: key, qty: 0, totalCost: 0, avgCost: 0 };
    byProduct[key].qty += item.quantity;
    byProduct[key].totalCost += item.quantity * item.productionCost;
  });
  Object.values(byProduct).forEach(p => { p.avgCost = p.qty > 0 ? p.totalCost / p.qty : 0; });
  const productList = Object.values(byProduct).sort((a, b) => b.totalCost - a.totalCost);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrepôts & Stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des produits finis</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleRecalculateCosts} className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"><DollarSign size={16} /> Recalculer Coûts</button>
          <button onClick={() => setShowTransferForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"><ArrowRightLeft size={16} /> Transfert</button>
          <button onClick={() => setShowInvForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"><Package size={16} /> Ajouter Stock</button>
          <button onClick={() => { setEditingWH(null); setWhForm({ name: '', code: '', address: '', description: '' }); setShowWHForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"><Plus size={16} /> Entrepôt</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Entrepôts', value: warehouses.length, icon: <WarehouseIcon size={18} />, color: 'text-gray-700', bg: 'bg-gray-100' },
          { label: 'Total pièces', value: fmtInt(totalItems), icon: <Boxes size={18} />, color: 'text-blue-700', bg: 'bg-blue-100' },
          { label: 'Valeur stock', value: `${fmt(totalValue)} DA`, icon: <DollarSign size={18} />, color: 'text-green-700', bg: 'bg-green-100' },
          { label: 'Coût moy./pièce', value: `${fmt(avgCostPerPiece)} DA`, icon: <TrendingUp size={18} />, color: 'text-purple-700', bg: 'bg-purple-100' },
          { label: 'Stock faible (≤5)', value: lowStock, icon: <AlertTriangle size={18} />, color: 'text-orange-700', bg: 'bg-orange-100' },
          { label: 'Épuisé', value: outOfStock, icon: <BarChart2 size={18} />, color: 'text-red-700', bg: 'bg-red-100' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${k.bg} ${k.color} shrink-0`}>{k.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{k.label}</p>
              <p className={`text-base font-bold mt-0.5 truncate ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="border-b flex">
          {(['analytics', 'inventory', 'warehouses'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'analytics' ? '📊 Analytique' : t === 'inventory' ? 'Inventaire' : 'Entrepôts'}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className="p-5 space-y-6">
            {/* Stock health pie-like bars */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Santé du stock</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Bon stock (>10)', value: goodStock, total: allInventory.length, color: 'bg-green-500' },
                  { label: 'Stock faible (1–5)', value: lowStock, total: allInventory.length, color: 'bg-orange-400' },
                  { label: 'Épuisé (0)', value: outOfStock, total: allInventory.length, color: 'bg-red-500' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className={`${s.color} h-2 rounded-full`} style={{ width: s.total > 0 ? `${(s.value / s.total) * 100}%` : '0%' }} />
                    </div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">{s.total > 0 ? Math.round((s.value / s.total) * 100) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock & Value per warehouse */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Répartition par entrepôt</h3>
              {byWarehouse.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucun entrepôt</p>
              ) : (
                <div className="space-y-3">
                  {byWarehouse.map(w => (
                    <div key={w.id} className="border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon size={16} className="text-blue-500 shrink-0" />
                          <span className="font-medium text-sm text-gray-900">{w.name}</span>
                          {w.code && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{w.code}</span>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-700">{fmtInt(w.qty)} pcs</p>
                          <p className="text-xs text-gray-500">{fmt(w.val)} DA</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(w.qty / maxWHQty) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{w.refs} références</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coût/pièce per product */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Coût de production par produit</h3>
              {productList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucun produit en stock</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-600">Produit</th>
                        <th className="text-right p-3 font-medium text-gray-600">Qté totale</th>
                        <th className="text-right p-3 font-medium text-gray-600">Coût/pièce moy.</th>
                        <th className="text-right p-3 font-medium text-gray-600">Valeur totale</th>
                        <th className="p-3 font-medium text-gray-600 w-32">Part de valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productList.map((p, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">{p.name}</td>
                          <td className="p-3 text-right text-gray-700">{fmtInt(p.qty)}</td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full text-xs">
                              {fmt(p.avgCost)} DA
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-blue-700">{fmt(p.totalCost)} DA</td>
                          <td className="p-3">
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: totalValue > 0 ? `${(p.totalCost / totalValue) * 100}%` : '0%' }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{totalValue > 0 ? Math.round((p.totalCost / totalValue) * 100) : 0}%</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold text-gray-800">
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right">{fmtInt(totalItems)}</td>
                        <td className="p-3 text-right text-purple-700">{fmt(avgCostPerPiece)} DA</td>
                        <td className="p-3 text-right text-blue-700">{fmt(totalValue)} DA</td>
                        <td className="p-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INVENTORY TAB ── */}
        {tab === 'inventory' && (
          <div className="p-4 space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher produit..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" /></div>
              <select value={selectedWarehouse ?? ''} onChange={e => setSelectedWarehouse(e.target.value ? Number(e.target.value) : undefined)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Tous les entrepôts</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {loading ? <p className="text-center py-8 text-gray-400">Chargement...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-600">Produit</th>
                      <th className="text-left p-3 font-medium text-gray-600">Couleur</th>
                      <th className="text-left p-3 font-medium text-gray-600">SKU</th>
                      <th className="text-left p-3 font-medium text-gray-600">Entrepôt</th>
                      <th className="text-left p-3 font-medium text-gray-600">Lot</th>
                      <th className="text-right p-3 font-medium text-gray-600">Qté</th>
                      <th className="text-right p-3 font-medium text-gray-600 bg-purple-50">Coût/pièce</th>
                      <th className="text-right p-3 font-medium text-gray-600">Valeur</th>
                      <th className="text-center p-3 font-medium text-gray-600">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{p.model?.name ?? '—'}<p className="text-xs text-gray-400">{p.model?.size}</p></td>
                        <td className="p-3 text-gray-700">{p.color ?? '—'}</td>
                        <td className="p-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                        <td className="p-3">{p.warehouse?.name ?? '—'}</td>
                        <td className="p-3 text-gray-500 text-xs">{p.batchNumber ?? '—'}</td>
                        <td className={`p-3 text-right font-bold ${p.quantity <= 5 ? 'text-orange-600' : 'text-gray-900'}`}>{p.quantity}</td>
                        <td className="p-3 text-right bg-purple-50">
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full text-xs">
                            {fmt(p.productionCost)} DA
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-blue-600">{fmt(p.quantity * p.productionCost)} DA</td>
                        <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.quantity > 10 ? 'bg-green-100 text-green-700' : p.quantity > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.quantity > 10 ? 'OK' : p.quantity > 0 ? 'Faible' : 'Épuisé'}</span></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Aucun produit</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── WAREHOUSES TAB ── */}
        {tab === 'warehouses' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map(w => {
                const wh = byWarehouse.find(b => b.id === w.id);
                return (
                  <div key={w.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2"><WarehouseIcon size={20} className="text-blue-500" /><div><p className="font-semibold text-gray-900">{w.name}</p>{w.code && <p className="text-xs text-gray-400">{w.code}</p>}</div></div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingWH(w); setWhForm({ name: w.name, code: w.code ?? '', address: w.address ?? '', description: w.description ?? '' }); setShowWHForm(true); }} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteWH(w.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {w.address && <p className="text-xs text-gray-400 mb-2">{w.address}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-blue-600">Pièces</p>
                        <p className="font-bold text-blue-700">{fmtInt(wh?.qty ?? 0)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-600">Valeur</p>
                        <p className="font-bold text-green-700 text-xs">{fmt(wh?.val ?? 0)} DA</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{w._count?.inventoryItems ?? wh?.refs ?? 0} références</p>
                  </div>
                );
              })}
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
              <div><label className="text-sm font-medium text-gray-700">Couleur de peinture</label><input value={invForm.color} onChange={e => setInvForm(p => ({ ...p, color: e.target.value }))} placeholder="ex: Blanc, Noir, Gris..." className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Quantité *</label><input type="number" value={invForm.quantity} onChange={e => setInvForm(p => ({ ...p, quantity: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" min={1} /></div>
              <div><label className="text-sm font-medium text-gray-700">Coût/pièce de production (DA)</label><input type="number" value={invForm.productionCost} onChange={e => setInvForm(p => ({ ...p, productionCost: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
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
