import React, { useState, useEffect } from 'react';
import API from '../utils/apiConfig';
import { useNavigate } from 'react-router-dom';

const reportEndpoints = {
  'trial-balance': '/api/accounting/trial-balance',
  'income-expenditure': '/api/accounting/income-expenditure',
  'balance-sheet': '/api/accounting/balance-sheet',
  'cash-flow': '/api/accounting/cash-flow',
  'general-ledger': '/api/accounting/general-ledger',
  'equity-statement': '/api/accounting/equity-statement',
};

const dateSupported = {
  'trial-balance': true,
  'income-expenditure': true,
  'balance-sheet': false,
  'cash-flow': true,
  'general-ledger': true,
  'equity-statement': true,
};

const AccountingReports = () => {
  // Active working context: a specific local church, or the whole parish.
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';
  const [reportType, setReportType] = useState('trial-balance');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else if (dateSupported[reportType]) {
      fetchReport();
    }
    // eslint-disable-next-line
  }, [navigate, reportType]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      setReportData(null);
      const endpoint = reportEndpoints[reportType];
      if (!endpoint) {
        setError('Invalid report type.');
        setLoading(false);
        return;
      }
      const params = {};
      if (dateSupported[reportType]) {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      if (scopedChurchId) params.localChurch = scopedChurchId;
      const response = await API.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setReportData(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const renderTrialBalance = () => {
    if (!reportData?.trialBalance) return null;
    
    return (
      <div className="overflow-x-auto">
        <div className="h-[calc(100vh-400px)] overflow-y-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 border">Account Code</th>
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Debit</th>
                <th className="px-4 py-2 border">Credit</th>
              </tr>
            </thead>
            <tbody>
              {reportData.trialBalance.map((account, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{account.accountCode}</td>
                  <td className="px-4 py-2 border">{account.accountName}</td>
                  <td className="px-4 py-2 border text-right">{account.debit.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-right">{account.credit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeExpenditure = () => {
    if (!reportData) return null;
    const revenue = reportData.revenue || [];
    const expenses = reportData.expenses || [];
    const totalRevenue = reportData.totalRevenue || 0;
    const totalExpenses = reportData.totalExpenses || 0;
    const netIncome = reportData.netIncome || 0;
    return (
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{item.accountName}</td>
                  <td className="px-4 py-2 border text-right">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-semibold">Total Revenue</td>
                <td className="px-4 py-2 border text-right font-semibold">{totalRevenue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Expenses</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{item.accountName}</td>
                  <td className="px-4 py-2 border text-right">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-semibold">Total Expenses</td>
                <td className="px-4 py-2 border text-right font-semibold">{totalExpenses.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-lg font-semibold">Net Income: {netIncome.toFixed(2)}</h3>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;
    const assets = reportData.assets || [];
    const liabilities = reportData.liabilities || [];
    const equity = reportData.equity || [];
    const totalAssets = reportData.totalAssets || 0;
    const totalLiabilities = reportData.totalLiabilities || 0;
    const totalEquity = reportData.totalEquity || 0;
    return (
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Assets</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Balance</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{item.accountName}</td>
                  <td className="px-4 py-2 border text-right">{item.balance.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-semibold">Total Assets</td>
                <td className="px-4 py-2 border text-right font-semibold">{totalAssets.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Balance</th>
              </tr>
            </thead>
            <tbody>
              {liabilities.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{item.accountName}</td>
                  <td className="px-4 py-2 border text-right">{item.balance.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-semibold">Total Liabilities</td>
                <td className="px-4 py-2 border text-right font-semibold">{totalLiabilities.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Equity</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Balance</th>
              </tr>
            </thead>
            <tbody>
              {equity.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{item.accountName}</td>
                  <td className="px-4 py-2 border text-right">{item.balance.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-semibold">Total Equity</td>
                <td className="px-4 py-2 border text-right font-semibold">{totalEquity.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={`p-4 rounded ${reportData.balanced ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex justify-between text-sm">
            <span>Total Assets</span><span>{totalAssets.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Liabilities + Equity</span><span>{(totalLiabilities + totalEquity).toFixed(2)}</span>
          </div>
          <div className="mt-2 font-semibold">
            {reportData.balanced ? '✓ Balanced' : `✗ Out of balance by ${reportData.difference}`}
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!reportData) return null;
    const operatingActivities = reportData.operatingActivities || [];
    const investingActivities = reportData.investingActivities || [];
    const financingActivities = reportData.financingActivities || [];
    const netCashFlow = reportData.netCashFlow || 0;
    return (
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Operating Activities</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Type</th>
              </tr>
            </thead>
            <tbody>
              {operatingActivities.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border">{item.description}</td>
                  <td className="px-4 py-2 border text-right">{item.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{item.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Investing Activities</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Type</th>
              </tr>
            </thead>
            <tbody>
              {investingActivities.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border">{item.description}</td>
                  <td className="px-4 py-2 border text-right">{item.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{item.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Financing Activities</h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Type</th>
              </tr>
            </thead>
            <tbody>
              {financingActivities.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border">{item.description}</td>
                  <td className="px-4 py-2 border text-right">{item.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{item.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-lg font-semibold">Net Cash Flow: {netCashFlow.toFixed(2)}</h3>
        </div>
      </div>
    );
  };

  const renderGeneralLedger = () => {
    if (!reportData?.ledger) return null;
    
    return (
      <div className="overflow-x-auto">
        <div className="h-[calc(100vh-400px)] overflow-y-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Reference</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Account Code</th>
                <th className="px-4 py-2 border">Account Name</th>
                <th className="px-4 py-2 border">Debit</th>
                <th className="px-4 py-2 border">Credit</th>
              </tr>
            </thead>
            <tbody>
              {reportData.ledger.map((entry, index) => (
                <React.Fragment key={index}>
                  {entry.entries.map((line, lineIndex) => (
                    <tr key={`${index}-${lineIndex}`}>
                      {lineIndex === 0 && (
                        <>
                          <td className="px-4 py-2 border" rowSpan={entry.entries.length}>
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 border" rowSpan={entry.entries.length}>
                            {entry.reference}
                          </td>
                          <td className="px-4 py-2 border" rowSpan={entry.entries.length}>
                            {entry.description}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-2 border">{line.accountCode}</td>
                      <td className="px-4 py-2 border">{line.accountName}</td>
                      <td className="px-4 py-2 border text-right">{line.debit.toFixed(2)}</td>
                      <td className="px-4 py-2 border text-right">{line.credit.toFixed(2)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEquityStatement = () => {
    if (!reportData?.statement) return null;
    return (
      <div className="overflow-x-auto">
        <div className="h-[calc(100vh-400px)] overflow-y-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 border">Equity Account</th>
                <th className="px-4 py-2 border">Opening Balance</th>
                <th className="px-4 py-2 border">Additions</th>
                <th className="px-4 py-2 border">Withdrawals</th>
                <th className="px-4 py-2 border">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.statement.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 border">{item.accountName}</td>
                  <td className="px-4 py-2 border text-right">{item.opening.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-right">{item.additions.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-right">{item.withdrawals.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-right font-semibold">{item.closing.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case 'trial-balance':
        return renderTrialBalance();
      case 'income-expenditure':
        return renderIncomeExpenditure();
      case 'balance-sheet':
        return renderBalanceSheet();
      case 'cash-flow':
        return renderCashFlow();
      case 'general-ledger':
        return renderGeneralLedger();
      case 'equity-statement':
        return renderEquityStatement();
      default:
        return null;
    }
  };

  return (
    <div className="app-page space-y-6 accounting-report">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Accounting</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Accounting Reports</h1>
          <p className="text-sm text-slate-600 mt-2">
            Showing <span className="font-bold text-slate-900">{scopedChurchId ? activeChurch.name : 'Whole Parish'}</span>.
          </p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Report</p>
          <p className="text-xl font-bold text-slate-950 capitalize">{reportType.replace(/-/g, ' ')}</p>
        </div>
      </section>

      <div className="app-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="app-field"
          >
            <option value="trial-balance">Trial Balance</option>
            <option value="income-expenditure">Income & Expenditure</option>
            <option value="balance-sheet">Balance Sheet</option>
            <option value="cash-flow">Cash Flow Statement</option>
            <option value="general-ledger">General Ledger</option>
            <option value="equity-statement">Equity Statement</option>
          </select>

          {dateSupported[reportType] && (
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="app-field"
            />
          )}

          {dateSupported[reportType] && (
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="app-field"
            />
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="app-primary-button disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="app-card p-5 min-h-[220px] overflow-hidden">
        {loading ? (
          <div className="text-center text-slate-500 font-semibold py-12">Loading report...</div>
        ) : (
          renderReport()
        )}
      </div>
    </div>
  );
};

export default AccountingReports; 
