import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';

const emptyLine = { account: '', debit: 0, credit: 0, description: '' };

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ date: '', reference: '', description: '', lines: [{ ...emptyLine }] });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [viewEntry, setViewEntry] = useState(null);
  const navigate = useNavigate();

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/api/journal-entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data.entries || []);
    } catch (err) {
      setError('Failed to fetch journal entries.');
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts((res.data.accounts || []).filter((account) => account.isActive));
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
    fetchEntries();
    fetchAccounts();
  }, [navigate]);

  const handleLineChange = (idx, field, value) => {
    setForm({
      ...form,
      lines: form.lines.map((line, index) => index === idx ? { ...line, [field]: value } : line),
    });
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, index) => index !== idx) });

  const totalDebit = form.lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = form.lines.reduce((sum, line) => sum + Number(line.credit), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await API.post('/api/journal-entries', {
        date: form.date,
        reference: form.reference,
        description: form.description,
        entries: form.lines.map((line) => ({
          account: line.account,
          debit: Number(line.debit),
          credit: Number(line.credit),
          description: line.description,
        })),
        status: 'posted',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Journal entry added successfully.');
      setForm({ date: '', reference: '', description: '', lines: [{ ...emptyLine }] });
      setShowForm(false);
      fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add journal entry.');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'Admin') {
    return (
      <div className="app-page">
        <div className="app-card p-5 text-red-700 bg-red-50 border-red-200">Access denied: Only Admins can manage journal entries.</div>
      </div>
    );
  }

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Accounting</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Journal Entries</h1>
          <p className="text-sm text-slate-600 mt-2">Post balanced debit and credit entries for accounting adjustments.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? 'app-secondary-button' : 'app-primary-button'}>
          {showForm ? 'Cancel Entry' : 'Add Journal Entry'}
        </button>
      </section>

      {(error || success) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || success}
        </div>
      )}

      {showForm && (
        <section className="app-card p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">New journal entry</h2>
              <p className="text-sm text-slate-500 mt-1">Debits and credits must balance before saving.</p>
            </div>
            <div className={`app-chip ${isBalanced ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
              {isBalanced ? 'Balanced' : 'Not balanced'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="app-field" required />
              <input type="text" placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="app-field" required />
              <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="app-field md:col-span-2" required />
            </div>

            <div className="overflow-x-auto app-scrollbar">
              <table className="app-table min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Credit</th>
                    <th className="px-4 py-3 text-left">Line Description</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 min-w-64">
                        <select value={line.account} onChange={(e) => handleLineChange(idx, 'account', e.target.value)} className="app-field" required>
                          <option value="">Select account</option>
                          {accounts.map((account) => (
                            <option key={account._id} value={account._id}>{account.code} - {account.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 min-w-32">
                        <input type="number" min="0" value={line.debit} onChange={(e) => handleLineChange(idx, 'debit', e.target.value)} className="app-field text-right" required />
                      </td>
                      <td className="px-4 py-3 min-w-32">
                        <input type="number" min="0" value={line.credit} onChange={(e) => handleLineChange(idx, 'credit', e.target.value)} className="app-field text-right" required />
                      </td>
                      <td className="px-4 py-3 min-w-56">
                        <input type="text" value={line.description} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} className="app-field" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {form.lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)} className="font-bold text-red-700 hover:text-red-900">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <button type="button" onClick={addLine} className="app-secondary-button">Add Line</button>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="app-chip bg-slate-100 text-slate-700">Debit: KES {totalDebit.toLocaleString()}</span>
                <span className="app-chip bg-slate-100 text-slate-700">Credit: KES {totalCredit.toLocaleString()}</span>
              </div>
              <button type="submit" className="app-primary-button" disabled={loading || !isBalanced}>
                {loading ? 'Processing...' : 'Save Journal Entry'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="app-card overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-950">Posted Entries</h2>
          <p className="text-sm text-slate-500 mt-1">{entries.length} journal entries posted.</p>
        </div>
        <div className="overflow-x-auto app-scrollbar">
          <table className="app-table min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Reference</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-right">Total Debit</th>
                <th className="px-5 py-3 text-right">Total Credit</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{entry.reference}</td>
                  <td className="px-5 py-4 text-slate-600">{entry.description}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-slate-900">KES {Number(entry.totalDebit || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-slate-900">KES {Number(entry.totalCredit || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap"><span className="app-chip bg-teal-50 text-teal-700">{entry.status}</span></td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button onClick={() => setViewEntry(entry)} className="font-bold text-teal-700 hover:text-teal-900">View</button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">No journal entries posted.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewEntry && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-card max-w-3xl w-full relative overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Journal Entry Details</h2>
                <p className="text-sm text-slate-500 mt-1">{viewEntry.reference} · {new Date(viewEntry.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setViewEntry(null)} className="app-secondary-button">Close</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="app-muted-panel p-3"><p className="text-xs font-bold text-slate-500 uppercase">Status</p><p className="font-bold text-slate-950 capitalize">{viewEntry.status}</p></div>
                <div className="app-muted-panel p-3"><p className="text-xs font-bold text-slate-500 uppercase">Debit</p><p className="font-bold text-slate-950">KES {Number(viewEntry.totalDebit || 0).toLocaleString()}</p></div>
                <div className="app-muted-panel p-3"><p className="text-xs font-bold text-slate-500 uppercase">Credit</p><p className="font-bold text-slate-950">KES {Number(viewEntry.totalCredit || 0).toLocaleString()}</p></div>
              </div>
              <p className="text-sm text-slate-700">{viewEntry.description}</p>
              <div className="overflow-x-auto app-scrollbar">
                <table className="app-table min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Account</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                      <th className="px-4 py-3 text-left">Line Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewEntry.entries.map((line, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-slate-800 font-medium">{line.account?.code} - {line.account?.name}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{Number(line.debit || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{Number(line.credit || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-600">{line.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
