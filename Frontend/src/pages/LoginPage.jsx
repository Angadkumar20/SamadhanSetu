import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import i18n from '../i18n';

/**
 * LoginPage Component
 * Route: "/login/:role"
 * Reusable login component for Citizen, University, and Industry.
 * Features:
 * - Email normalization & validation
 * - Password visibility toggle
 * - "Forgot Password?" link
 * - Unverified email notification with one-click resend button
 * - Loading states with disabled inputs
 */
function LoginPage() {
  const { role } = useParams();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unverifiedNotice, setUnverifiedNotice] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Human-readable role names
  const roleDisplayNames = {
    citizen: 'Citizen',
    university: 'University / Researcher',
    industry: 'Industry Partner',
    admin: 'Government Administrator',
  };

  const currentRoleName = roleDisplayNames[role] || 'User';

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setUnverifiedNotice(false);
    setResendStatus('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: normalizedEmail,
        password,
        role,
      });

      const token = response.data.token;
      const user = response.data.user;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);

        if (user) {
          if (user.name) localStorage.setItem('userName', user.name);
          localStorage.setItem('isEmailVerified', String(user.isEmailVerified));
        }

        const isNewUser =
          localStorage.getItem('pendingLanguageSelection') === 'true' &&
          localStorage.getItem('pendingLanguageEmail') === normalizedEmail &&
          localStorage.getItem('pendingLanguageRole') === role;
        const userLanguage = user?.language || localStorage.getItem('language') || 'en';
        localStorage.setItem('language', userLanguage);
        i18n.changeLanguage(userLanguage);

        // Redirect directly to that user's correct dashboard without repeated language prompt
        const dashboardRoutes = {
          citizen: '/citizen/dashboard',
          university: '/university/dashboard',
          industry: '/industry/dashboard',
          admin: '/admin/dashboard',
        };
        const targetDashboard = dashboardRoutes[role] || `/${role}/dashboard`;

        if (isNewUser) {
          navigate(`/select-language/${role}`);
        } else {
          localStorage.setItem('userHasSelectedLanguage', 'true');
          navigate(targetDashboard);
        }
      } else {
        setErrorMessage('Authentication succeeded but no token was returned.');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to connect to backend server. Ensure it is running at http://localhost:5000');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Please enter your email above to resend the verification link.');
      return;
    }

    setIsResending(true);
    setResendStatus('');

    try {
      const response = await api.post('/auth/resend-verification', { email: normalizedEmail });
      setResendStatus(response.data.message || 'Verification email sent! Check your inbox.');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setResendStatus(error.response.data.message);
      } else {
        setResendStatus('Failed to resend verification email.');
      }
    } finally {
      setIsResending(false);
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
              <div>
                <span>{errorMessage}</span>
                {/* Offer resend verification if unverified issue */}
                {errorMessage.toLowerCase().includes('verif') && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="block mt-2 text-xs font-semibold text-sky-700 hover:text-sky-900 underline"
                  >
                    {isResending ? 'Sending link...' : 'Resend Verification Email'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resend Status Banner */}
          {resendStatus && (
            <div className="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{resendStatus}</span>
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

            {/* Password Field with Visibility Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to={role ? `/forgot-password/${role}` : '/forgot-password'}
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

          {/* Need Verification Email Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              {isResending ? 'Sending verification...' : 'Need email verification link again?'}
            </button>
          </div>

          {/* Link to Switch to Register (Hidden for Admin) */}
          {role !== 'admin' && (
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
          )}

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
