import React, { useEffect, useState } from 'react';
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

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Parish structure</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Local Churches</h1>
          <p className="text-sm text-slate-600 mt-2">Manage congregations that roll up into parish-level reporting.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Registered</p>
          <p className="text-xl font-bold text-slate-950">{churches.length} churches</p>
        </div>
      </section>

      {(error || message) && (
        <div className={`rounded-xl border p-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
          {error || message}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Add local church</h2>
          <p className="text-sm text-slate-500 mt-1">These names appear in transaction filters and consolidated reports.</p>
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Church name</span>
              <input type="text" className="app-field mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Description</span>
              <input type="text" className="app-field mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <button type="submit" className="app-primary-button w-full" disabled={loading}>
              {loading ? 'Adding...' : 'Add Local Church'}
            </button>
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Registered Churches</h2>
            <p className="text-sm text-slate-500 mt-1">Deactivate a church to hide it from new records.</p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {churches.map((church) => (
                  <tr key={church._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{church.name}</td>
                    <td className="px-5 py-4 text-slate-600">{church.description || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`app-chip ${church.isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                        {church.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => toggleActive(church._id)} className="font-bold text-teal-700 hover:text-teal-900">
                        {church.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {churches.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500">No local churches yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocalChurchManagement;
