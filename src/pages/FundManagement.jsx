import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/apiConfig';
import { isParishLevel } from '../utils/permissions';

const FundManagement = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';
  const isAdmin = isParishLevel();

  const [report, setReport] = useState({ funds: [], totals: { received: 0, spent: 0, balance: 0 } });
  const [form, setForm] = useState({ name: '', type: 'restricted', description: '' });
  const [editId, setEditId] = useState(null);
  const [year, setYear] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const yearQuery = year ? `year=${year}` : '';
      const q = [yearQuery, scopedChurchId ? `localChurch=${scopedChurchId}` : ''].filter(Boolean).join('&');
      const res = await API.get(`/api/funds/report${q ? `?${q}` : ''}`, auth());
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load funds.');
    } finally {
      setLoading(false);
    }
  }, [year, scopedChurchId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const resetForm = () => { setForm({ name: '', type: 'restricted', description: '' }); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editId) {
        await API.put(`/api/funds/${editId}`, form, auth());
        setMessage('Fund updated.');
      } else {
        await API.post('/api/funds', form, auth());
        setMessage('Fund created.');
      }
      resetForm();
      fetchReport();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fund.');
    }
  };

  const startEdit = (f) => {
    if (!f.id) return; // the untagged "General fund" row is not a real fund
    setEditId(f.id);
    setForm({ name: f.name, type: f.type, description: f.description || '' });
  };

  const toggleActive = async (f) => {
    if (!f.id) return;
    try {
      await API.patch(`/api/funds/${f.id}/toggle`, {}, auth());
      fetchReport();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fund.');
    }
  };

  const { funds = [], totals = { received: 0, spent: 0, balance: 0 } } = report;

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Fund accounting</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Funds</h1>
          <p className="text-sm text-slate-600 mt-2">
            Track restricted money (e.g. Building, Missions, Welfare) for <span className="font-bold text-slate-900">{scopedChurchId ? activeChurch.name : 'the whole parish'}</span>. Each fund's balance is money received into it, less money spent from it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">Year</label>
          <input type="number" placeholder="All" className="app-field w-28" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </section>

      {(error || message) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || message}
        </div>
      )}

      <section className={`grid grid-cols-1 ${isAdmin ? 'xl:grid-cols-[380px_1fr]' : ''} gap-5 items-start`}>
        {isAdmin && (
          <div className="app-card p-5">
            <h2 className="text-lg font-bold text-slate-950">{editId ? 'Edit fund' : 'Create fund'}</h2>
            <p className="text-sm text-slate-500 mt-1">Restricted funds may only be spent on their purpose.</p>
            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <input type="text" placeholder="Fund name (e.g. Building Fund)" className="app-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="app-field">
                <option value="restricted">Restricted (earmarked for a purpose)</option>
                <option value="unrestricted">Unrestricted (general use)</option>
              </select>
              <input type="text" placeholder="Description (optional)" className="app-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-2">
                <button type="submit" className="app-primary-button flex-1">{editId ? 'Update fund' : 'Create fund'}</button>
                {editId && <button type="button" onClick={resetForm} className="app-field w-28 text-center font-semibold text-slate-600 hover:text-slate-900">Cancel</button>}
              </div>
            </form>
          </div>
        )}

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Fund balances</h2>
            <p className="text-sm text-slate-500 mt-1">
              {scopedChurchId ? activeChurch.name : 'Consolidated across the parish'}{year ? ` · ${year}` : ' · all time'}
            </p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Fund</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-right">Received</th>
                  <th className="px-5 py-3 text-right">Spent</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                  {isAdmin && <th className="px-5 py-3 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-slate-500">Loading...</td></tr>
                )}
                {!loading && funds.map((f) => (
                  <tr key={f.id || 'general'} className={`hover:bg-slate-50 ${f.isActive === false ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-900">{f.name}</td>
                    <td className="px-5 py-3">
                      <span className={`app-chip ${f.type === 'restricted' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                        {f.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-teal-700 font-semibold">{f.received.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-orange-700 font-semibold">{f.spent.toLocaleString()}</td>
                    <td className={`px-5 py-3 text-right font-bold ${f.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>{f.balance.toLocaleString()}</td>
                    {isAdmin && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {f.id ? (
                          <div className="flex gap-3">
                            <button onClick={() => startEdit(f)} className="text-teal-700 hover:text-teal-900 font-bold">Edit</button>
                            <button onClick={() => toggleActive(f)} className="text-slate-500 hover:text-slate-800 font-bold">{f.isActive === false ? 'Activate' : 'Deactivate'}</button>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
                {!loading && funds.length === 0 && (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-slate-500">No funds yet. Create one to start earmarking money.</td></tr>
                )}
                {!loading && funds.length > 0 && (
                  <tr className="bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-900">Total</td>
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{totals.received.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{totals.spent.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{totals.balance.toLocaleString()}</td>
                    {isAdmin && <td className="px-5 py-3" />}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!scopedChurchId && (
            <p className="px-5 py-3 text-xs text-slate-500 border-t border-slate-200">
              The "General fund (untagged)" row captures income and expenditure that wasn't assigned to a fund, so the totals reconcile to overall cash movement.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default FundManagement;
