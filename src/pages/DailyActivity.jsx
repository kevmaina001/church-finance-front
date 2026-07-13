import React, { useCallback, useEffect, useState } from 'react';
import API from '../utils/apiConfig';

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const todayISO = () => new Date().toISOString().split('T')[0];

// Daily "day book": the income and expenditure recorded on a chosen date, scoped to the
// active church, or across all churches when working at the parish level.
const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const DailyActivity = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  const tenantName = tenant?.name || 'Church';

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
  const scopeLabel = scopedChurchId ? activeChurch.name : (churchFilter ? (localChurches.find((c) => c._id === churchFilter)?.name || 'Church') : 'All churches');

  const printDay = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const section = (title, rows, catLabel, accent) => {
      const body = rows.length
        ? rows.map((r) => `<tr>${showChurchCol ? `<td>${esc(r.church)}</td>` : ''}<td>${esc(r.category)}</td><td>${esc(r.description)}</td><td class="r">${r.amount.toLocaleString()}</td></tr>`).join('')
        : `<tr><td colspan="${showChurchCol ? 4 : 3}" class="muted">Nothing recorded.</td></tr>`;
      const total = rows.reduce((s, r) => s + r.amount, 0);
      return `<h3 style="color:${accent}">${title}</h3>
        <table><thead><tr>${showChurchCol ? '<th>Church</th>' : ''}<th>${catLabel}</th><th>Description</th><th class="r">Amount (KES)</th></tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr><td colspan="${showChurchCol ? 3 : 2}">Total ${title.toLowerCase()}</td><td class="r">${total.toLocaleString()}</td></tr></tfoot></table>`;
    };
    const byChurchHtml = (showChurchCol && byChurch.length > 1)
      ? `<h3>By church</h3><table><thead><tr><th>Church</th><th class="r">Income</th><th class="r">Expenditure</th><th class="r">Net</th></tr></thead><tbody>${byChurch.map((b) => `<tr><td>${esc(b.church)}</td><td class="r">${b.income.toLocaleString()}</td><td class="r">${b.expenditure.toLocaleString()}</td><td class="r">${b.net.toLocaleString()}</td></tr>`).join('')}</tbody></table>`
      : '';
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Day Book ${esc(date)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;}
        h1{font-size:20px;margin:0;} h2{font-size:14px;font-weight:normal;color:#555;margin:4px 0 20px;}
        h3{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #eee;padding-bottom:4px;}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;}
        th,td{border-bottom:1px solid #e5e5e5;padding:7px 8px;text-align:left;}
        th{background:#f5f5f5;text-transform:uppercase;font-size:10px;color:#555;}
        tfoot td{font-weight:bold;border-top:2px solid #333;}
        .r{text-align:right;} .muted{color:#999;text-align:center;}
        .summary{display:flex;gap:24px;margin:16px 0;font-size:13px;}
        .summary b{display:block;font-size:16px;}
        .sign{margin-top:40px;display:flex;gap:60px;font-size:12px;color:#333;}
        .sign div{flex:1;border-top:1px solid #333;padding-top:6px;}
        @media print{body{margin:12px;}}
      </style></head><body>
      <h1>${esc(tenantName)}</h1>
      <h2>Daily Activity (Day Book) &middot; ${esc(scopeLabel)} &middot; ${esc(nice(date))}</h2>
      <div class="summary">
        <div>Total income<b>KES ${totals.income.toLocaleString()}</b></div>
        <div>Total expenditure<b>KES ${totals.expenditure.toLocaleString()}</b></div>
        <div>Net<b>KES ${totals.net.toLocaleString()}</b></div>
      </div>
      ${byChurchHtml}
      ${section('Income', income, 'Revenue Source', '#0f766e')}
      ${section('Expenditure', expenditure, 'Votehead', '#c2410c')}
      <div class="sign"><div>Prepared by</div><div>Checked by</div><div>Date</div></div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

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
          <button
            onClick={() => setDate(todayISO())}
            disabled={date === todayISO()}
            className="app-secondary-button text-sm disabled:opacity-50"
          >
            Today
          </button>
          <button
            onClick={printDay}
            disabled={loading || (income.length === 0 && expenditure.length === 0)}
            className="app-primary-button text-sm disabled:opacity-50"
          >
            Print
          </button>
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
