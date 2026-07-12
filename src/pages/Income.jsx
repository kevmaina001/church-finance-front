import React, { useEffect, useState } from 'react';
import API from '../utils/apiConfig';

const Income = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';

  const [incomes, setIncomes] = useState([]);
  const [revenueSources, setRevenueSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [localChurches, setLocalChurches] = useState([]);
  const [members, setMembers] = useState([]);
  const [churchFilter, setChurchFilter] = useState(scopedChurchId);
  const [form, setForm] = useState({
    revenueSource: '',
    amount: '',
    description: '',
    year: new Date().getFullYear(),
    assetAccount: '',
    localChurch: scopedChurchId,
    member: '',
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchIncomes = async (churchId = churchFilter) => {
    try {
      const query = churchId ? `?localChurch=${churchId}` : '';
      const response = await API.get(`/api/incomes${query}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setIncomes(response.data.incomes || []);
    } catch (error) {
      console.error('Error fetching incomes:', error.response?.data?.message);
    }
  };

  const fetchLocalChurches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/local-churches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocalChurches((response.data.localChurches || []).filter((church) => church.isActive));
    } catch (error) {
      console.error('Error fetching local churches:', error.response?.data?.message || error.message);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers((response.data.members || []).filter((m) => m.isActive));
    } catch (error) {
      console.error('Error fetching members:', error.response?.data?.message || error.message);
    }
  };

  const fetchRevenueSources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/revenue-sources', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRevenueSources(response.data.revenueSources || []);
    } catch (error) {
      console.error('Error fetching revenue sources:', error.response?.data?.message || error.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(
        (response.data.accounts || []).filter(
          (account) => account.isActive && account.type === 'asset' && Number(account.code) >= 1000 && Number(account.code) <= 1099
        )
      );
    } catch (error) {
      console.error('Error fetching accounts:', error.response?.data?.message || error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        return;
      }

      const payload = { ...form };
      if (editId) {
        await API.put(`/api/incomes/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditId(null);
      } else {
        await API.post('/api/incomes', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setForm({ revenueSource: '', amount: '', description: '', year: new Date().getFullYear(), assetAccount: '', localChurch: scopedChurchId, member: '' });
      fetchIncomes();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      setError(errMsg.replace(/revenueSource/gi, 'revenue source'));
      console.error('Error saving income:', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await API.delete(`/api/incomes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchIncomes();
    } catch (error) {
      console.error('Error deleting income:', error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchRevenueSources();
    fetchAccounts();
    fetchLocalChurches();
    fetchMembers();
  }, []);

  const grandTotal = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Transactions</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Income</h1>
          <p className="text-sm text-slate-600 mt-2">
            Capture income records for <span className="font-bold text-slate-900">{scopedChurchId ? activeChurch.name : 'the whole parish'}</span>.
          </p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Total shown</p>
          <p className="text-xl font-bold text-slate-950">KES {grandTotal.toLocaleString()}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">{editId ? 'Update income' : 'Add income'}</h2>
          <p className="text-sm text-slate-500 mt-1">Use concise descriptions so reports remain easy to scan.</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <select value={form.revenueSource} onChange={(e) => setForm({ ...form, revenueSource: e.target.value })} className="app-field" required>
              <option value="">Select revenue source</option>
              {revenueSources.map((source) => (
                <option key={source._id} value={source._id}>{source.name}</option>
              ))}
            </select>

            <select value={form.assetAccount} onChange={(e) => setForm({ ...form, assetAccount: e.target.value })} className="app-field" required>
              <option value="">Select cash or bank account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>{account.code} - {account.name}</option>
              ))}
            </select>

            {scopedChurchId ? (
              <div className="app-muted-panel px-3 py-2 text-sm text-slate-700 flex items-center min-h-[44px]" title="Set by your selected working context">
                Church: <span className="font-medium ml-1">{activeChurch.name}</span>
              </div>
            ) : (
              <select value={form.localChurch} onChange={(e) => setForm({ ...form, localChurch: e.target.value })} className="app-field">
                <option value="">Parish general</option>
                {localChurches.map((church) => (
                  <option key={church._id} value={church._id}>{church.name}</option>
                ))}
              </select>
            )}

            <select value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} className="app-field">
              <option value="">Member (optional)</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}{m.memberNumber ? ` (${m.memberNumber})` : ''}</option>
              ))}
            </select>

            <input type="number" placeholder="Amount" className="app-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input type="text" placeholder="Description" className="app-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <button type="submit" className="app-primary-button w-full" disabled={loading}>
              {loading ? 'Processing...' : editId ? 'Update Income' : 'Add Income'}
            </button>
            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Income Records</h2>
              <p className="text-sm text-slate-500 mt-1">{scopedChurchId ? activeChurch.name : 'All churches and parish general'}</p>
            </div>
            {!scopedChurchId && (
              <select value={churchFilter} onChange={(e) => { setChurchFilter(e.target.value); fetchIncomes(e.target.value); }} className="app-field max-w-xs text-sm">
                <option value="">All churches</option>
                {localChurches.map((church) => (
                  <option key={church._id} value={church._id}>{church.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Revenue Source</th>
                  <th className="px-5 py-3 text-left">Local Church</th>
                  <th className="px-5 py-3 text-left">Member</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{new Date(income.date || income.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-800 font-medium">{income.revenueSource?.name || 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{income.localChurch?.name || 'Parish general'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{income.member?.name || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-teal-700">KES {income.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-600">{income.description || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => handleDelete(income._id)} className="text-red-700 hover:text-red-900 font-bold transition-colors duration-150">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {incomes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-slate-500">No income records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Income;
