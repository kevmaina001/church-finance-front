import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [incomeData, setIncomeData] = useState([]);
  const [expenditureData, setExpenditureData] = useState([]);
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
    const tenant = JSON.parse(localStorage.getItem('tenant'));
    const tenantName = tenant?.name || 'Your Church';
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
      const response = await API.get('/api/revenue-sources', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRevenueSources(response.data.revenueSources || []);
    } catch (error) {
      console.error('Error fetching revenue sources:', error.message);
    }
  };

  const fetchVoteheads = async () => {
    try {
      const response = await API.get('/api/voteheads', {
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
          '#4fd1c5', '#4299e1', '#f6ad55', '#fc8181', '#9f7aea', '#68d391', '#f687b3', '#ed8936', '#38b2ac', '#ecc94b',
        ],
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
          '#fc8181', '#f6ad55', '#4fd1c5', '#4299e1', '#9f7aea', '#68d391', '#f687b3', '#ed8936', '#38b2ac', '#ecc94b',
        ],
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
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Expenditure',
        data: months.map((key) => monthlyExpenditure[key] || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Greeting and Quick Links */}
      <div className="bg-blue-50 p-2 sm:p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="mb-2 md:mb-0 text-center md:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-700">Welcome, {userName}!</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Working on: <span className="font-semibold">{scopedChurchId ? activeChurch.name : 'Whole Parish (Consolidated)'}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto items-center justify-center">
            <button
              onClick={() => navigate('/app/income')}
              className="bg-blue-600 text-white w-full sm:w-auto px-4 py-2 rounded shadow hover:bg-blue-700 transition text-center"
            >
              Add Income
            </button>
            <button
              onClick={() => navigate('/app/expenditure')}
              className="bg-green-600 text-white w-full sm:w-auto px-4 py-2 rounded shadow hover:bg-green-700 transition text-center"
            >
              Add Expenditure
            </button>
            <button
              onClick={() => navigate('/app/revenue-sources')}
              className="bg-purple-600 text-white w-full sm:w-auto px-4 py-2 rounded shadow hover:bg-purple-700 transition text-center"
            >
              Manage Revenue Sources
            </button>
            <button
              onClick={() => navigate('/app/voteheads')}
              className="bg-yellow-500 text-white w-full sm:w-auto px-4 py-2 rounded shadow hover:bg-yellow-600 transition text-center"
            >
              Manage Voteheads
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto bg-gradient-to-r from-blue-50 to-blue-100 pb-24">
        <div className="w-full max-w-md sm:max-w-2xl md:max-w-4xl mx-auto px-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-green-100 p-3 sm:p-6 rounded-lg shadow-md flex flex-col items-center w-full text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-green-700">Total Income</h2>
              <p className="text-2xl sm:text-3xl font-bold text-green-800 mt-2">KES {totalIncome.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">from {revenueSources.length} Revenue Sources</p>
            </div>
            <div className="bg-red-100 p-3 sm:p-6 rounded-lg shadow-md flex flex-col items-center w-full text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-red-700">Total Expenditure</h2>
              <p className="text-2xl sm:text-3xl font-bold text-red-800 mt-2">KES {totalExpenditure.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">across {voteheads.length} Voteheads</p>
            </div>
            <div className={`p-3 sm:p-6 rounded-lg shadow-md flex flex-col items-center w-full text-center ${netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}> 
              <h2 className={`text-lg sm:text-xl font-semibold ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{netBalance >= 0 ? 'Net Surplus' : 'Net Deficit'}</h2>
              <p className={`text-2xl sm:text-3xl font-bold ${netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'} mt-2`}>KES {netBalance.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">(Income - Expenditure)</p>
            </div>
            <div className="bg-gray-100 p-3 sm:p-6 rounded-lg shadow-md flex flex-col items-center w-full text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Sources & Voteheads</h2>
              <p className="text-base sm:text-lg font-bold text-gray-800 mt-2">{revenueSources.length} Revenue Sources</p>
              <p className="text-base sm:text-lg font-bold text-gray-800">{voteheads.length} Voteheads</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
            {/* Income Pie Chart */}
            <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md flex flex-col items-center w-full min-w-0 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Income by Revenue Source</h3>
              <div className="w-full max-w-[220px] sm:max-w-[300px] h-[140px] sm:h-[220px] mx-auto">
                <Pie data={incomePieData} options={{ responsive: true, maintainAspectRatio: false }} />
                {revenue.length === 0 && <div className="text-gray-500 text-sm mt-2">No income data available for this period.</div>}
              </div>
            </div>
            {/* Expenditure Pie Chart */}
            <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md flex flex-col items-center w-full min-w-0 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Expenditure by Votehead</h3>
              <div className="w-full max-w-[220px] sm:max-w-[300px] h-[140px] sm:h-[220px] mx-auto">
                <Pie data={expenditurePieData} options={{ responsive: true, maintainAspectRatio: false }} />
                {expenses.length === 0 && <div className="text-gray-500 text-sm mt-2">No expenditure data available for this period.</div>}
              </div>
            </div>
          </div>

          {/* Monthly Trends Bar Chart */}
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md mb-4 sm:mb-6 flex flex-col items-center w-full min-w-0 text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Monthly Income & Expenditure Trends</h3>
            <div className="w-full max-w-[320px] sm:max-w-[500px] h-[160px] sm:h-[260px] mx-auto">
              <Bar data={monthlyBarData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md mb-4 sm:mb-6 overflow-x-auto w-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Recent Transactions</h3>
            <table className="min-w-full border border-gray-300 text-xs sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 sm:px-4 py-2 border">Date</th>
                  <th className="px-2 sm:px-4 py-2 border">Type</th>
                  <th className="px-2 sm:px-4 py-2 border">Source/Votehead</th>
                  <th className="px-2 sm:px-4 py-2 border">Amount</th>
                  <th className="px-2 sm:px-4 py-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                {[...recentIncomes.map(i => ({
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
                }))]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((item, idx) => (
                    <tr key={idx} className={item.type === 'Income' ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 sm:px-4 py-2 border">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-2 sm:px-4 py-2 border font-semibold">{item.type}</td>
                      <td className="px-2 sm:px-4 py-2 border">{item.label}</td>
                      <td className="px-2 sm:px-4 py-2 border text-right">{item.amount}</td>
                      <td className="px-2 sm:px-4 py-2 border">{item.description}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Combined Radial Progress */}
          <div className="bg-white p-2 sm:p-6 rounded-lg shadow-md flex flex-col items-center w-full min-w-0 text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Income vs Expenditure</h3>
            <div className="flex flex-col sm:flex-row justify-around items-center w-full gap-4">
              <div className="w-24 sm:w-36">
                <CircularProgressbar
                  value={(totalIncome / (totalIncome + totalExpenditure)) * 100 || 0}
                  text={`${((totalIncome / (totalIncome + totalExpenditure)) * 100 || 0).toFixed(1)}%`}
                  styles={buildStyles({
                    textSize: '14px',
                    pathColor: `rgba(75, 192, 192, 0.6)`,
                    textColor: '#4b4b4b',
                  })}
                />
                <p className="text-center mt-2 text-green-600 text-xs sm:text-base">Income</p>
              </div>
              <div className="w-24 sm:w-36">
                <CircularProgressbar
                  value={(totalExpenditure / (totalIncome + totalExpenditure)) * 100 || 0}
                  text={`${((totalExpenditure / (totalIncome + totalExpenditure)) * 100 || 0).toFixed(1)}%`}
                  styles={buildStyles({
                    textSize: '14px',
                    pathColor: `rgba(255, 99, 132, 0.6)`,
                    textColor: '#4b4b4b',
                  })}
                />
                <p className="text-center mt-2 text-red-600 text-xs sm:text-base">Expenditure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
