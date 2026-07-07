import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, CheckCircle, Trash2, CreditCard, Search } from 'lucide-react';
import { salesApi, clientApi, warehouseApi, moneyBoxApi } from '../services/api';
import type { SalesOrder, Client, FinishedProductInventory, MoneyBox } from '../types';
import { SalesOrderStatus, PaymentStatus } from '../types';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Brouillon', CONFIRMED: 'Confirmé', SHIPPED: 'Expédié', DELIVERED: 'Livré', CANCELLED: 'Annulé' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', CONFIRMED: 'bg-blue-100 text-blue-700', SHIPPED: 'bg-yellow-100 text-yellow-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };
const PAYMENT_COLORS: Record<string, string> = { NOT_PAID: 'bg-red-100 text-red-700', PART_PAID: 'bg-yellow-100 text-yellow-700', PAID: 'bg-green-100 text-green-700' };

type OrderItem = { productId: number; quantity: number; unitPrice: number; discount: number };

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<FinishedProductInventory[]>([]);
  const [boxes, setBoxes] = useState<MoneyBox[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ clientId: 0, salesperson: '', orderDate: new Date().toISOString().split('T')[0], discount: 0, tax: 0, notes: '' });
  const [items, setItems] = useState<OrderItem[]>([{ productId: 0, quantity: 1, unitPrice: 0, discount: 0 }]);
  const [payForm, setPayForm] = useState({ moneyBoxId: 0, date: new Date().toISOString().split('T')[0], amount: 0, paymentMethod: 'CASH', reference: '', notes: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, c, inv, b] = await Promise.all([salesApi.getAll(), clientApi.getAll(), warehouseApi.getAllInventory(), moneyBoxApi.getAll()]);
      setOrders(o.data);
      setClients(c.data);
      setInventory(inv.data);
      setBoxes(b.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const selectOrder = async (id: number) => {
    try { const r = await salesApi.getById(id); setSelectedOrder(r.data); } catch (e) { console.error(e); }
  };

  const addItem = () => setItems(p => [...p, { productId: 0, quantity: 1, unitPrice: 0, discount: 0 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof OrderItem, val: number) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const getProductLabel = (p: FinishedProductInventory) => {
    const name = p.model?.name ?? p.sku;
    const color = p.color ? ` - ${p.color}` : '';
    return `${name}${color}`;
  };

  const getProductCost = (productId: number) => {
    const product = inventory.find(p => p.id === productId);
    return product?.productionCost ?? 0;
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discount / 100), 0);
  const totalCost = items.reduce((s, i) => s + i.quantity * getProductCost(i.productId), 0);
  const total = subtotal - form.discount + form.tax;
  const totalProfit = total - totalCost;

  const handleCreate = async () => {
    try {
      await salesApi.create({ ...form, items });
      setShowForm(false);
      setItems([{ productId: 0, quantity: 1, unitPrice: 0, discount: 0 }]);
      setForm({ clientId: 0, salesperson: '', orderDate: new Date().toISOString().split('T')[0], discount: 0, tax: 0, notes: '' });
      loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const handleConfirm = async (id: number) => {
    try { await salesApi.confirm(id); loadAll(); if (selectedOrder?.id === id) selectOrder(id); } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette commande ?')) return;
    try { await salesApi.delete(id); if (selectedOrder?.id === id) setSelectedOrder(null); loadAll(); } catch (e) { console.error(e); }
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;
    try {
      await salesApi.recordPayment(selectedOrder.id, payForm);
      setShowPaymentForm(false);
      selectOrder(selectedOrder.id);
      loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const filtered = orders.filter(o => {
    const clientName = `${o.client?.firstName ?? ''} ${o.client?.lastName ?? ''}`.toLowerCase();
    return clientName.includes(search.toLowerCase()) || String(o.id).includes(search);
  });

  const totalRevenue = orders.filter(o => o.status !== SalesOrderStatus.CANCELLED).reduce((s, o) => s + o.total, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Ventes</h1><p className="text-sm text-gray-500 mt-1">Commandes & Paiements clients</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"><Plus size={16} /> Nouvelle Vente</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Total Commandes</p><p className="text-2xl font-bold mt-1">{orders.length}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Chiffre d'Affaires</p><p className="text-2xl font-bold mt-1 text-blue-600">{totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Total Encaissé</p><p className="text-2xl font-bold mt-1 text-green-600">{totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Impayé</p><p className="text-2xl font-bold mt-1 text-red-600">{(totalRevenue - totalPaid).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" /></div>
          </div>
          {loading ? <p className="text-center py-8 text-gray-400">Chargement...</p> : (
            <div className="divide-y">
              {filtered.map(o => (
                <div key={o.id} onClick={() => selectOrder(o.id)} className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedOrder?.id === o.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Commande #{o.id}</p>
                      <p className="text-xs text-gray-500">{o.client?.firstName} {o.client?.lastName}</p>
                      <p className="text-xs text-gray-400">{new Date(o.orderDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-gray-900">{o.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                      <br />
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_COLORS[o.paymentStatus]}`}>{o.paymentStatus === 'PAID' ? 'Payé' : o.paymentStatus === 'PART_PAID' ? 'Partiel' : 'Impayé'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center py-8 text-gray-400">Aucune commande</p>}
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="w-96 space-y-4">
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-gray-900">Commande #{selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">{selectedOrder.client?.firstName} {selectedOrder.client?.lastName}</p>
                </div>
                <div className="flex gap-1">
                  {selectedOrder.status === SalesOrderStatus.DRAFT && <button onClick={() => handleConfirm(selectedOrder.id)} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs"><CheckCircle size={12} /> Confirmer</button>}
                  <button onClick={() => handleDelete(selectedOrder.id)} className="p-1.5 text-gray-400 hover:text-red-500 border rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Date</p><p className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString('fr-FR')}</p></div>
                <div><p className="text-gray-400 text-xs">Statut</p><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedOrder.status]}`}>{STATUS_LABELS[selectedOrder.status]}</span></div>
                <div><p className="text-gray-400 text-xs">Total</p><p className="font-bold text-gray-900">{selectedOrder.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
                <div><p className="text-gray-400 text-xs">Payé</p><p className="font-bold text-green-600">{selectedOrder.paidAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
                <div className="col-span-2"><p className="text-gray-400 text-xs">Reste à payer</p><p className="font-bold text-red-600">{(selectedOrder.total - selectedOrder.paidAmount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
              </div>
              {selectedOrder.status !== SalesOrderStatus.CANCELLED && selectedOrder.paymentStatus !== PaymentStatus.PAID && (
                <button onClick={() => setShowPaymentForm(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <CreditCard size={16} /> Enregistrer Paiement
                </button>
              )}
            </div>
            {selectedOrder.items && selectedOrder.items.length > 0 && (() => {
              const orderTotalCost = selectedOrder.items.reduce((s, item) => s + item.quantity * (item.product?.productionCost ?? 0), 0);
              const orderProfit = selectedOrder.total - orderTotalCost;
              return (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-3 border-b"><p className="font-medium text-sm">Articles</p></div>
                <div className="divide-y">
                  {selectedOrder.items.map(item => {
                    const cost = item.product?.productionCost ?? 0;
                    const profit = item.total - item.quantity * cost;
                    const productName = item.product?.model?.name ?? `Produit #${item.productId}`;
                    const colorLabel = item.product?.color ? ` - ${item.product.color}` : '';
                    return (
                    <div key={item.id} className="p-3 text-sm">
                      <div className="flex justify-between">
                        <div><p className="font-medium">{productName}{colorLabel}</p><p className="text-xs text-gray-400">{item.quantity} × {item.unitPrice.toLocaleString('fr-FR')} DA</p></div>
                        <p className="font-bold">{item.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      </div>
                      <div className="mt-1 flex gap-3 text-xs">
                        <span className="text-gray-400">Coût: <span className="font-medium text-gray-600">{(item.quantity * cost).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></span>
                        <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Bénéfice: {profit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t bg-gray-50 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Coût total</span><span className="font-medium text-gray-700">{orderTotalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
                  <div className="flex justify-between font-bold text-sm"><span className={orderProfit >= 0 ? 'text-green-600' : 'text-red-600'}>Bénéfice</span><span className={orderProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{orderProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
                </div>
              </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Nouvelle Commande</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="text-sm font-medium text-gray-700">Client *</label>
                <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Date</label><input type="date" value={form.orderDate} onChange={e => setForm(p => ({ ...p, orderDate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Vendeur</label><input value={form.salesperson} onChange={e => setForm(p => ({ ...p, salesperson: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Notes</label><input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2"><p className="font-medium text-sm">Articles</p><button onClick={addItem} className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200"><Plus size={12} /> Ajouter</button></div>
              {items.map((item, i) => {
                const itemCost = getProductCost(item.productId);
                const itemRevenue = item.quantity * item.unitPrice * (1 - item.discount / 100);
                const itemProfit = itemRevenue - item.quantity * itemCost;
                return (
                <div key={i} className="mb-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-2"><label className="text-xs text-gray-500">Produit</label>
                      <select value={item.productId} onChange={e => updateItem(i, 'productId', Number(e.target.value))} className="w-full border rounded px-2 py-1.5 text-xs bg-white">
                        <option value={0}>Sélectionner...</option>
                        {inventory.filter(p => p.quantity > 0).map(p => <option key={p.id} value={p.id}>{getProductLabel(p)} ({p.quantity} dispo)</option>)}
                      </select>
                    </div>
                    <div><label className="text-xs text-gray-500">Qté</label><input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="w-full border rounded px-2 py-1.5 text-xs" min={1} /></div>
                    <div><label className="text-xs text-gray-500">Prix Unit. DA</label><input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full border rounded px-2 py-1.5 text-xs" /></div>
                    <button onClick={() => removeItem(i)} className="pb-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                  {item.productId > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span className="text-gray-400">Coût: <span className="font-medium text-gray-600">{itemCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></span>
                      <span className="text-gray-400">Revenu: <span className="font-medium text-gray-600">{itemRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></span>
                      <span className={`font-medium ${itemProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Bénéfice: {itemProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span className="font-medium">{subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Remise (DA)</span><input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} className="w-24 border rounded px-2 py-1 text-xs" /></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">TVA (DA)</span><input type="number" value={form.tax} onChange={e => setForm(p => ({ ...p, tax: Number(e.target.value) }))} className="w-24 border rounded px-2 py-1 text-xs" /></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-blue-700">{total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Coût total de production</span><span className="text-gray-600 font-medium">{totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
              <div className="flex justify-between text-sm font-bold"><span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>Bénéfice estimé</span><span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{totalProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Créer Brouillon</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">Paiement — Commande #{selectedOrder.id}</h2>
            <p className="text-sm text-gray-500 mb-4">Reste dû: <span className="font-bold text-red-600">{(selectedOrder.total - selectedOrder.paidAmount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></p>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Caisse *</label>
                <select value={payForm.moneyBoxId} onChange={e => setPayForm(p => ({ ...p, moneyBoxId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Date</label><input type="date" value={payForm.date} onChange={e => setPayForm(p => ({ ...p, date: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Montant (DA)</label><input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Mode de paiement</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm(p => ({ ...p, paymentMethod: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="CASH">Espèces</option><option value="CHECK">Chèque</option><option value="BANK_TRANSFER">Virement</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Référence</label><input value={payForm.reference} onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowPaymentForm(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handlePayment} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
