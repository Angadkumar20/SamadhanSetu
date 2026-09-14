import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

/**
 * ForgotPasswordPage Component
 * Route: "/forgot-password" or "/forgot-password/:role"
 * Allows users to request a password reset link by providing their registered email.
 */
function ForgotPasswordPage() {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: normalizedEmail });
      setIsSubmitted(true);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to send reset link. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const backToLoginUrl = role ? `/login/${role}` : '/';

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
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your registered email and we'll send you instructions to reset your password.
        </p>
      </div>

      {/* Card Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10">
          
          {isSubmitted ? (
            <div className="text-center py-3">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">Check Your Inbox</h3>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                If an account exists with <strong className="text-slate-800">{email}</strong>, a password reset link has been dispatched. The link is valid for 1 hour.
              </p>

              <div className="space-y-3">
                <Link
                  to={backToLoginUrl}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-colors"
                >
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
                >
                  Try Another Email
                </button>
              </div>
            </div>
          ) : (
            <>
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
                    Registered Email Address
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
                      Sending link...
                    </>
                  ) : (
                    'Send Password Reset Link'
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <Link
                  to={backToLoginUrl}
                  className="text-sm font-medium text-sky-600 hover:text-sky-700 underline underline-offset-4"
                >
                  &larr; Back to Sign In
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
