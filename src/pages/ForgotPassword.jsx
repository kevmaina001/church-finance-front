import React, { useState } from 'react';
import API from '../utils/apiConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await API.post('/api/users/forgot-password', { email });
      setMessage(response.data?.message || 'If an account exists for that email, a reset link has been sent.');
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
        <h1 className="text-3xl font-bold mt-1 mb-2 text-center text-slate-950">Forgot Password</h1>
        <p className="text-sm text-slate-600 text-center mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>
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
            <label className="block text-sm font-bold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="app-field mt-1.5"
              required
            />
          </div>
          <button
            type="submit"
            className="app-primary-button w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
