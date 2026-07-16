import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../utils/apiConfig'; // Import your API configuration

const Login = () => {
  const [form, setForm] = useState({ identifier: '', password: '' }); // email or phone + password
  const [error, setError] = useState(''); // State to handle errors
  const [loading, setLoading] = useState(false); // State to manage loading indicator
  const navigate = useNavigate(); // Hook for navigation
  const [searchParams] = useSearchParams();
  // Set when a lapsed session bounced the user back here (see utils/session.js)
  const sessionExpired = searchParams.get('expired') === '1';

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form behavior
    setError(''); // Reset error state
    setLoading(true); // Set loading to true
    try {
      // Make a POST request to the login endpoint
      const response = await API.post('/api/users/login', form);

      const { token, user } = response.data; // Extract token and user from response

      // Store the token and user information in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Fetch and store tenant information
      if (user.tenantId) {
        const tenantResponse = await API.get(`/api/tenants/${user.tenantId}`);
        localStorage.setItem('tenant', JSON.stringify(tenantResponse.data));
      }

      // Send the user to choose their working context (a local church or the whole parish)
      localStorage.removeItem('activeChurch');
      navigate('/select-context');
    } catch (err) {
      // Set error message if login fails
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false); // Reset loading to false after the request completes
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-5xl app-surface rounded-2xl overflow-hidden grid lg:grid-cols-[1fr_440px]">
        <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-10">
          <div>
            <div className="h-12 w-12 rounded-xl bg-teal-500/15 border border-teal-300/20 flex items-center justify-center text-teal-200 font-black text-xl">
              CF
            </div>
            <h1 className="text-4xl font-bold mt-8">Church Finance</h1>
            <p className="text-slate-300 mt-4 max-w-md">
              Manage income, expenditure, reports, and parish financial visibility from one focused workspace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold text-teal-200">Income</p>
              <p className="text-slate-400 mt-1">Track giving and sources</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold text-teal-200">Reports</p>
              <p className="text-slate-400 mt-1">Export clear summaries</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold text-teal-200">Controls</p>
              <p className="text-slate-400 mt-1">Manage users and context</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-teal-700">Welcome back</p>
            <h2 className="text-3xl font-bold text-slate-950 mt-1">Sign in</h2>
            <p className="text-sm text-slate-500 mt-2">Use your account credentials to continue.</p>
          </div>
        {sessionExpired && !error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg mb-4 text-sm">
            Your session expired for security. Please sign in again to continue.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700">
              Email or phone
            </label>
            <input
              type="text"
              placeholder="Enter your email or phone number"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              className="px-3 py-2.5 border border-slate-300 rounded-lg w-full mt-1.5 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2.5 border border-slate-300 rounded-lg w-full mt-1.5 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed font-semibold shadow-sm transition"
            disabled={loading} // Disable button while loading
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-5 text-sm">
          <a href="/forgot-password" className="text-teal-700 font-semibold hover:text-teal-800">
            Forgot your password?
          </a>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
