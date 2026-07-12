import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';
import moment from 'moment';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';

const Report = () => {
  const navigate = useNavigate();
  // Active working context: a specific local church, or the whole parish.
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
      setData(response.data.records);
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
      setCombinedData(response.data.aggregatedData);
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
  
  return (
    <div className="w-full px-2 md:px-0 md:max-w-4xl mx-auto mt-16 sm:mt-0">
      <div className="bg-white rounded-lg shadow p-4 md:p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-1">Reports</h1>
        <p className="text-sm text-gray-500 mb-4">
          Showing: <span className="font-medium">{scopedChurchId ? activeChurch.name : 'Whole Parish (Consolidated)'}</span>
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Grid item xs={12} sm={6}>
            <Button
              variant={activeSection === 'original' ? 'contained' : 'outlined'}
            onClick={() => setActiveSection('original')}
              fullWidth
          >
            Original Data
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant={activeSection === 'combined' ? 'contained' : 'outlined'}
            onClick={() => setActiveSection('combined')}
              fullWidth
          >
            Combined Data
            </Button>
          </Grid>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={activeSection === 'original' ? filterType : combinedFilterType}
                    onChange={(e) => {
                  if (activeSection === 'original') {
                    setFilterType(e.target.value);
                  } else {
                    setCombinedFilterType(e.target.value);
                  }
                }}
                label="Report Type"
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expenditure">Expenditure</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Download PDF">
                <IconButton onClick={() => handleDownload('pdf')} color="primary">
                  <PdfIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download Excel">
                <IconButton onClick={() => handleDownload('xlsx')} color="primary">
                  <ExcelIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </div>

        {activeSection === 'original' ? (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">{filterType === 'income' ? 'Revenue Source' : 'Votehead'}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{moment(record.createdAt).format('MMM D, YYYY')}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{filterType === 'income' ? record.revenueSource?.name || 'N/A' : record.votehead?.name || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{record.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{record.description || 'N/A'}</td>
                  </tr>
                ))}
                <tr className="bg-blue-50">
                  <td colSpan={2} />
                  <td className="px-4 py-2 font-bold text-blue-800">Total: {data.reduce((sum, record) => sum + record.amount, 0).toFixed(2)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">{combinedFilterType === 'income' ? 'Revenue Source' : 'Votehead'}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Total Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {combinedData.map((item) => (
                  <tr key={item.name}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-purple-50">
                  <td className="px-4 py-2 font-bold text-purple-800">Total</td>
                  <td className="px-4 py-2 font-bold text-purple-800">{combinedData.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
