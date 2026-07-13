import React, { useCallback, useEffect, useState } from 'react';
import API from '../utils/apiConfig';

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const todayISO = () => new Date().toISOString().split('T')[0];

// Daily "day book": the income and expenditure recorded on a chosen date, scoped to the
// active church, or across all churches when working at the parish level.
const DailyActivity = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';

  const [date, setDate] = useState(todayISO());
  const [churchFilter, setChurchFilter] = useState('');
  const [localChurches, setLocalChurches] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    if (scopedChurchId) return; // church context needs no filter dropdown
    (async () => {
      try {
        const res = await API.get('/api/local-churches', auth());
        setLocalChurches((res.data.localChurches || []).filter((c) => c.isActive));
      } catch (e) { /* non-fatal */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDay = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const church = scopedChurchId || churchFilter;
      const q = `date=${date}${church ? `&localChurch=${church}` : ''}`;
      const res = await API.get(`/api/parish/daily?${q}`, auth());
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load daily activity.');
    } finally {
      setLoading(false);
    }
  }, [date, churchFilter, scopedChurchId]);

  useEffect(() => { fetchDay(); }, [fetchDay]);

  const income = data?.income || [];
  const expenditure = data?.expenditure || [];
  const byChurch = data?.byChurch || [];
  const totals = data?.totals || { income: 0, expenditure: 0, net: 0 };
  const showChurchCol = !scopedChurchId && !churchFilter;
  const nice = (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const Table = ({ title, rows, catLabel, tone }) => (
    <div className="app-card overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <span className={`font-bold ${tone}`}>{kes(rows.reduce((s, r) => s + r.amount, 0))}</span>
      </div>
      <div className="overflow-x-auto app-scrollbar">
        <table className="app-table min-w-full text-sm">
          <thead>
            <tr>
              {showChurchCol && <th className="px-5 py-3 text-left">Church</th>}
              <th className="px-5 py-3 text-left">{catLabel}</th>
              <th className="px-5 py-3 text-left">Description</th>
              <th className="px-5 py-3 text-left">By</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {showChurchCol && <td className="px-5 py-3 whitespace-nowrap text-slate-600">{r.church}</td>}
                <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-900">{r.category}</td>
                <td className="px-5 py-3 text-slate-600">{r.description || '-'}</td>
                <td className="px-5 py-3 whitespace-nowrap text-slate-500">{r.user || '-'}</td>
                <td className={`px-5 py-3 text-right font-bold ${tone}`}>{kes(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={showChurchCol ? 5 : 4} className="px-5 py-10 text-center text-slate-500">Nothing recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Day book</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Daily Activity</h1>
          <p className="text-sm text-slate-600 mt-2">
            {scopedChurchId ? activeChurch.name : 'All churches'} · {nice(date)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!scopedChurchId && (
            <select value={churchFilter} onChange={(e) => setChurchFilter(e.target.value)} className="app-field max-w-xs text-sm">
              <option value="">All churches</option>
              {localChurches.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="app-field w-44" />
        </div>
      </section>

      {error && <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-700">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <>
          {/* Day summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="app-card app-kpi p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Income</p>
              <p className="text-lg sm:text-2xl font-bold text-teal-700 mt-1">{kes(totals.income)}</p>
            </div>
            <div className="app-card app-kpi p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Expenditure</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-700 mt-1">{kes(totals.expenditure)}</p>
            </div>
            <div className="app-card app-kpi p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Net</p>
              <p className={`text-lg sm:text-2xl font-bold mt-1 ${totals.net < 0 ? 'text-red-600' : 'text-slate-950'}`}>{kes(totals.net)}</p>
            </div>
          </div>

          {/* Per-church breakdown (parish view, more than one church active that day) */}
          {showChurchCol && byChurch.length > 1 && (
            <div className="app-card overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-950">By church</h2>
              </div>
              <div className="overflow-x-auto app-scrollbar">
                <table className="app-table min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 text-left">Church</th>
                      <th className="px-5 py-3 text-right">Income</th>
                      <th className="px-5 py-3 text-right">Expenditure</th>
                      <th className="px-5 py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byChurch.map((b) => (
                      <tr key={b.churchId || 'general'} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{b.church}</td>
                        <td className="px-5 py-3 text-right text-teal-700 font-semibold">{kes(b.income)}</td>
                        <td className="px-5 py-3 text-right text-orange-700 font-semibold">{kes(b.expenditure)}</td>
                        <td className={`px-5 py-3 text-right font-bold ${b.net < 0 ? 'text-red-600' : 'text-slate-900'}`}>{kes(b.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Table title="Income" rows={income} catLabel="Revenue source" tone="text-teal-700" />
          <Table title="Expenditure" rows={expenditure} catLabel="Votehead" tone="text-orange-700" />
        </>
      )}
    </div>
  );
};

export default DailyActivity;
