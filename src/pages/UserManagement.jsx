import React, { useCallback, useEffect, useState } from 'react';
import API from '../utils/apiConfig';

const ROLES = ['Admin', 'Vicar', 'Treasurer', 'Secretary', 'Member'];
const SCOPED_ROLES = ['Treasurer', 'Secretary'];

const ROLE_HELP = {
  Admin: 'Full access, including managing users.',
  Vicar: 'Full rights across the whole parish.',
  Treasurer: 'Parish treasurer = full rights. Assign a church to limit them to that church.',
  Secretary: 'Assign a church to limit them to that church; leave blank for parish-wide.',
  Member: 'View only — cannot make any changes.',
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [churches, setChurches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'Member', localChurch: '' });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const [uRes, cRes] = await Promise.all([
        API.get('/api/users'),
        API.get('/api/local-churches'),
      ]);
      setUsers(uRes.data || []);
      setChurches((cRes.data.localChurches || []).filter((c) => c.isActive));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const churchName = (id) => churches.find((c) => c._id === id)?.name || '';
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInviteUser = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!formData.name || !formData.role) {
      setError('Name and role are required.');
      return;
    }
    if (!formData.email && !formData.phone) {
      setError('Provide an email or a phone number for login.');
      return;
    }
    try {
      const payload = { ...formData };
      if (!SCOPED_ROLES.includes(payload.role)) payload.localChurch = '';
      const res = await API.post('/api/users/invite', payload);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'Member', localChurch: '' });
      if (res.data.tempPassword) {
        setNotice(`${res.data.message} Temporary password: ${res.data.tempPassword} — share it with the user.`);
      } else {
        setNotice(res.data.message || 'User created.');
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleChangeRole = async (user, role) => {
    setError('');
    setNotice('');
    try {
      const body = { role };
      if (!SCOPED_ROLES.includes(role)) body.localChurch = '';
      await API.put(`/api/users/${user._id}`, body);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleChangeChurch = async (user, localChurch) => {
    setError('');
    try {
      await API.put(`/api/users/${user._id}`, { localChurch });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update church.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/api/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const showChurch = SCOPED_ROLES.includes(formData.role);

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Administration</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Users</h1>
          <p className="text-sm text-slate-600 mt-2">Create staff users, set their role, and scope treasurers/secretaries to a church.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Current users</p>
          <p className="text-xl font-bold text-slate-950">{users.length}</p>
        </div>
      </section>

      {error && <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border p-3 text-sm bg-teal-50 border-teal-200 text-teal-800">{notice}</div>}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Create user</h2>
          <p className="text-sm text-slate-500 mt-1">Login by email or phone. Leave the password blank to auto-generate one.</p>
          <form onSubmit={handleInviteUser} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Name</span>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="app-field mt-1.5" required />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email <span className="font-normal text-slate-400">(optional)</span></span>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="app-field mt-1.5" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span></span>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="app-field mt-1.5" placeholder="e.g. 0712345678" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Temporary password <span className="font-normal text-slate-400">(optional)</span></span>
              <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="app-field mt-1.5" placeholder="Auto-generated if left blank" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Role</span>
              <select name="role" value={formData.role} onChange={handleInputChange} className="app-field mt-1.5">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="text-xs text-slate-500 mt-1 block">{ROLE_HELP[formData.role]}</span>
            </label>
            {showChurch && (
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Church</span>
                <select name="localChurch" value={formData.localChurch} onChange={handleInputChange} className="app-field mt-1.5">
                  <option value="">Whole parish (all rights)</option>
                  {churches.map((c) => <option key={c._id} value={c._id}>{c.name} only</option>)}
                </select>
              </label>
            )}
            <button type="submit" className="app-primary-button w-full">Create User</button>
          </form>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Current Users</h2>
            <p className="text-sm text-slate-500 mt-1">{isLoading ? 'Loading users...' : 'People with workspace access.'}</p>
          </div>
          <div className="overflow-x-auto app-scrollbar">
            <table className="app-table min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Login</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Church</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{user.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{user.email || user.phone || '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select
                        value={ROLES.includes(user.role) ? user.role : 'Member'}
                        onChange={(e) => handleChangeRole(user, e.target.value)}
                        className="app-field text-sm py-1.5"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {SCOPED_ROLES.includes(user.role) ? (
                        <select
                          value={user.localChurch?._id || user.localChurch || ''}
                          onChange={(e) => handleChangeChurch(user, e.target.value)}
                          className="app-field text-sm py-1.5"
                        >
                          <option value="">Whole parish</option>
                          {churches.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-slate-400">Parish-wide</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => handleDeleteUser(user._id)} className="font-bold text-red-700 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-500">No users found.</td>
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

export default UserManagement;
