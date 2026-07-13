import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';
import { isParishLevel } from '../utils/permissions';

const VoteheadForm = () => {
  const [form, setForm] = useState({ name: '', description: '', account: '', localChurch: '' });
  const [voteheads, setVoteheads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [localChurches, setLocalChurches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchVoteheads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/voteheads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoteheads(response.data.voteheads || []);
    } catch (err) {
      console.error('Error fetching voteheads:', err.response?.data?.message || err.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts((response.data.accounts || []).filter((account) => account.isActive && account.type === 'expense'));
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

  // Reassign a votehead to a local church (empty = shared parish-wide)
  const handleReassign = async (id, localChurch) => {
    try {
      const token = localStorage.getItem('token');
      await API.put(`/api/voteheads/${id}`, { localChurch }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVoteheads();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign votehead.');
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
      await Promise.all([fetchVoteheads(), fetchAccounts(), fetchLocalChurches()]);
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
      await API.post('/api/voteheads', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Votehead added successfully.');
      setForm({ name: '', description: '', account: '', localChurch: '' });
      fetchVoteheads();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add votehead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this votehead?')) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/api/voteheads/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Votehead deleted successfully.');
      fetchVoteheads();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete votehead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isParishLevel()) {
    return (
      <div className="app-page">
        <div className="app-card p-5 text-red-700 bg-red-50 border-red-200">
          Access denied: only parish-level roles can manage voteheads.
        </div>
      </div>
    );
  }

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-700">Expense setup</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Voteheads</h1>
          <p className="text-sm text-slate-600 mt-2">Create spending categories and map them to expense accounts.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Configured</p>
          <p className="text-xl font-bold text-slate-950">{voteheads.length} voteheads</p>
        </div>
      </section>

      {(error || success) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || success}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Add votehead</h2>
          <p className="text-sm text-slate-500 mt-1">Use names that will be clear on reports and vouchers.</p>

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
              <span className="text-sm font-bold text-slate-700">Expense account</span>
              <select value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} className="app-field mt-1.5" required>
                <option value="">Select an expense account</option>
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
              {loading ? 'Processing...' : 'Add Votehead'}
            </button>
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Existing Voteheads</h2>
            <p className="text-sm text-slate-500 mt-1">Categories used when recording expenditure.</p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Expense Account</th>
                  <th className="px-5 py-3 text-left">Belongs to</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {voteheads.map((votehead) => (
                  <tr key={votehead._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{votehead.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{votehead.account?.name || 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select
                        value={votehead.localChurch?._id || ''}
                        onChange={(e) => handleReassign(votehead._id, e.target.value)}
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
                      <button onClick={() => handleDelete(votehead._id)} className="text-red-700 hover:text-red-900 font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
                {voteheads.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500">No voteheads configured.</td>
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

export default VoteheadForm;
