import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post(`/api/users/reset-password/${token}`, { password });
      setMessage(response.data?.message || 'Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f8fb] px-4 py-10">
      <div className="app-surface rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <p className="text-sm font-semibold text-teal-700 text-center">Account recovery</p>
        <h1 className="text-3xl font-bold mt-1 mb-6 text-center text-slate-950">Reset Password</h1>
        {message && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="app-field mt-1.5"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="app-field mt-1.5"
              required
            />
          </div>
          <button
            type="submit"
            className="app-primary-button w-full"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="text-center mt-5 text-sm">
          <a href="/login" className="text-teal-700 font-bold hover:text-teal-900">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
