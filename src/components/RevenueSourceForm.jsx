import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';

const RevenueSourceForm = () => {
  const [form, setForm] = useState({ name: '', description: '', account: '', localChurch: '' });
  const [revenueSources, setRevenueSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [localChurches, setLocalChurches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchRevenueSources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/revenue-sources', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRevenueSources(response.data.revenueSources || []);
    } catch (err) {
      console.error('Error fetching revenue sources:', err.response?.data?.message || err.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts((response.data.accounts || []).filter((account) => account.isActive && account.type === 'revenue'));
    } catch (err) {
      console.error('Error fetching accounts:', err.response?.data?.message || err.message);
    }
  };

  const fetchLocalChurches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/local-churches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocalChurches((response.data.localChurches || []).filter((c) => c.isActive));
    } catch (err) {
      console.error('Error fetching local churches:', err.response?.data?.message || err.message);
    }
  };

  // Reassign a source to a local church (empty = shared parish-wide)
  const handleReassign = async (id, localChurch) => {
    try {
      const token = localStorage.getItem('token');
      await API.put(`/api/revenue-sources/${id}`, { localChurch }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRevenueSources();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign revenue source.');
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      if (!token || !user) {
        navigate('/login');
        return;
      }
      setRole(user.role);
      await Promise.all([fetchRevenueSources(), fetchAccounts(), fetchLocalChurches()]);
    };
    fetchInitialData();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await API.post('/api/revenue-sources', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Revenue source added successfully.');
      setForm({ name: '', description: '', account: '', localChurch: '' });
      fetchRevenueSources();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add revenue source. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this revenue source?')) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/api/revenue-sources/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Revenue source deleted successfully.');
      fetchRevenueSources();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete revenue source. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'Admin') {
    return (
      <div className="app-page">
        <div className="app-card p-5 text-red-700 bg-red-50 border-red-200">
          Access denied: Only Admins can manage revenue sources.
        </div>
      </div>
    );
  }

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Income setup</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Revenue Sources</h1>
          <p className="text-sm text-slate-600 mt-2">Create income categories and map them to revenue accounts.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Configured</p>
          <p className="text-xl font-bold text-slate-950">{revenueSources.length} sources</p>
        </div>
      </section>

      {(error || success) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || success}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Add revenue source</h2>
          <p className="text-sm text-slate-500 mt-1">Use names that donors and finance reports will recognize.</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Name</span>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="app-field mt-1.5" required />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="app-field mt-1.5 min-h-24" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Revenue account</span>
              <select value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} className="app-field mt-1.5" required>
                <option value="">Select a revenue account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>{account.name} ({account.code})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Local church</span>
              <select value={form.localChurch} onChange={(e) => setForm({ ...form, localChurch: e.target.value })} className="app-field mt-1.5">
                <option value="">Shared — all churches (parish-wide)</option>
                {localChurches.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} only</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 mt-1 block">Leave shared unless this category belongs to just one church.</span>
            </label>
            <button type="submit" className="app-primary-button w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Add Revenue Source'}
            </button>
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Existing Revenue Sources</h2>
            <p className="text-sm text-slate-500 mt-1">Categories used when recording income.</p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Revenue Account</th>
                  <th className="px-5 py-3 text-left">Belongs to</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {revenueSources.map((source) => (
                  <tr key={source._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{source.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{source.account?.name || 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select
                        value={source.localChurch?._id || ''}
                        onChange={(e) => handleReassign(source._id, e.target.value)}
                        className="app-field text-sm py-1.5"
                        title="Which church this category belongs to"
                      >
                        <option value="">Shared (all churches)</option>
                        {localChurches.map((c) => (
                          <option key={c._id} value={c._id}>{c.name} only</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => handleDelete(source._id)} className="text-red-700 hover:text-red-900 font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
                {revenueSources.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500">No revenue sources configured.</td>
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

export default RevenueSourceForm;
