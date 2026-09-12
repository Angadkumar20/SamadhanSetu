import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

/**
 * LoginPage Component
 * Route: "/login/:role"
 * Reusable login component for Citizen, University, and Industry.
 * - Extracts 'role' from the route params.
 * - Collects email & password.
 * - POSTs to /api/auth/login.
 * - Saves JWT token to localStorage.
 * - Navigates to the corresponding dashboard.
 */
function LoginPage() {
  // Grab the role from the URL param (e.g. /login/citizen -> role = "citizen")
  const { role } = useParams();
  const navigate = useNavigate();

  // Local state for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Local state for loading & error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Friendly display names for each role
  const roleDisplayNames = {
    citizen: 'Citizen',
    university: 'University / Researcher',
    industry: 'Industry Partner',
  };

  const currentRoleName = roleDisplayNames[role] || 'User';

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // POST request to backend with { email, password, role }
      const response = await api.post('/auth/login', {
        email,
        password,
        role,
      });

      // Assuming backend responds with { token: "...", user: {...} }
      const token = response.data.token;

      if (token) {
        // Save token to localStorage so our Axios interceptor can use it
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);

        // Optionally store user details if returned
        if (response.data.user && response.data.user.name) {
          localStorage.setItem('userName', response.data.user.name);
        }

        // Redirect to that specific role's dashboard
        navigate(`/${role}/dashboard`);
      } else {
        setErrorMessage('Authentication succeeded but no token was returned.');
      }
    } catch (error) {
      // Handle network or invalid credential errors cleanly
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to connect to backend server. Ensure it is running at http://localhost:5000');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Top Header & Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            SS
          </div>
          <span className="text-2xl font-bold text-slate-800">
            Samadhan<span className="text-emerald-600">Setu</span>
          </span>
        </Link>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {currentRoleName} Login
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to access your portal and start collaborating.
        </p>
      </div>

      {/* Login Card Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10">
          
          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Link to Switch to Register */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account yet?{' '}
              <Link
                to={`/register/${role}`}
                className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
              >
                Register as {role}
              </Link>
            </p>
          </div>

          {/* Back to Home Link */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
            >
              &larr; Back to Role Selection
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
