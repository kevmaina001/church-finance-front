import React, { useEffect, useState } from 'react';
import API from '../utils/apiConfig';

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [localChurches, setLocalChurches] = useState([]);
  const [form, setForm] = useState({ name: '', memberNumber: '', phone: '', email: '', localChurch: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Giving statement panel
  const thisYear = new Date().getFullYear();
  const [statement, setStatement] = useState(null);
  const [range, setRange] = useState({ startDate: `${thisYear}-01-01`, endDate: new Date().toISOString().slice(0, 10) });
  const [statementFor, setStatementFor] = useState(null);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchMembers = async () => {
    try {
      const res = await API.get('/api/members', authHeader());
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err.response?.data?.message || err.message);
    }
  };

  const fetchLocalChurches = async () => {
    try {
      const res = await API.get('/api/local-churches', authHeader());
      setLocalChurches((res.data.localChurches || []).filter((c) => c.isActive));
    } catch (err) {
      console.error('Error fetching local churches:', err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLocalChurches();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await API.post('/api/members', form, authHeader());
      setMessage(`"${form.name}" added.`);
      setForm({ name: '', memberNumber: '', phone: '', email: '', localChurch: '' });
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await API.patch(`/api/members/${id}/toggle`, {}, authHeader());
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update member.');
    }
  };

  const viewStatement = async (member, r = range) => {
    setStatementFor(member);
    setStatement(null);
    try {
      const res = await API.get(`/api/members/${member._id}/statement`, {
        ...authHeader(),
        params: { startDate: r.startDate, endDate: r.endDate },
      });
      setStatement(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load statement.');
    }
  };

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Membership</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Members</h1>
          <p className="text-sm text-slate-600 mt-2">Register contributors, then attribute giving to them and print statements.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Registered</p>
          <p className="text-xl font-bold text-slate-950">{members.length} members</p>
        </div>
      </section>

      {(error || message) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || message}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Add member</h2>
          <p className="text-sm text-slate-500 mt-1">Only a name is required; the rest is optional.</p>
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Full name</span>
              <input type="text" className="app-field mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Membership number</span>
              <input type="text" className="app-field mt-1.5" value={form.memberNumber} onChange={(e) => setForm({ ...form, memberNumber: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Phone</span>
              <input type="text" className="app-field mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input type="email" className="app-field mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Local church</span>
              <select className="app-field mt-1.5" value={form.localChurch} onChange={(e) => setForm({ ...form, localChurch: e.target.value })}>
                <option value="">None / parish</option>
                {localChurches.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="app-primary-button w-full" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Registered Members</h2>
            <p className="text-sm text-slate-500 mt-1">View a member's giving statement or deactivate them.</p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">No.</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Local Church</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{m.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{m.memberNumber || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{m.phone || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{m.localChurch?.name || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`app-chip ${m.isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap space-x-3">
                      <button onClick={() => viewStatement(m)} className="font-bold text-teal-700 hover:text-teal-900">Statement</button>
                      <button onClick={() => toggleActive(m._id)} className="font-bold text-slate-500 hover:text-slate-800">
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">No members yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {statementFor && (
        <section className="app-card p-5" id="giving-statement">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
            <h2 className="text-lg font-bold text-slate-950">Giving Statement</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className="app-field text-sm" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} />
              <input type="date" className="app-field text-sm" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} />
              <button onClick={() => viewStatement(statementFor)} className="app-primary-button text-sm">Apply</button>
              <button onClick={() => window.print()} className="font-bold text-teal-700 hover:text-teal-900">Print</button>
              <button onClick={() => { setStatementFor(null); setStatement(null); }} className="font-bold text-slate-500 hover:text-slate-800">Close</button>
            </div>
          </div>

          {!statement ? (
            <p className="text-slate-500 mt-4">Loading statement...</p>
          ) : (
            <div className="mt-4">
              <div className="mb-4">
                <p className="text-xl font-bold text-slate-950">{statement.member.name}</p>
                <p className="text-sm text-slate-500">
                  {statement.member.memberNumber ? `No. ${statement.member.memberNumber} · ` : ''}
                  {statement.member.localChurch || 'Parish'} ·
                  {' '}{range.startDate} to {range.endDate}
                </p>
              </div>
              <div className="overflow-x-auto app-scrollbar">
                <table className="app-table min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Source</th>
                      <th className="px-5 py-3 text-left">Description</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.contributions.map((c, i) => (
                      <tr key={i}>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-600">{new Date(c.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-800">{c.revenueSource}</td>
                        <td className="px-5 py-3 text-slate-600">{c.description || '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-teal-700">KES {c.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {statement.contributions.length === 0 && (
                      <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">No contributions in this period.</td></tr>
                    )}
                    <tr className="bg-slate-50">
                      <td colSpan="3" className="px-5 py-3 font-bold text-slate-900">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">KES {statement.total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {statement.bySource.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-700 mb-2">Summary by source</p>
                  <div className="flex flex-wrap gap-2">
                    {statement.bySource.map((s, i) => (
                      <span key={i} className="app-chip bg-slate-100 text-slate-700">{s.source}: KES {s.amount.toLocaleString()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default MemberManagement;
