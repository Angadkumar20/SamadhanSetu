import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

/**
 * RegisterPage Component
 * Route: "/register/:role"
 * Reusable registration component for Citizen, University, and Industry.
 * Features:
 * - Strict client-side validation (Name >= 2, strict email regex, password >= 6)
 * - Password visibility toggle
 * - Clean loading state with disabled inputs/buttons
 * - Informative post-registration verification instructions
 */
function RegisterPage() {
  const { role } = useParams();
  const navigate = useNavigate();

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [expertise, setExpertise] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Human-readable role names
  const roleDisplayNames = {
    citizen: 'Citizen',
    university: 'University / Researcher',
    industry: 'Industry Partner',
  };

  const currentRoleName = roleDisplayNames[role] || 'User';

  // Email regex validator
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Client-side validations
    if (trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // POST to /api/auth/register
      const response = await api.post('/auth/register', {
        name: trimmedName,
        email: normalizedEmail,
        password,
        role,
        phone: phone.trim(),
        organization: organization.trim(),
        expertise: expertise.trim(),
      });

      // Save token if returned
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', role);
        localStorage.setItem('pendingLanguageSelection', 'true');
        localStorage.setItem('pendingLanguageEmail', normalizedEmail);
        localStorage.setItem('pendingLanguageRole', role);
        if (response.data.user && response.data.user.name) {
          localStorage.setItem('userName', response.data.user.name);
        }
      } else {
        localStorage.setItem('pendingLanguageSelection', 'true');
        localStorage.setItem('pendingLanguageEmail', normalizedEmail);
        localStorage.setItem('pendingLanguageRole', role);
      }

      setRegisteredEmail(normalizedEmail);
      setIsRegistered(true);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Registration failed. Please check your connection and try again.');
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
          Create {currentRoleName} Account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Join the Government of Jharkhand civic innovation portal.
        </p>
      </div>

      {/* Registration Card Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10">
          
          {/* Post-Registration Success View */}
          {isRegistered ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h3>
              
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                We have sent a verification link to <strong className="text-slate-800">{registeredEmail}</strong>.
                Please click the link to verify your email and activate full access to SamadhanSetu.
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-6 text-left">
                <strong>Important:</strong> You can sign in right away, but sensitive actions (such as problem reporting and status updates) require a verified email.
              </div>

              <div className="space-y-3">
                <Link
                  to={`/login/${role}`}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-colors"
                >
                  Proceed to Sign In
                </Link>

                <Link
                  to="/"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name / Organization Name Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {role === 'citizen'
                      ? 'Full Name'
                      : role === 'university'
                      ? 'Representative / Faculty Name'
                      : 'Representative / Contact Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      role === 'citizen'
                        ? 'e.g. Ramesh Kumar'
                        : role === 'university'
                        ? 'e.g. Dr. A. Sharma'
                        : 'e.g. Priya Verma'
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  />
                </div>

                {/* Organization / University Name (Optional for citizen, useful for others) */}
                {role !== 'citizen' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {role === 'university' ? 'University / Institution Name' : 'Company / Industry Name'}
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder={
                        role === 'university'
                          ? 'e.g. BIT Mesra / Ranchi University'
                          : 'e.g. Tata Steel / Tech Innovators Ltd'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    />
                  </div>
                )}

                {role !== 'citizen' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Areas of Expertise <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="e.g. Water Management, Civil Engineering"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    />
                    <p className="mt-1 text-xs text-slate-400">Helps Government match your institution with relevant civic problems.</p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  />
                  <p className="mt-1 text-xs text-slate-400">A verification link will be sent to this email.</p>
                </div>

                {/* Phone Field (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  />
                </div>

                {/* Password Field with Visibility Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
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
                  <p className="mt-1 text-xs text-slate-400">Must be at least 6 characters long.</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Link back to Login */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link
                    to={`/login/${role}`}
                    className="font-medium text-sky-600 hover:text-sky-700 underline underline-offset-4"
                  >
                    Sign In
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
