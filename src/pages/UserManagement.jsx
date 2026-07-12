import React, { useCallback, useEffect, useState } from 'react';
import API from '../utils/apiConfig';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Special User' });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await API.get('/api/users');
      setUsers(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleInviteUser = async (event) => {
    event.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('All fields are required.');
      return;
    }
    try {
      await API.post('/api/users/invite', formData);
      setFormData({ name: '', email: '', password: '', role: 'Special User' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite user.');
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

  return (
    <div className="app-page space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Administration</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 mt-1">Users</h1>
          <p className="text-sm text-slate-600 mt-2">Invite finance users and manage access to the workspace.</p>
        </div>
        <div className="app-muted-panel px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">Current users</p>
          <p className="text-xl font-bold text-slate-950">{users.length}</p>
        </div>
      </section>

      {error && <div className="rounded-xl border p-3 text-sm bg-red-50 border-red-200 text-red-700">{error}</div>}

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        <div className="app-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Invite user</h2>
          <p className="text-sm text-slate-500 mt-1">Create a user with a temporary password.</p>
          <form onSubmit={handleInviteUser} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Name</span>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="app-field mt-1.5" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="app-field mt-1.5" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Temporary password</span>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="app-field mt-1.5" />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Role</span>
              <select name="role" value={formData.role} onChange={handleInputChange} className="app-field mt-1.5">
                <option value="Special User">Special User</option>
                <option value="Member">Member</option>
              </select>
            </label>
            <button type="submit" className="app-primary-button w-full">Invite User</button>
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
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{user.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{user.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="app-chip bg-slate-100 text-slate-700">{user.role}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => handleDeleteUser(user._id)} className="font-bold text-red-700 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500">No users found.</td>
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
