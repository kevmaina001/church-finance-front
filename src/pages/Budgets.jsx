import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/apiConfig';

const Budgets = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';

  const [year, setYear] = useState(new Date().getFullYear());
  const [incomeRows, setIncomeRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [inputs, setInputs] = useState({}); // id -> budget string
  const [totals, setTotals] = useState({ incomeBudget: 0, incomeActual: 0, expenseBudget: 0, expenseActual: 0 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  const churchQuery = scopedChurchId ? `&localChurch=${scopedChurchId}` : '';

  const fetchAll = useCallback(async (yr) => {
    setLoading(true);
    setError('');
    try {
      const [rsRes, vhRes, repRes] = await Promise.all([
        API.get('/api/revenue-sources', auth()),
        API.get('/api/voteheads', auth()),
        API.get(`/api/budgets/report?year=${yr}${churchQuery}`, auth()),
      ]);
      const report = repRes.data;
      const byId = (rows) => Object.fromEntries((rows || []).map((r) => [r.id, r]));
      const incReport = byId(report.income);
      const expReport = byId(report.expense);

      const income = (rsRes.data.revenueSources || []).map((s) => ({
        id: s._id, name: s.name, ...(incReport[s._id] || { budget: 0, actual: 0, percentUsed: null }),
      }));
      const expense = (vhRes.data.voteheads || []).map((v) => ({
        id: v._id, name: v.name, ...(expReport[v._id] || { budget: 0, actual: 0, percentUsed: null }),
      }));

      setIncomeRows(income);
      setExpenseRows(expense);
      setTotals(report.totals || { incomeBudget: 0, incomeActual: 0, expenseBudget: 0, expenseActual: 0 });

      const nextInputs = {};
      [...income, ...expense].forEach((r) => { if (r.budget) nextInputs[r.id] = String(r.budget); });
      setInputs(nextInputs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [churchQuery]);

  useEffect(() => { fetchAll(year); }, [year, fetchAll]);

  const saveSection = async (kind, rows) => {
    setError('');
    setMessage('');
    try {
      const toSave = rows.filter((r) => inputs[r.id] !== undefined && inputs[r.id] !== '');
      for (const r of toSave) {
        const body = { year: Number(year), kind, amount: Number(inputs[r.id]) };
        if (kind === 'income') body.revenueSource = r.id; else body.votehead = r.id;
        if (scopedChurchId) body.localChurch = scopedChurchId;
        await API.post('/api/budgets', body, auth());
      }
      setMessage(`${kind === 'income' ? 'Income' : 'Expense'} budgets saved.`);
      fetchAll(year);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budgets.');
    }
  };

  const Bar = ({ percent, over }) => (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full ${over ? 'bg-red-500' : 'bg-teal-500'}`}
        style={{ width: `${Math.min(percent || 0, 100)}%` }}
      />
    </div>
  );

  const Section = ({ title, kind, rows, budgetTotal, actualTotal }) => (
    <div className="app-card overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">Budget vs actual for {year}</p>
        </div>
        <button onClick={() => saveSection(kind, rows)} className="app-primary-button text-sm">Save {kind === 'income' ? 'Income' : 'Expense'}</button>
      </div>
      <div className="overflow-x-auto app-scrollbar">
        <table className="app-table min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left">{kind === 'income' ? 'Revenue Source' : 'Votehead'}</th>
              <th className="px-5 py-3 text-right">Budget</th>
              <th className="px-5 py-3 text-right">Actual</th>
              <th className="px-5 py-3 text-right">Variance</th>
              <th className="px-5 py-3 text-left w-40">Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const budget = Number(inputs[r.id] || 0);
              const variance = r.actual - budget;
              const percent = budget > 0 ? Math.round((r.actual / budget) * 100) : null;
              const over = kind === 'expense' && percent !== null && percent > 100;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-900">{r.name}</td>
                  <td className="px-5 py-3 text-right">
                    <input
                      type="number"
                      className="app-field text-right w-28 py-1.5"
                      value={inputs[r.id] ?? ''}
                      placeholder="0"
                      onChange={(e) => setInputs({ ...inputs, [r.id]: e.target.value })}
                    />
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-800">{r.actual.toLocaleString()}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${variance < 0 ? 'text-slate-500' : (kind === 'expense' ? 'text-red-600' : 'text-teal-700')}`}>
                    {variance.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Bar percent={percent} over={over} />
                      <span className="text-xs text-slate-500 w-10 text-right">{percent === null ? '-' : `${percent}%`}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500">Nothing to budget yet.</td></tr>
            )}
            <tr className="bg-slate-50">
              <td className="px-5 py-3 font-bold text-slate-900">Total</td>
              <td className="px-5 py-3 text-right font-bold text-slate-900">{budgetTotal.toLocaleString()}</td>
              <td className="px-5 py-3 text-right font-bold text-slate-900">{actualTotal.toLocaleString()}</td>
              <td className="px-5 py-3 text-right font-bold text-slate-900">{(actualTotal - budgetTotal).toLocaleString()}</td>
              <td className="px-5 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const inputTotal = (rows) => rows.reduce((s, r) => s + Number(inputs[r.id] || 0), 0);

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Planning</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Budgets</h1>
          <p className="text-sm text-slate-600 mt-2">
            Plan against actuals for <span className="font-bold text-slate-900">{scopedChurchId ? activeChurch.name : 'the whole parish'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">Year</label>
          <input type="number" className="app-field w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </section>

      {(error || message) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || message}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading budgets...</p>
      ) : (
        <div className="space-y-6">
          <Section title="Income" kind="income" rows={incomeRows} budgetTotal={inputTotal(incomeRows)} actualTotal={totals.incomeActual} />
          <Section title="Expenses" kind="expense" rows={expenseRows} budgetTotal={inputTotal(expenseRows)} actualTotal={totals.expenseActual} />
        </div>
      )}
    </div>
  );
};

export default Budgets;
