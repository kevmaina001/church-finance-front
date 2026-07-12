import React, { useState, useEffect } from 'react';
import API from '../utils/apiConfig';

const LocalChurchManagement = () => {
  const [churches, setChurches] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchChurches = async () => {
    try {
      const res = await API.get('/api/local-churches', authHeader());
      setChurches(res.data.localChurches || []);
    } catch (err) {
      console.error('Error fetching local churches:', err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchChurches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await API.post('/api/local-churches', form, authHeader());
      setMessage(`"${form.name}" added.`);
      setForm({ name: '', description: '' });
      fetchChurches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add local church.');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await API.patch(`/api/local-churches/${id}/toggle`, {}, authHeader());
      fetchChurches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update local church.');
    }
  };

  return (
    <div className="flex-grow overflow-y-auto bg-gradient-to-r from-blue-50 to-blue-100 pb-24 mt-16 sm:mt-0 min-h-screen">
      <div className="w-full max-w-md sm:max-w-2xl md:max-w-4xl mx-auto px-2">
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Local Churches</h2>
          <p className="text-sm text-gray-500 mb-4">
            Congregations under this parish. Income &amp; expenditure can be tagged to a local church,
            and all of them roll up to the parish total.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Church name (e.g. Kamune St. Peters Church)"
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Local Church'}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {message && <p className="text-green-600 mt-2">{message}</p>}
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Registered Churches ({churches.length})</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-500 to-teal-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {churches.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-4 text-sm text-gray-500">No local churches yet.</td></tr>
              )}
              {churches.map((c) => (
                <tr key={c._id} className="hover:bg-teal-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => toggleActive(c._id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LocalChurchManagement;
