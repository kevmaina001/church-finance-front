import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import ParishOverview from '../components/ParishOverview';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  // Active working context: a specific local church, or the whole parish.
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';
  const churchQuery = scopedChurchId ? `?localChurch=${scopedChurchId}` : '';

  const [userName, setUserName] = useState('');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [revenueSources, setRevenueSources] = useState([]);
  const [voteheads, setVoteheads] = useState([]);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [recentExpenditures, setRecentExpenditures] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState([]);
  const [monthlyExpenditure, setMonthlyExpenditure] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const navigate = useNavigate();

  const fetchIncomeExpenditureSummary = async () => {
    try {
      // Fetch all incomes for the tenant
      const incomeRes = await API.get(`/api/incomes${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      // Fetch all expenditures for the tenant
      const expenditureRes = await API.get(`/api/expenditures${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      // Date range: current year
      const startDate = new Date(new Date().getFullYear(), 0, 1);
      const endDate = new Date();
      // Filter incomes by date
      const filteredIncomes = (incomeRes.data.incomes || []).filter(inc => {
        const date = new Date(inc.date || inc.createdAt);
        return date >= startDate && date <= endDate;
      });
      // Filter expenditures by date
      const filteredExpenditures = (expenditureRes.data.expenditures || []).filter(exp => {
        const date = new Date(exp.date || exp.createdAt);
        return date >= startDate && date <= endDate;
      });
      // Sum total income
      const totalIncomeSum = filteredIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
      setTotalIncome(totalIncomeSum);
      // Sum total expenditure
      const totalExpenditureSum = filteredExpenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      setTotalExpenditure(totalExpenditureSum);
      setNetBalance(totalIncomeSum - totalExpenditureSum);
      // Group by revenue source for pie chart
      const revenueMap = {};
      filteredIncomes.forEach(inc => {
        const name = inc.revenueSource?.name || 'Unknown Revenue Source';
        if (!revenueMap[name]) revenueMap[name] = 0;
        revenueMap[name] += inc.amount || 0;
      });
      setRevenue(Object.entries(revenueMap).map(([accountName, amount]) => ({ accountName, amount })));
      // Group by votehead for expenditure pie chart
      const expenseMap = {};
      filteredExpenditures.forEach(exp => {
        const name = exp.votehead?.name || 'Unknown Votehead';
        if (!expenseMap[name]) expenseMap[name] = 0;
        expenseMap[name] += exp.amount || 0;
      });
      setExpenses(Object.entries(expenseMap).map(([accountName, amount]) => ({ accountName, amount })));
    } catch (error) {
      console.error('Error fetching income/expenditure summary:', error.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user) {
      navigate('/login');
    } else {
      setUserName(user.name || 'Guest');
      fetchIncomeExpenditureSummary();
      fetchRevenueSources();
      fetchVoteheads();
      fetchRecentTransactions();
      fetchMonthlyTrends();
    }
  }, [navigate]);

  const fetchRevenueSources = async () => {
    try {
      const response = await API.get(`/api/revenue-sources${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRevenueSources(response.data.revenueSources || []);
    } catch (error) {
      console.error('Error fetching revenue sources:', error.message);
    }
  };

  const fetchVoteheads = async () => {
    try {
      const response = await API.get(`/api/voteheads${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setVoteheads(response.data.voteheads || []);
    } catch (error) {
      console.error('Error fetching voteheads:', error.message);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const incomeRes = await API.get(`/api/incomes${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const expenditureRes = await API.get(`/api/expenditures${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRecentIncomes((incomeRes.data.incomes || []).slice(-5).reverse());
      setRecentExpenditures((expenditureRes.data.expenditures || []).slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching recent transactions:', error.message);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      // Fetch all incomes and expenditures
      const incomeRes = await API.get(`/api/incomes${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const expenditureRes = await API.get(`/api/expenditures${churchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      // Group by month
      const groupByMonth = (arr, dateField) => {
        const months = {};
        arr.forEach(item => {
          const date = new Date(item[dateField] || item.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!months[key]) months[key] = 0;
          months[key] += item.amount;
        });
        return months;
      };
      setMonthlyIncome(groupByMonth(incomeRes.data.incomes || [], 'createdAt'));
      setMonthlyExpenditure(groupByMonth(expenditureRes.data.expenditures || [], 'date'));
    } catch (error) {
      console.error('Error fetching monthly trends:', error.message);
    }
  };

  // Pie chart for income by revenue source
  const incomePieData = revenue.length > 0 ? {
    labels: revenue.map((item) => item.accountName || 'Unknown Revenue Source'),
    datasets: [
      {
        label: 'Income by Revenue Source',
        data: revenue.map((item) => item.amount),
        backgroundColor: [
          '#0f766e', '#2563eb', '#9333ea', '#ca8a04', '#be123c', '#15803d', '#7c3aed', '#ea580c', '#0891b2', '#4f46e5',
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  } : {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Income by Revenue Source',
        data: [1],
        backgroundColor: ['#e2e8f0'],
      },
    ],
  };

  // Pie chart for expenditure by votehead
  const expenditurePieData = expenses.length > 0 ? {
    labels: expenses.map((item) => item.accountName || 'Unknown Votehead'),
    datasets: [
      {
        label: 'Expenditure by Votehead',
        data: expenses.map((item) => item.amount),
        backgroundColor: [
          '#c2410c', '#be123c', '#7c2d12', '#a16207', '#6d28d9', '#0369a1', '#047857', '#b45309', '#9f1239', '#334155',
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  } : {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Expenditure by Votehead',
        data: [1],
        backgroundColor: ['#e2e8f0'],
      },
    ],
  };

  // Bar chart for monthly trends
  const months = Array.from(new Set([
    ...Object.keys(monthlyIncome),
    ...Object.keys(monthlyExpenditure),
  ])).sort();
  const monthlyBarData = {
    labels: months.map((key) => {
      const [year, month] = key.split('-');
      return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
    }),
    datasets: [
      {
        label: 'Income',
        data: months.map((key) => monthlyIncome[key] || 0),
        backgroundColor: '#14b8a6',
        borderRadius: 6,
      },
      {
        label: 'Expenditure',
        data: months.map((key) => monthlyExpenditure[key] || 0),
        backgroundColor: '#f97316',
        borderRadius: 6,
      },
    ],
  };

  const money = (value) => `KES ${Number(value || 0).toLocaleString()}`;
  const currentScope = scopedChurchId ? activeChurch.name : 'Whole Parish';
  const allRecentTransactions = [
    ...recentIncomes.map(i => ({
      ...i,
      type: 'Income',
      label: i.revenueSource?.name || 'N/A',
      date: i.createdAt,
    })),
    ...recentExpenditures.map(e => ({
      ...e,
      type: 'Expenditure',
      label: e.votehead?.name || 'N/A',
      date: e.date || e.createdAt,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: '#475569',
          font: { size: 11 },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        border: { display: false },
        grid: { color: '#e2e8f0' },
        ticks: { color: '#64748b' },
      },
    },
  };

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Financial overview</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-2">
            {currentScope} performance for the current financial year.
          </p>
        </div>
        <div className="app-muted-panel px-3 py-2 text-sm text-slate-600">
          Signed in as <span className="font-bold text-slate-950">{userName}</span>
        </div>
      </section>

      {/* Parish (consolidated) context gets the per-church overview up top */}
      {!scopedChurchId && <ParishOverview />}

      <section className="app-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Quick actions</h2>
            <p className="text-sm text-slate-500 mt-1">Record transactions or maintain the setup lists used by reports.</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button
              onClick={() => navigate('/app/income')}
              className="app-primary-button"
            >
              Add Income
            </button>
            <button
              onClick={() => navigate('/app/expenditure')}
              className="app-secondary-button"
            >
              Add Expenditure
            </button>
            <button
              onClick={() => navigate('/app/revenue-sources')}
              className="app-secondary-button"
            >
              Revenue Sources
            </button>
            <button
              onClick={() => navigate('/app/voteheads')}
              className="app-secondary-button"
            >
              Voteheads
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="app-card app-kpi p-5">
          <p className="text-sm font-semibold text-slate-500">Income</p>
          <p className="text-2xl font-bold text-slate-950 mt-3">{money(totalIncome)}</p>
          <p className="text-sm text-slate-500 mt-2">From {revenueSources.length} revenue sources</p>
        </div>
        <div className="app-card app-kpi p-5">
          <p className="text-sm font-semibold text-slate-500">Expenditure</p>
          <p className="text-2xl font-bold text-slate-950 mt-3">{money(totalExpenditure)}</p>
          <p className="text-sm text-slate-500 mt-2">Across {voteheads.length} voteheads</p>
        </div>
        <div className="app-card app-kpi p-5">
          <p className="text-sm font-semibold text-slate-500">{netBalance >= 0 ? 'Net Surplus' : 'Net Deficit'}</p>
          <p className={`text-2xl font-bold mt-3 ${netBalance >= 0 ? 'text-teal-700' : 'text-orange-700'}`}>{money(netBalance)}</p>
          <p className="text-sm text-slate-500 mt-2">Income less expenditure</p>
          <div className={`app-chip mt-4 ${netBalance >= 0 ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
            {netBalance >= 0 ? 'Healthy position' : 'Needs attention'}
          </div>
        </div>
        <div className="app-card p-5">
          <p className="text-sm font-semibold text-slate-500">Configuration</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-2xl font-bold text-slate-950">{revenueSources.length}</p>
              <p className="text-xs text-slate-500">Sources</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-2xl font-bold text-slate-950">{voteheads.length}</p>
              <p className="text-xs text-slate-500">Voteheads</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="app-card p-5">
          <h3 className="text-base font-bold text-slate-900">Income by Revenue Source</h3>
          <div className="h-72 mt-4">
            <Pie data={incomePieData} options={chartOptions} />
          </div>
          {revenue.length === 0 && <p className="text-slate-500 text-sm mt-3">No income data available for this period.</p>}
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-bold text-slate-900">Expenditure by Votehead</h3>
          <div className="h-72 mt-4">
            <Pie data={expenditurePieData} options={chartOptions} />
          </div>
          {expenses.length === 0 && <p className="text-slate-500 text-sm mt-3">No expenditure data available for this period.</p>}
        </div>
      </section>

      <section className="app-card p-5">
        <h3 className="text-base font-bold text-slate-900">Monthly Income and Expenditure</h3>
        <div className="h-80 mt-4">
          <Bar data={monthlyBarData} options={barOptions} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="app-card p-5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{allRecentTransactions.length} shown</span>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Source/Votehead</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {allRecentTransactions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`app-chip ${item.type === 'Income' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{item.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-950">{money(item.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.description || '-'}</td>
                  </tr>
                ))}
                {allRecentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">No recent transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-bold text-slate-900">Income vs Expenditure</h3>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-6 mt-6">
            <div className="flex flex-col items-center">
              <div className="w-28 sm:w-32">
                <CircularProgressbar
                  value={(totalIncome / (totalIncome + totalExpenditure)) * 100 || 0}
                  text={`${((totalIncome / (totalIncome + totalExpenditure)) * 100 || 0).toFixed(1)}%`}
                  styles={buildStyles({
                    textSize: '14px',
                    pathColor: '#14b8a6',
                    trailColor: '#e2e8f0',
                    textColor: '#0f172a',
                  })}
                />
              </div>
              <p className="text-center mt-3 text-sm font-semibold text-teal-700">Income</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-28 sm:w-32">
                <CircularProgressbar
                  value={(totalExpenditure / (totalIncome + totalExpenditure)) * 100 || 0}
                  text={`${((totalExpenditure / (totalIncome + totalExpenditure)) * 100 || 0).toFixed(1)}%`}
                  styles={buildStyles({
                    textSize: '14px',
                    pathColor: '#f97316',
                    trailColor: '#e2e8f0',
                    textColor: '#0f172a',
                  })}
                />
              </div>
              <p className="text-center mt-3 text-sm font-semibold text-orange-700">Expenditure</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
