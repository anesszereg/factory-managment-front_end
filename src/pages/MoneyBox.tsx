import { useState, useEffect } from 'react';
import { Plus, Wallet, ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { moneyBoxApi, financialTransactionApi } from '../services/api';
import type { MoneyBox, FinancialTransaction, DailyCashSummary } from '../types';
import { TransactionType, TransactionCategory, MoneyBoxStatus } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  CLIENT_PAYMENT: 'Paiement client', SALE: 'Vente', MANUAL_INCOME: 'Revenu manuel', OTHER_INCOME: 'Autre revenu',
  SUPPLIER_PAYMENT: 'Paiement fournisseur', PIECE_WORKER_PAYMENT: 'Paiement façonnier',
  EMPLOYEE_SALARY: 'Salaire', UTILITY_BILL: 'Facture', RENT: 'Loyer', TRANSPORTATION: 'Transport',
  MATERIAL_EXPENSE: 'Matériaux', MAINTENANCE: 'Maintenance', MISCELLANEOUS: 'Divers',
  INTERNAL_TRANSFER: 'Transfert interne', CASH_DEPOSIT: 'Dépôt', CASH_WITHDRAWAL: 'Retrait', OPENING_BALANCE: 'Solde initial',
};

export default function MoneyBoxPage() {
  const [boxes, setBoxes] = useState<MoneyBox[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<DailyCashSummary | null>(null);
  const [tab, setTab] = useState<'boxes' | 'transactions' | 'summary'>('boxes');
  const [showBoxForm, setShowBoxForm] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [boxForm, setBoxForm] = useState({ name: '', description: '', currentBalance: 0, responsibleUser: '' });
  const [txForm, setTxForm] = useState({ moneyBoxId: 0, date: new Date().toISOString().split('T')[0], amount: 0, type: TransactionType.INCOME, category: TransactionCategory.MANUAL_INCOME, description: '', reference: '' });
  const [transferForm, setTransferForm] = useState({ fromId: 0, toId: 0, amount: 0, description: '' });
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);
  const [editTxForm, setEditTxForm] = useState({ date: '', amount: 0, type: TransactionType.INCOME as string, category: '' as string, description: '', reference: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, t, s] = await Promise.all([
        moneyBoxApi.getAll(),
        financialTransactionApi.getAll(),
        financialTransactionApi.getDailySummary(filterDate),
      ]);
      setBoxes(b.data);
      setTransactions(t.data);
      setSummary(s.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [filterDate]);

  const handleCreateBox = async () => {
    if (!boxForm.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
    setFormError(null);
    try {
      await moneyBoxApi.create(boxForm);
      setShowBoxForm(false);
      setBoxForm({ name: '', description: '', currentBalance: 0, responsibleUser: '' });
      loadAll();
    } catch (e: any) { setFormError(e.response?.data?.error ?? e.message ?? 'Erreur serveur'); }
  };

  const handleCreateTx = async () => {
    if (!txForm.moneyBoxId) { setFormError('Sélectionner une caisse.'); return; }
    if (!txForm.amount || txForm.amount <= 0) { setFormError('Montant invalide.'); return; }
    setFormError(null);
    try {
      await financialTransactionApi.create(txForm);
      setShowTxForm(false);
      loadAll();
    } catch (e: any) { setFormError(e.response?.data?.error ?? e.message ?? 'Erreur serveur'); }
  };

  const handleTransfer = async () => {
    if (!transferForm.fromId || !transferForm.toId) { setFormError('Sélectionner les deux caisses.'); return; }
    if (!transferForm.amount || transferForm.amount <= 0) { setFormError('Montant invalide.'); return; }
    setFormError(null);
    try {
      await moneyBoxApi.transfer(transferForm);
      setShowTransferForm(false);
      loadAll();
    } catch (e: any) { setFormError(e.response?.data?.error ?? e.message ?? 'Erreur serveur'); }
  };

  const handleDeleteBox = async (id: number) => {
    if (!confirm('Supprimer cette caisse?')) return;
    try { await moneyBoxApi.delete(id); loadAll(); } catch (e) { console.error(e); }
  };

  const handleEditTx = (tx: FinancialTransaction) => {
    setEditingTx(tx);
    setEditTxForm({
      date: new Date(tx.date).toISOString().split('T')[0],
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      description: tx.description ?? '',
      reference: tx.reference ?? '',
    });
    setFormError(null);
  };

  const handleUpdateTx = async () => {
    if (!editingTx) return;
    if (!editTxForm.amount || editTxForm.amount <= 0) { setFormError('Montant invalide.'); return; }
    setFormError(null);
    try {
      await financialTransactionApi.update(editingTx.id, editTxForm);
      setEditingTx(null);
      loadAll();
    } catch (e: any) { setFormError(e.response?.data?.error ?? e.message ?? 'Erreur serveur'); }
  };

  const handleDeleteTx = async (id: number) => {
    if (!confirm('Supprimer cette transaction? Le solde de la caisse sera ajusté.')) return;
    try { await financialTransactionApi.delete(id); loadAll(); } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  };

  const totalBalance = boxes.reduce((s, b) => s + b.currentBalance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de Caisse</h1>
          <p className="text-sm text-gray-500 mt-1">Money Box & Transactions financières</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransferForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <ArrowRightLeft size={16} /> Transfert
          </button>
          <button onClick={() => setShowTxForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Plus size={16} /> Transaction
          </button>
          <button onClick={() => setShowBoxForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Nouvelle Caisse
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Solde Total</p>
          <p className={`text-2xl font-bold mt-1 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Entrées Aujourd'hui</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{(summary?.totalIncome ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Sorties Aujourd'hui</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{(summary?.totalExpense ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Net Aujourd'hui</p>
          <p className={`text-2xl font-bold mt-1 ${(summary?.net ?? 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{(summary?.net ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="border-b flex">
          {(['boxes', 'transactions', 'summary'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'boxes' ? 'Caisses' : t === 'transactions' ? 'Transactions' : 'Résumé du Jour'}
            </button>
          ))}
        </div>

        {tab === 'boxes' && (
          <div className="p-4">
            {loading ? <p className="text-center py-8 text-gray-400">Chargement...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boxes.map(box => (
                  <div key={box.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Wallet className="text-blue-500" size={20} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{box.name}</h3>
                          {box.responsibleUser && <p className="text-xs text-gray-400">{box.responsibleUser}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleDeleteBox(box.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className={`text-xl font-bold ${box.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{box.currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
                      {box.description && <p className="text-xs text-gray-400 mt-1">{box.description}</p>}
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${box.status === MoneyBoxStatus.OPEN ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{box.status === MoneyBoxStatus.OPEN ? 'Ouvert' : 'Fermé'}</span>
                      <span className="text-xs text-gray-400">{box._count?.transactions ?? 0} opérations</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'transactions' && (
          <div className="p-4 space-y-4">
            <div className="flex gap-3">
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <button onClick={loadAll} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"><RefreshCw size={14} /> Actualiser</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600">Date</th>
                    <th className="text-left p-3 font-medium text-gray-600">Caisse</th>
                    <th className="text-left p-3 font-medium text-gray-600">Catégorie</th>
                    <th className="text-left p-3 font-medium text-gray-600">Description</th>
                    <th className="text-right p-3 font-medium text-gray-600">Montant</th>
                    <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">{tx.moneyBox?.name ?? '-'}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{CATEGORY_LABELS[tx.category] ?? tx.category}</span></td>
                      <td className="p-3 text-gray-500">{tx.description}</td>
                      <td className={`p-3 text-right font-medium ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEditTx(tx)} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteTx(tx.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune transaction</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'summary' && summary && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600"><TrendingUp size={18} /><span className="font-medium">Total Entrées</span></div>
                <p className="text-2xl font-bold text-green-700 mt-2">{summary.totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 text-red-600"><TrendingDown size={18} /><span className="font-medium">Total Sorties</span></div>
                <p className="text-2xl font-bold text-red-700 mt-2">{summary.totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600"><Wallet size={18} /><span className="font-medium">Net du Jour</span></div>
                <p className={`text-2xl font-bold mt-2 ${summary.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{summary.net.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50"><th className="text-left p-3 font-medium text-gray-600">Type</th><th className="text-left p-3 font-medium text-gray-600">Catégorie</th><th className="text-left p-3 font-medium text-gray-600">Caisse</th><th className="text-left p-3 font-medium text-gray-600">Description</th><th className="text-right p-3 font-medium text-gray-600">Montant</th></tr></thead>
                <tbody>
                  {summary.transactions.map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${tx.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.type === TransactionType.INCOME ? 'Entrée' : 'Sortie'}</span></td>
                      <td className="p-3">{CATEGORY_LABELS[tx.category] ?? tx.category}</td>
                      <td className="p-3">{tx.moneyBox?.name ?? '-'}</td>
                      <td className="p-3 text-gray-500">{tx.description}</td>
                      <td className={`p-3 text-right font-medium ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>{tx.type === TransactionType.INCOME ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Box Modal */}
      {showBoxForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nouvelle Caisse</h2>
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{formError}</p>}
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Nom *</label><input value={boxForm.name} onChange={e => setBoxForm(p => ({ ...p, name: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" placeholder="Caisse principale" /></div>
              <div><label className="text-sm font-medium text-gray-700">Description</label><input value={boxForm.description} onChange={e => setBoxForm(p => ({ ...p, description: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Solde initial (DA)</label><input type="number" value={boxForm.currentBalance} onChange={e => setBoxForm(p => ({ ...p, currentBalance: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Responsable</label><input value={boxForm.responsibleUser} onChange={e => setBoxForm(p => ({ ...p, responsibleUser: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowBoxForm(false); setFormError(null); }} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleCreateBox} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Transaction Modal */}
      {showTxForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nouvelle Transaction</h2>
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{formError}</p>}
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Caisse *</label>
                <select value={txForm.moneyBoxId} onChange={e => setTxForm(p => ({ ...p, moneyBoxId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Date</label><input type="date" value={txForm.date} onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Type</label>
                <select value={txForm.type} onChange={e => setTxForm(p => ({ ...p, type: e.target.value as TransactionType }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={TransactionType.INCOME}>Entrée</option>
                  <option value={TransactionType.EXPENSE}>Sortie</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Catégorie</label>
                <select value={txForm.category} onChange={e => setTxForm(p => ({ ...p, category: e.target.value as TransactionCategory }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Montant (DA) *</label><input type="number" value={txForm.amount} onChange={e => setTxForm(p => ({ ...p, amount: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Description</label><input value={txForm.description} onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowTxForm(false); setFormError(null); }} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleCreateTx} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Transfert entre Caisses</h2>
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{formError}</p>}
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">De</label>
                <select value={transferForm.fromId} onChange={e => setTransferForm(p => ({ ...p, fromId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {boxes.map(b => <option key={b.id} value={b.id}>{b.name} ({b.currentBalance.toLocaleString('fr-FR')} DA)</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Vers</label>
                <select value={transferForm.toId} onChange={e => setTransferForm(p => ({ ...p, toId: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Sélectionner...</option>
                  {boxes.filter(b => b.id !== transferForm.fromId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Montant (DA) *</label><input type="number" value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Notes</label><input value={transferForm.description} onChange={e => setTransferForm(p => ({ ...p, description: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowTransferForm(false); setFormError(null); }} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleTransfer} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Transférer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Modifier Transaction</h2>
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{formError}</p>}
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700">Date</label><input type="date" value={editTxForm.date} onChange={e => setEditTxForm(p => ({ ...p, date: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Type</label>
                <select value={editTxForm.type} onChange={e => setEditTxForm(p => ({ ...p, type: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value={TransactionType.INCOME}>Entrée</option>
                  <option value={TransactionType.EXPENSE}>Sortie</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Catégorie</label>
                <select value={editTxForm.category} onChange={e => setEditTxForm(p => ({ ...p, category: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Montant (DA) *</label><input type="number" value={editTxForm.amount} onChange={e => setEditTxForm(p => ({ ...p, amount: Number(e.target.value) }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Description</label><input value={editTxForm.description} onChange={e => setEditTxForm(p => ({ ...p, description: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium text-gray-700">Référence</label><input value={editTxForm.reference} onChange={e => setEditTxForm(p => ({ ...p, reference: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setEditingTx(null); setFormError(null); }} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleUpdateTx} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
