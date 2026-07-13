import React, { useCallback, useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import API from '../utils/apiConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

// Consolidated parish view: per-child-church stats + roll-ups. Shown on the Dashboard
// when the working context is the whole parish.
const ParishOverview = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchOverview = useCallback(async (yr) => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/api/parish/overview?year=${yr}`, auth());
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parish overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(year); }, [year, fetchOverview]);

  const churches = data?.churches || [];
  const totals = data?.totals || { income: 0, expenditure: 0, net: 0, cash: 0 };
  const budget = data?.budget || { incomeBudget: 0, incomeActual: 0, expenseBudget: 0, expenseActual: 0 };
  const totalGiving = churches.reduce((s, c) => s + c.income, 0) + (data?.parishGeneral?.income || 0);
  const monthly = data?.monthly || [];

  const trendData = {
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: 'Income',
        data: monthly.map((m) => m.income),
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15,118,110,0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Expenditure',
        data: monthly.map((m) => m.expenditure),
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234,88,12,0.10)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${kes(ctx.parsed.y)}` } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => Number(v).toLocaleString() } },
      x: { grid: { display: false } },
    },
  };
  const hasTrend = monthly.some((m) => m.income || m.expenditure);

  const Kpi = ({ label, value, tone }) => (
    <div className="app-card app-kpi p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${tone || 'text-slate-950'}`}>{value}</p>
    </div>
  );

  const Bar = ({ percent, color }) => (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(Math.max(percent || 0, 0), 100)}%` }} />
    </div>
  );

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 text-white p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-300">Consolidated</p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1">Parish Overview</h2>
          <p className="text-sm text-slate-300 mt-1">Rolled up from all local churches.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-300">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 rounded-lg px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-300"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-700">{error}</div>}
      {loading ? (
        <p className="text-slate-500">Loading parish overview…</p>
      ) : (
        <>
          {/* Parish KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label={`Total income ${year}`} value={kes(totals.income)} tone="text-teal-700" />
            <Kpi label={`Total expenditure ${year}`} value={kes(totals.expenditure)} tone="text-orange-700" />
            <Kpi label="Net surplus / deficit" value={kes(totals.net)} tone={totals.net < 0 ? 'text-red-600' : 'text-slate-950'} />
            <Kpi label="Cash position" value={kes(totals.cash)} tone={totals.cash < 0 ? 'text-red-600' : 'text-slate-950'} />
          </div>

          {/* Per-church cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {churches.map((c) => (
              <div key={c.id} className="app-card p-5" style={{ borderTop: '4px solid #0f766e' }}>
                <h3 className="text-lg font-bold text-slate-950 truncate">{c.name}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500">Income</p>
                    <p className="font-bold text-teal-700">{kes(c.income)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500">Expenditure</p>
                    <p className="font-bold text-orange-700">{kes(c.expenditure)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500">Net</p>
                    <p className={`font-bold ${c.net < 0 ? 'text-red-600' : 'text-slate-900'}`}>{kes(c.net)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500">Cash balance</p>
                    <p className={`font-bold ${c.cash < 0 ? 'text-red-600' : 'text-slate-900'}`}>{kes(c.cash)}</p>
                  </div>
                </div>
              </div>
            ))}
            {churches.length === 0 && (
              <div className="app-card p-6 text-center text-slate-500 md:col-span-2 xl:col-span-3">
                No local churches yet. Add churches to see them broken down here.
              </div>
            )}
          </div>

          {/* Monthly trend (parish-wide) */}
          <div className="app-card p-5">
            <h3 className="text-lg font-bold text-slate-950">Monthly trend</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Income vs expenditure across the parish, month by month in {year}.</p>
            {hasTrend ? (
              <div className="h-64 sm:h-72">
                <Line data={trendData} options={trendOptions} />
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">No transactions recorded for {year} yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Share of giving */}
            <div className="app-card p-5">
              <h3 className="text-lg font-bold text-slate-950">Share of giving</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Each church's portion of total income in {year}.</p>
              <div className="space-y-3">
                {churches.map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-800 truncate">{c.name}</span>
                      <span className="text-slate-500">{pct(c.income, totalGiving)}% · {kes(c.income)}</span>
                    </div>
                    <Bar percent={pct(c.income, totalGiving)} color="bg-teal-500" />
                  </div>
                ))}
                {data?.parishGeneral?.income > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-500 truncate">Parish-general (untagged)</span>
                      <span className="text-slate-500">{pct(data.parishGeneral.income, totalGiving)}%</span>
                    </div>
                    <Bar percent={pct(data.parishGeneral.income, totalGiving)} color="bg-slate-400" />
                  </div>
                )}
                {totalGiving === 0 && <p className="text-sm text-slate-500">No income recorded for {year} yet.</p>}
              </div>
            </div>

            {/* Budget vs actual (consolidated) */}
            <div className="app-card p-5">
              <h3 className="text-lg font-bold text-slate-950">Budget vs actual</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Parish budgets against consolidated actuals for {year}.</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-800">Income</span>
                    <span className="text-slate-500">{kes(budget.incomeActual)} of {kes(budget.incomeBudget)} ({pct(budget.incomeActual, budget.incomeBudget)}%)</span>
                  </div>
                  <Bar percent={pct(budget.incomeActual, budget.incomeBudget)} color="bg-teal-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-800">Expenditure</span>
                    <span className="text-slate-500">{kes(budget.expenseActual)} of {kes(budget.expenseBudget)} ({pct(budget.expenseActual, budget.expenseBudget)}%)</span>
                  </div>
                  <Bar percent={pct(budget.expenseActual, budget.expenseBudget)} color={budget.expenseActual > budget.expenseBudget && budget.expenseBudget > 0 ? 'bg-red-500' : 'bg-orange-500'} />
                </div>
                {budget.incomeBudget === 0 && budget.expenseBudget === 0 && (
                  <p className="text-sm text-slate-500">No parish budget set for {year}. Set one on the Budgets page.</p>
                )}
              </div>
            </div>
          </div>

          {/* Parish Quota tracker */}
          <div className="app-card overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-950">Parish Quota remitted</h3>
              <p className="text-sm text-slate-500 mt-1">How much each church has paid toward the parish quota in {year}.</p>
            </div>
            {data?.quotaTracked ? (
              <div className="overflow-x-auto app-scrollbar">
                <table className="app-table min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 text-left">Church</th>
                      <th className="px-5 py-3 text-right">Quota remitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churches.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-800">{kes(c.quota)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{kes(churches.reduce((s, c) => s + c.quota, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">
                Add a "Parish Quota" votehead and record payments against it to track remittances here.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ParishOverview;
