import React, { useEffect, useState } from 'react';
import API from '../utils/apiConfig';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

const Visualizations = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenditureData, setExpenditureData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/reports/aggregated', {
        params: { type: 'income' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setIncomeData(response.data.aggregatedData || []);
    } catch (error) {
      console.error('Error fetching income data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenditureData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/reports/aggregated', {
        params: { type: 'expenditure' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExpenditureData(response.data.aggregatedData || []);
    } catch (error) {
      console.error('Error fetching expenditure data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
    fetchExpenditureData();
  }, []);

  const totalIncome = incomeData.reduce((acc, item) => acc + (item.totalAmount || 0), 0);
  const totalExpenditure = expenditureData.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, color: '#475569', font: { size: 11 } },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { border: { display: false }, grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } },
    },
  };

  const incomeChartData = {
    labels: incomeData.map((item) => item.name || 'N/A'),
    datasets: [{ label: 'Income', data: incomeData.map((item) => item.totalAmount), backgroundColor: '#0f766e', borderRadius: 6 }],
  };

  const expenditureChartData = {
    labels: expenditureData.map((item) => item.name || 'N/A'),
    datasets: [{ label: 'Expenditure', data: expenditureData.map((item) => item.totalAmount), backgroundColor: '#c2410c', borderRadius: 6 }],
  };

  const combinedChartData = {
    labels: ['Income', 'Expenditure'],
    datasets: [{
      label: 'Total',
      data: [totalIncome, totalExpenditure],
      backgroundColor: ['#0f766e', '#c2410c'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }],
  };

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Analytics</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Visualizations</h1>
          <p className="text-sm text-slate-600 mt-2">Compare income and expenditure distribution across categories.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Net position</p>
          <p className={`text-xl font-bold ${totalIncome - totalExpenditure >= 0 ? 'text-teal-700' : 'text-orange-700'}`}>
            KES {(totalIncome - totalExpenditure).toLocaleString()}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="app-card p-8 text-center text-slate-500">Loading data...</div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="app-card p-5">
              <p className="text-sm font-semibold text-slate-500">Income</p>
              <p className="text-2xl font-bold text-slate-950 mt-2">KES {totalIncome.toLocaleString()}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm font-semibold text-slate-500">Expenditure</p>
              <p className="text-2xl font-bold text-slate-950 mt-2">KES {totalExpenditure.toLocaleString()}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm font-semibold text-slate-500">Categories</p>
              <p className="text-2xl font-bold text-slate-950 mt-2">{incomeData.length + expenditureData.length}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="app-card p-5">
              <h2 className="text-lg font-bold text-slate-950">Income Overview</h2>
              <div className="h-80 mt-4"><Bar data={incomeChartData} options={chartOptions} /></div>
            </div>
            <div className="app-card p-5">
              <h2 className="text-lg font-bold text-slate-950">Expenditure Overview</h2>
              <div className="h-80 mt-4"><Bar data={expenditureChartData} options={chartOptions} /></div>
            </div>
            <div className="app-card p-5 xl:col-span-2">
              <h2 className="text-lg font-bold text-slate-950">Income vs Expenditure</h2>
              <div className="h-80 mt-4"><Pie data={combinedChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: chartOptions.plugins }} /></div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Visualizations;
