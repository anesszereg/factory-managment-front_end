import { useState, useEffect } from 'react';
import { Plus, Users, Search, Phone, Mail, Building2, Trash2, Eye, CreditCard, TrendingDown } from 'lucide-react';
import { clientApi, moneyBoxApi } from '../services/api';
import type { Client, ClientTransaction, MoneyBox } from '../types';
import { ClientStatus } from '../types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [boxes, setBoxes] = useState<MoneyBox[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ledger, setLedger] = useState<ClientTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', company: '', phone: '', email: '', address: '', creditLimit: 0, notes: '', openingBalance: 0 });
  const [paymentForm, setPaymentForm] = useState({ moneyBoxId: 0, date: new Date().toISOString().split('T')[0], amount: 0, paymentMethod: 'CASH', reference: '', notes: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([clientApi.getAll(), moneyBoxApi.getAll()]);
      setClients(c.data);
      setBoxes(b.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadLedger = async (id: number) => {
    try { const r = await clientApi.getLedger(id); setLedger(r.data); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    loadLedger(c.id);
  };

  const handleCreate = async () => {
    try {
      await clientApi.create(form);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', company: '', phone: '', email: '', address: '', creditLimit: 0, notes: '', openingBalance: 0 });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce client ?')) return;
    try { await clientApi.delete(id); if (selectedClient?.id === id) setSelectedClient(null); loadAll(); } catch (e) { console.error(e); }
  };

  const handlePayment = async () => {
    if (!selectedClient) return;
    try {
      await clientApi.recordPayment(selectedClient.id, paymentForm);
      setShowPaymentForm(false);
      setPaymentForm({ moneyBoxId: 0, date: new Date().toISOString().split('T')[0], amount: 0, paymentMethod: 'CASH', reference: '', notes: '' });
      loadAll();
      loadLedger(selectedClient.id);
    } catch (e) { console.error(e); }
  };

  const handleToggleStatus = async (c: Client) => {
    try {
      await clientApi.update(c.id, { status: c.status === ClientStatus.ACTIVE ? ClientStatus.INACTIVE : ClientStatus.ACTIVE });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.company ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = clients.reduce((s, c) => s + c.outstandingBalance, 0);
  const activeCount = clients.filter(c => c.status === ClientStatus.ACTIVE).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Clients</h1>
          <p className="text-sm text-gray-500 mt-1">CRM & Suivi des créances</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Nouveau Client
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Total Clients</p><p className="text-2xl font-bold mt-1 text-gray-900">{clients.length}</p><p className="text-xs text-gray-400 mt-1">{activeCount} actifs</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Créances Totales</p><p className="text-2xl font-bold mt-1 text-orange-600">{totalOutstanding.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-gray-500">Clients avec Solde</p><p className="text-2xl font-bold mt-1 text-red-600">{clients.filter(c => c.outstandingBalance > 0).length}</p></div>
      </div>

      <div className="flex gap-6">
        {/* Client List */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
            </div>
          </div>
          {loading ? <p className="text-center py-8 text-gray-400">Chargement...</p> : (
            <div className="divide-y">
              {filtered.map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedClient?.id === c.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">{c.firstName[0]}{c.lastName[0]}</div>
                      <div>
                        <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                        {c.company && <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={10} /> {c.company}</p>}
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${c.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.outstandingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === ClientStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status === ClientStatus.ACTIVE ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center py-8 text-gray-400">Aucun client</p>}
            </div>
          )}
        </div>

        {/* Client Detail */}
        {selectedClient && (
          <div className="w-96 space-y-4">
            <div className="bg-white rounded-xl border p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</h2>
                  {selectedClient.company && <p className="text-sm text-gray-500">{selectedClient.company}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleToggleStatus(selectedClient)} className="p-1.5 text-gray-400 hover:text-yellow-500 border rounded"><Eye size={14} /></button>
                  <button onClick={() => handleDelete(selectedClient.id)} className="p-1.5 text-gray-400 hover:text-red-500 border rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              {selectedClient.phone && <p className="text-sm flex items-center gap-2 text-gray-600"><Phone size={14} />{selectedClient.phone}</p>}
              {selectedClient.email && <p className="text-sm flex items-center gap-2 text-gray-600"><Mail size={14} />{selectedClient.email}</p>}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div><p className="text-xs text-gray-400">Créance</p><p className={`text-lg font-bold ${selectedClient.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{selectedClient.outstandingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p></div>
                <div><p className="text-xs text-gray-400">Limite Crédit</p><p className="text-lg font-bold text-gray-700">{selectedClient.creditLimit.toLocaleString('fr-FR')} DA</p></div>
              </div>
              {selectedClient.outstandingBalance > 0 && (
                <button onClick={() => setShowPaymentForm(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <CreditCard size={16} /> Enregistrer Paiement
                </button>
              )}
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-3 border-b"><p className="font-medium text-sm text-gray-700">Historique des Transactions</p></div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {ledger.map(tx => (
                  <div key={tx.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{tx.type}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                      {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${tx.type === 'PAYMENT' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'PAYMENT' ? '-' : '+'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      <p className="text-xs text-gray-400">Solde: {tx.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                    </div>
                  </div>
                ))}
                {ledger.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">Aucune transaction</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users size={18} /> Nouveau Client</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-gray-700">Prénom *</label><input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Nom *</label><input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Société</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Téléphone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Email</label><input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Limite Crédit (DA)</label><input type="number" value={form.creditLimit} onChange={e => setForm(p => ({ ...p, creditLimit: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Adresse</label><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Solde initial (DA)</label><input type="number" value={form.openingBalance} onChange={e => setForm(p => ({ ...p, openingBalance: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Notes</label><input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && selectedClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><TrendingDown size={18} className="text-green-600" /> Paiement Client</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedClient.firstName} {selectedClient.lastName} — Solde: <span className="font-bold text-red-600">{selectedClient.outstandingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></p>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Caisse *</label>
                <select value={paymentForm.moneyBoxId} onChange={e => setPaymentForm(p => ({ ...p, moneyBoxId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Date</label><input type="date" value={paymentForm.date} onChange={e => setPaymentForm(p => ({ ...p, date: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Montant (DA) *</label><input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Mode de paiement</label>
                <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="CASH">Espèces</option><option value="CHECK">Chèque</option><option value="BANK_TRANSFER">Virement</option><option value="CREDIT">Crédit</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Référence</label><input value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Notes</label><input value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
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
