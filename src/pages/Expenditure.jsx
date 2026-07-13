import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';

const Expenditure = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';

  const [expenditures, setExpenditures] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [localChurches, setLocalChurches] = useState([]);
  const [funds, setFunds] = useState([]);
  const [churchFilter, setChurchFilter] = useState(scopedChurchId);
  const [form, setForm] = useState({
    votehead: '',
    amount: '',
    description: '',
    year: new Date().getFullYear(),
    assetAccount: '',
    localChurch: scopedChurchId,
    fund: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteheads, setVoteheads] = useState([]);
  const navigate = useNavigate();

  const fetchExpenditures = async (churchId = churchFilter) => {
    try {
      const query = churchId ? `?localChurch=${churchId}` : '';
      const response = await API.get(`/api/expenditures${query}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExpenditures(response.data.expenditures || []);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
      console.error('Error fetching expenditures:', error.response?.data?.message);
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

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const money = (response.data.accounts || []).filter(
        (account) => account.isActive && account.type === 'asset' && Number(account.code) >= 1000 && Number(account.code) <= 1099
      );
      setAccounts(money);
      // Default the account to the first available (Equity), so it's pre-selected.
      setForm((prev) => (prev.assetAccount ? prev : { ...prev, assetAccount: money[0]?._id || '' }));
    } catch (error) {
      console.error('Error fetching accounts:', error.response?.data?.message || error.message);
    }
  };

  const fetchFunds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/funds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFunds((response.data.funds || []).filter((f) => f.isActive));
    } catch (error) {
      console.error('Error fetching funds:', error.response?.data?.message || error.message);
    }
  };

  const fetchVoteheads = async () => {
    try {
      const token = localStorage.getItem('token');
      // In a church context only that church's + shared categories; parish sees all.
      const query = scopedChurchId ? `?localChurch=${scopedChurchId}` : '';
      const response = await API.get(`/api/voteheads${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoteheads(response.data.voteheads || []);
    } catch (error) {
      console.error('Error fetching voteheads:', error.response?.data?.message || error.message);
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
        navigate('/login');
        return;
      }

      const payload = { ...form };
      if (editId) {
        await API.put(`/api/expenditures/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditId(null);
      } else {
        await API.post('/api/expenditures', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setForm({ votehead: '', amount: '', description: '', year: new Date().getFullYear(), assetAccount: accounts[0]?._id || '', localChurch: scopedChurchId, fund: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenditures();
    } catch (error) {
      console.error('Error saving expenditure:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'An error occurred while saving the expenditure.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await API.delete(`/api/expenditures/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchExpenditures();
    } catch (error) {
      console.error('Error deleting expenditure:', error.response?.data?.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchExpenditures();
    fetchAccounts();
    fetchVoteheads();
    fetchLocalChurches();
    fetchFunds();
  }, [navigate]);

  const grandTotal = expenditures.reduce((sum, expenditure) => sum + (expenditure.amount || 0), 0);

  return (
    <div className="app-page space-y-6">
      <section className="rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6 sm:p-7 shadow-[0_16px_40px_rgba(217,119,6,0.22)] flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-100">Transactions · Money out</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1">Expenditure</h1>
          <p className="text-sm text-amber-50/90 mt-2">
            Capture spending records for <span className="font-bold text-white">{scopedChurchId ? activeChurch.name : 'the whole parish'}</span>.
          </p>
        </div>
        <div className="rounded-xl bg-white/15 border border-white/25 backdrop-blur px-5 py-3">
          <p className="text-xs font-bold uppercase text-amber-50/80">Total shown</p>
          <p className="text-2xl font-bold text-white">KES {grandTotal.toLocaleString()}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5" style={{ borderTop: '4px solid #ea580c' }}>
          <h2 className="text-lg font-bold text-slate-950">{editId ? 'Update expenditure' : 'Add expenditure'}</h2>
          <p className="text-sm text-slate-500 mt-1">Assign each payment to a votehead and cash or bank account.</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <select value={form.votehead} onChange={(e) => setForm({ ...form, votehead: e.target.value })} className="app-field" required>
              <option value="">Select votehead</option>
              {voteheads.map((votehead) => (
                <option key={votehead._id} value={votehead._id}>{votehead.name}</option>
              ))}
            </select>

            <select value={form.assetAccount} onChange={(e) => setForm({ ...form, assetAccount: e.target.value })} className="app-field" required>
              <option value="">Select bank account</option>
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

            <select value={form.fund} onChange={(e) => setForm({ ...form, fund: e.target.value })} className="app-field">
              <option value="">General fund (unrestricted)</option>
              {funds.map((f) => (
                <option key={f._id} value={f._id}>{f.name}{f.type === 'restricted' ? ' (restricted)' : ''}</option>
              ))}
            </select>

            <input type="date" className="app-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <input type="number" placeholder="Amount" className="app-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input type="text" placeholder="Description" className="app-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <button type="submit" className="w-full min-h-[42px] rounded-[10px] px-4 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-[0_10px_18px_rgba(234,88,12,0.2)] transition disabled:opacity-60" disabled={loading}>
              {loading ? 'Processing...' : editId ? 'Update Expenditure' : 'Add Expenditure'}
            </button>
            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Expenditure Records</h2>
              <p className="text-sm text-slate-500 mt-1">{scopedChurchId ? activeChurch.name : 'All churches and parish general'}</p>
            </div>
            {!scopedChurchId && (
              <select value={churchFilter} onChange={(e) => { setChurchFilter(e.target.value); fetchExpenditures(e.target.value); }} className="app-field max-w-xs text-sm">
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
                  <th className="px-5 py-3 text-left">Votehead</th>
                  <th className="px-5 py-3 text-left">Local Church</th>
                  <th className="px-5 py-3 text-left">Fund</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenditures.map((expenditure) => (
                  <tr key={expenditure._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{new Date(expenditure.date || expenditure.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-800 font-medium">{expenditure.votehead?.name || 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{expenditure.localChurch?.name || 'Parish general'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{expenditure.fund?.name || 'General'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-orange-700">KES {expenditure.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-600">{expenditure.description || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => handleDelete(expenditure._id)} className="text-red-700 hover:text-red-900 font-bold transition-colors duration-150">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {expenditures.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-slate-500">No expenditure records found.</td>
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

export default Expenditure;
