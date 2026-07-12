import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiConfig'; // Import your API configuration

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' }); // State for email and password
  const [error, setError] = useState(''); // State to handle errors
  const [loading, setLoading] = useState(false); // State to manage loading indicator
  const navigate = useNavigate(); // Hook for navigation

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="p-2 border rounded w-full mt-1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="p-2 border rounded w-full mt-1"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            disabled={loading} // Disable button while loading
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4">
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot your password?
          </a>
        </p>
        <p className="text-center mt-2">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
