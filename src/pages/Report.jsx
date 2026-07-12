import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import API from '../utils/apiConfig';

const Report = () => {
  const activeChurch = JSON.parse(localStorage.getItem('activeChurch') || 'null');
  const scopedChurchId = activeChurch && activeChurch.id && activeChurch.id !== 'parish' ? activeChurch.id : '';
  const [filterType, setFilterType] = useState('income');
  const [combinedFilterType, setCombinedFilterType] = useState('income');
  const [data, setData] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('original');
  const [startDate, setStartDate] = useState(moment().startOf('year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

  const fetchOriginalData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/reports/reports', {
        params: {
          type: filterType,
          startDate,
          endDate,
          ...(scopedChurchId && { localChurch: scopedChurchId }),
        },
      });
      setData(response.data.records || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombinedData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/reports/aggregated-reports', {
        params: {
          type: combinedFilterType,
          startDate,
          endDate,
          ...(scopedChurchId && { localChurch: scopedChurchId }),
        },
      });
      setCombinedData(response.data.aggregatedData || []);
    } catch (error) {
      console.error('Error fetching combined data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'original') {
      fetchOriginalData();
    } else {
      fetchCombinedData();
    }
  }, [activeSection, filterType, combinedFilterType, startDate, endDate]);

  const handleDownload = async (format) => {
    try {
      const endpoint = activeSection === 'original' ? '/api/reports/download-report' : '/api/reports/download-aggregated-report';
      const type = activeSection === 'original' ? filterType : combinedFilterType;

      const response = await API.get(endpoint, {
        params: {
          type,
          format,
          startDate,
          endDate,
          ...(scopedChurchId && { localChurch: scopedChurchId }),
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${activeSection}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const activeType = activeSection === 'original' ? filterType : combinedFilterType;
  const originalTotal = data.reduce((sum, record) => sum + (record.amount || 0), 0);
  const combinedTotal = combinedData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const total = activeSection === 'original' ? originalTotal : combinedTotal;

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Financial intelligence</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Reports</h1>
          <p className="text-sm text-slate-600 mt-2">
            Showing <span className="font-bold text-slate-900">{scopedChurchId ? activeChurch.name : 'Whole Parish'}</span> from {moment(startDate).format('MMM D, YYYY')} to {moment(endDate).format('MMM D, YYYY')}.
          </p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Report total</p>
          <p className="text-xl font-bold text-slate-950">KES {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </section>

      <section className="app-card p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="inline-grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveSection('original')}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${activeSection === 'original' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              Detailed
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('combined')}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${activeSection === 'combined' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              Summary
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_170px_170px_auto] gap-3 w-full xl:w-auto">
            <select
              value={activeType}
              onChange={(event) => {
                if (activeSection === 'original') {
                  setFilterType(event.target.value);
                } else {
                  setCombinedFilterType(event.target.value);
                }
              }}
              className="app-field text-sm"
            >
              <option value="income">Income</option>
              <option value="expenditure">Expenditure</option>
            </select>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="app-field text-sm" />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="app-field text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => handleDownload('pdf')} className="app-secondary-button inline-flex items-center gap-2">
                <FaFilePdf /> PDF
              </button>
              <button type="button" onClick={() => handleDownload('xlsx')} className="app-secondary-button inline-flex items-center gap-2">
                <FaFileExcel /> Excel
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="app-card overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{activeSection === 'original' ? 'Detailed Records' : 'Summary by Category'}</h2>
            <p className="text-sm text-slate-500 mt-1">{loading ? 'Loading report data...' : `${activeSection === 'original' ? data.length : combinedData.length} rows`}</p>
          </div>
          <span className={`app-chip ${activeType === 'income' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
            {activeType}
          </span>
        </div>

        <div className="overflow-x-auto app-scrollbar">
          {activeSection === 'original' ? (
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">{filterType === 'income' ? 'Revenue Source' : 'Votehead'}</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{moment(record.createdAt).format('MMM D, YYYY')}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-800 font-medium">{filterType === 'income' ? record.revenueSource?.name || 'N/A' : record.votehead?.name || 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-slate-950">KES {(record.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-slate-600">{record.description || '-'}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500">No records match this report.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">{combinedFilterType === 'income' ? 'Revenue Source' : 'Votehead'}</th>
                  <th className="px-5 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-800 font-medium">{item.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-slate-950">KES {(item.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {combinedData.length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-5 py-12 text-center text-slate-500">No summary data matches this report.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default Report;
