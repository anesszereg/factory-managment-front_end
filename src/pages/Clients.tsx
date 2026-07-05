import { useState, useEffect } from 'react';
import { Plus, Users, Search, Phone, Mail, Building2, Trash2, Eye, CreditCard, TrendingDown, MapPin, Calendar, Wallet, FileText, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

  const [form, setForm] = useState({ firstName: '', lastName: '', company: '', phone: '', email: '', address: '', creditLimit: 0, notes: '', openingCredit: 0, openingDebt: 0, openingBalanceDate: '' });
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
      setForm({ firstName: '', lastName: '', company: '', phone: '', email: '', address: '', creditLimit: 0, notes: '', openingCredit: 0, openingDebt: 0, openingBalanceDate: '' });
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
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{clients.length}</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{activeCount} actifs</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Créances Totales</p>
              <p className="text-2xl font-bold mt-1 text-orange-600">{totalOutstanding.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Wallet size={20} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Clients avec Solde</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{clients.filter(c => c.outstandingBalance > 0).length}</p>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><CreditCard size={20} /></div>
          </div>
        </div>
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
                <div key={c.id} onClick={() => handleSelectClient(c)} className={`p-4 cursor-pointer transition-colors ${selectedClient?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-b'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedClient?.id === c.id ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {c.company && <span className="flex items-center gap-1"><Building2 size={10} /> {c.company}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${c.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.outstandingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      <span className={`text-[10px] px-2 py-0.5 font-medium rounded-full ${c.status === ClientStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status === ClientStatus.ACTIVE ? 'Actif' : 'Inactif'}</span>
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
          <div className="w-[420px] space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 p-5 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                      {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</h2>
                      {selectedClient.company && <p className="text-sm text-gray-500 flex items-center gap-1"><Building2 size={12} /> {selectedClient.company}</p>}
                      <span className={`inline-flex mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${selectedClient.status === ClientStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {selectedClient.status === ClientStatus.ACTIVE ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleStatus(selectedClient)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Toggle status"><Eye size={14} /></button>
                    <button onClick={() => handleDelete(selectedClient.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Contact Details */}
                <div className="grid grid-cols-1 gap-2">
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><Phone size={14} /></div>
                      <div><p className="text-xs text-gray-500">Téléphone</p><p className="text-sm font-medium text-gray-900">{selectedClient.phone}</p></div>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md"><Mail size={14} /></div>
                      <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-gray-900">{selectedClient.email}</p></div>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md"><MapPin size={14} /></div>
                      <div><p className="text-xs text-gray-500">Adresse</p><p className="text-sm font-medium text-gray-900">{selectedClient.address}</p></div>
                    </div>
                  )}
                  {selectedClient.openingBalanceDate && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="p-1.5 bg-teal-100 text-teal-600 rounded-md"><Calendar size={14} /></div>
                      <div><p className="text-xs text-gray-500">Date d'ouverture</p><p className="text-sm font-medium text-gray-900">{new Date(selectedClient.openingBalanceDate).toLocaleDateString('fr-FR')}</p></div>
                    </div>
                  )}
                  {selectedClient.notes && (
                    <div className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="p-1.5 bg-gray-200 text-gray-600 rounded-md"><FileText size={14} /></div>
                      <div><p className="text-xs text-gray-500">Notes</p><p className="text-sm font-medium text-gray-900">{selectedClient.notes}</p></div>
                    </div>
                  )}
                </div>

                {/* Account Summary */}
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Wallet size={12} /> Résumé du compte</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-green-600 mb-1 flex items-center gap-1"><ArrowDownRight size={12} /> Crédit initial</p>
                      <p className="text-lg font-bold text-green-700">{(selectedClient.openingCredit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                      <p className="text-xs text-orange-600 mb-1 flex items-center gap-1"><ArrowUpRight size={12} /> Dette initiale</p>
                      <p className="text-lg font-bold text-orange-700">{(selectedClient.openingDebt || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${selectedClient.outstandingBalance > 0 ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`text-xs mb-1 ${selectedClient.outstandingBalance > 0 ? 'text-red-600' : 'text-blue-600'}`}>Solde actuel</p>
                      <p className={`text-lg font-bold ${selectedClient.outstandingBalance > 0 ? 'text-red-700' : 'text-blue-700'}`}>{selectedClient.outstandingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 mb-1">Limite Crédit</p>
                      <p className="text-lg font-bold text-gray-800">{selectedClient.creditLimit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                    </div>
                  </div>
                </div>

                {selectedClient.outstandingBalance > 0 && (
                  <button onClick={() => setShowPaymentForm(true)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    <CreditCard size={16} /> Enregistrer Paiement
                  </button>
                )}
              </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2 bg-gray-50"><Receipt size={16} className="text-gray-600" /><p className="font-semibold text-sm text-gray-800">Historique des Transactions</p></div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {ledger.map(tx => (
                  <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === 'PAYMENT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'PAYMENT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{tx.type}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                        {tx.description && <p className="text-xs text-gray-500 mt-0.5">{tx.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'PAYMENT' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'PAYMENT' ? '-' : '+'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      <p className="text-xs text-gray-400">Solde: {tx.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                    </div>
                  </div>
                ))}
                {ledger.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">Aucune transaction</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
              <h2 className="text-xl font-bold text-gray-900">Nouveau Client</h2>
            </div>

            <div className="space-y-6">
              {/* Identity Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Identité</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Prénom" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Nom" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
                    <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Nom de la société" />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Téléphone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="email@exemple.com" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Adresse complète" />
                  </div>
                </div>
              </div>

              {/* Account Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Compte</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite Crédit (DA)</label>
                    <input type="number" value={form.creditLimit} onChange={e => setForm(p => ({ ...p, creditLimit: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crédit initial (DA)</label>
                    <input type="number" value={form.openingCredit} onChange={e => setForm(p => ({ ...p, openingCredit: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dette initiale (DA)</label>
                    <input type="number" value={form.openingDebt} onChange={e => setForm(p => ({ ...p, openingDebt: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'ouverture</label>
                    <input type="date" value={form.openingBalanceDate} onChange={e => setForm(p => ({ ...p, openingBalanceDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Notes additionnelles..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Créer</button>
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
