import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

/**
 * EmailVerificationPage Component
 * Route: "/verify-email/:token"
 * Automatically triggers verification on mount and gives clear feedback.
 */
function EmailVerificationPage() {
  const { token } = useParams();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token in link.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        if (isMounted) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully! Welcome to SamadhanSetu.');
          // Update localStorage flag if user is logged in
          localStorage.setItem('isEmailVerified', 'true');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          if (error.response && error.response.data && error.response.data.message) {
            setMessage(error.response.data.message);
          } else {
            setMessage('Verification failed. The link may have expired or is invalid.');
          }
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await api.post('/auth/resend-verification', {
        email: resendEmail.trim().toLowerCase(),
      });
      setResendMessage(response.data.message || 'A new verification email has been sent!');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setResendMessage(error.response.data.message);
      } else {
        setResendMessage('Failed to resend verification email.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            SS
          </div>
          <span className="text-2xl font-bold text-slate-800">
            Samadhan<span className="text-emerald-600">Setu</span>
          </span>
        </Link>
      </div>

      {/* Card Box */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10 text-center">
          
          {/* State 1: Verifying */}
          {status === 'verifying' && (
            <div className="py-8">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Your Email</h2>
              <p className="text-sm text-slate-600">
                Please wait a moment while we validate your credentials...
              </p>
            </div>
          )}

          {/* State 2: Success */}
          {status === 'success' && (
            <div className="py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                {message}
              </p>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-6 text-left">
                A welcome email with overview documentation has been dispatched to your inbox.
              </div>

              <Link
                to="/"
                className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                Go to Role Portals
              </Link>
            </div>
          )}

          {/* State 3: Error / Expired */}
          {status === 'error' && (
            <div className="py-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
              <p className="text-sm text-red-600 mb-6 leading-relaxed">
                {message}
              </p>

              {/* Resend Verification Form */}
              <div className="mt-4 pt-4 border-t border-slate-100 text-left">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Request New Link:</h3>
                
                {resendMessage && (
                  <div className="mb-3 p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800">
                    {resendMessage}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-60 transition-colors"
                  >
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/"
                  className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                >
                  &larr; Back to Home
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
