import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';
import { isParishLevel } from '../utils/permissions';

const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', type: 'asset', description: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(res.data.accounts || []);
    } catch (err) {
      setError('Failed to fetch accounts.');
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    setRole(user.role);
    fetchAccounts();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editId) {
        await API.put(`/api/accounts/${editId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Account updated successfully.');
      } else {
        await API.post('/api/accounts', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Account added successfully.');
      }
      setForm({ code: '', name: '', type: 'asset', description: '' });
      setEditId(null);
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save account.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account) => {
    setForm({ code: account.code, name: account.name, type: account.type, description: account.description || '' });
    setEditId(account._id);
  };

  const handleToggleActive = async (id) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await API.patch(`/api/accounts/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Account status updated.');
      fetchAccounts();
    } catch (err) {
      setError('Failed to update account status.');
    } finally {
      setLoading(false);
    }
  };

  if (!isParishLevel()) {
    return (
      <div className="app-page">
        <div className="app-card p-5 text-red-700 bg-red-50 border-red-200">Access denied: Only Admins can manage accounts.</div>
      </div>
    );
  }

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Chart of accounts</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Accounts</h1>
          <p className="text-sm text-slate-600 mt-2">Maintain account codes used by income, expenditure, and journals.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Total accounts</p>
          <p className="text-xl font-bold text-slate-950">{accounts.length}</p>
        </div>
      </section>

      {(error || success) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || success}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">{editId ? 'Update account' : 'Add account'}</h2>
          <p className="text-sm text-slate-500 mt-1">Codes and types drive how records appear in reports.</p>
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Code</span>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="app-field mt-1.5" required disabled={!!editId} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Name</span>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="app-field mt-1.5" required />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="app-field mt-1.5 capitalize" required disabled={!!editId}>
                {accountTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Description</span>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="app-field mt-1.5" />
            </label>
            <div className="flex gap-2">
              {editId && (
                <button type="button" className="app-secondary-button flex-1" onClick={() => { setEditId(null); setForm({ code: '', name: '', type: 'asset', description: '' }); }}>
                  Cancel
                </button>
              )}
              <button type="submit" className="app-primary-button flex-1" disabled={loading}>
                {loading ? 'Processing...' : editId ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Account List</h2>
            <p className="text-sm text-slate-500 mt-1">Active accounts appear in transaction forms.</p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Code</th>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{account.code}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-800">{account.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap capitalize text-slate-600">{account.type}</td>
                    <td className="px-5 py-4 text-slate-600">{account.description || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`app-chip ${account.isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(account)} className="font-bold text-slate-700 hover:text-slate-950">Edit</button>
                        <button onClick={() => handleToggleActive(account._id)} className="font-bold text-teal-700 hover:text-teal-900">
                          {account.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountManagement;
