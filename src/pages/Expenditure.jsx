import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';

const Expenditure = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [localChurches, setLocalChurches] = useState([]);
  const [churchFilter, setChurchFilter] = useState('');
  const [form, setForm] = useState({
    votehead: '',
    amount: '',
    description: '',
    year: new Date().getFullYear(),
    assetAccount: '',
    localChurch: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [userName, setUserName] = useState('');
  const [voteheads, setVoteheads] = useState([]);
  const navigate = useNavigate();

  const fetchExpenditures = async (churchId = churchFilter) => {
    try {
      const query = churchId ? `?localChurch=${churchId}` : '';
      const response = await API.get(`/api/expenditures${query}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExpenditures(response.data.expenditures);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
      console.error('Error fetching expenditures:', error.response?.data?.message);
    }
  };

  const fetchLocalChurches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/local-churches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocalChurches((response.data.localChurches || []).filter((c) => c.isActive));
    } catch (error) {
      console.error('Error fetching local churches:', error.response?.data?.message || error.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(response.data.accounts.filter(a => a.isActive && a.type === 'asset'));
    } catch (error) {
      console.error('Error fetching accounts:', error.response?.data?.message || error.message);
    }
  };

  const fetchUserName = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserName(response.data.name);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
      console.error('Error fetching user name:', error.response?.data?.message || error.message);
    }
  };

  const fetchVoteheads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/voteheads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoteheads(response.data.voteheads);
    } catch (error) {
      console.error('Error fetching voteheads:', error.response?.data?.message || error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated.');
        navigate('/login');
        return;
      }

      const payload = { ...form };
      if (editId) {
        await API.put(`/api/expenditures/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditId(null);
      } else {
        await API.post('/api/expenditures', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setForm({ votehead: '', amount: '', description: '', year: new Date().getFullYear(), assetAccount: '', localChurch: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenditures();
    } catch (error) {
      console.error('Error saving expenditure:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'An error occurred while saving the expenditure.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await API.delete(`/api/expenditures/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchExpenditures();
    } catch (error) {
      console.error('Error deleting expenditure:', error.response?.data?.message);
    }
  };

  const toggleMonth = (month) => {
    setCollapsedMonths((prev) => ({ ...prev, [month]: !prev[month] }));
  };

  const groupExpendituresByMonth = () => {
    const grouped = expenditures.reduce((acc, expenditure) => {
      const date = new Date(expenditure.date || expenditure.createdAt);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) acc[month] = [];
      acc[month].push(expenditure);
      return acc;
    }, {});
    return grouped;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchExpenditures();
    fetchAccounts();
    fetchUserName();
    fetchVoteheads();
    fetchLocalChurches();
  }, [navigate]);

  const groupedExpenditures = groupExpendituresByMonth();

  const grandTotal = expenditures.reduce((sum, expenditure) => sum + expenditure.amount, 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Main Content */}
      <div className="flex-grow overflow-y-auto bg-gradient-to-r from-blue-50 to-blue-100 pb-24 mt-16 sm:mt-0">
        <div className="w-full max-w-md sm:max-w-2xl md:max-w-4xl mx-auto px-2">
          {/* Form Section - Always visible */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Expenditure</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                  value={form.votehead}
                  onChange={(e) => setForm({ ...form, votehead: e.target.value })}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Votehead</option>
                  {voteheads.map((votehead) => (
                    <option key={votehead._id} value={votehead._id}>{votehead.name}</option>
                  ))}
                </select>

                <select
                  value={form.assetAccount}
                  onChange={(e) => setForm({ ...form, assetAccount: e.target.value })}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Account (Cash/Bank)</option>
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>{account.code} - {account.name}</option>
                  ))}
                </select>

                <select
                  value={form.localChurch}
                  onChange={(e) => setForm({ ...form, localChurch: e.target.value })}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Parish (general)</option>
                  {localChurches.map((church) => (
                    <option key={church._id} value={church._id}>{church.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 col-span-1 md:col-span-2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition ease-in-out duration-200"
                disabled={loading}
              >
                {loading ? 'Processing...' : editId ? 'Update Expenditure' : 'Add Expenditure'}
              </button>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
          </div>

          {/* Table Section - Scrollable */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Expenditure Records</h2>
              <select
                value={churchFilter}
                onChange={(e) => { setChurchFilter(e.target.value); fetchExpenditures(e.target.value); }}
                className="p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All churches (parish total)</option>
                {localChurches.map((church) => (
                  <option key={church._id} value={church._id}>{church.name}</option>
                ))}
              </select>
            </div>
            <div className="h-[calc(100vh-400px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-red-500 to-red-600 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Votehead</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Local Church</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenditures.map((expenditure) => (
                    <tr key={expenditure._id} className="hover:bg-red-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(expenditure.date || expenditure.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {expenditure.votehead?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {expenditure.localChurch?.name || 'Parish (general)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        KES {expenditure.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {expenditure.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(expenditure._id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenditure;
