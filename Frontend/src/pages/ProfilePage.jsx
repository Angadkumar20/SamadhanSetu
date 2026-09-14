import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { AVAILABLE_LANGUAGES } from '../i18n';

/**
 * ProfilePage Component
 * Route: "/profile"
 * Allows authenticated users to view their account credentials and update Name, Phone, Organization, and Preferred Language.
 * Email and Role are strictly preserved and read-only.
 */
function ProfilePage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');

  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-dismiss success notification after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        setUser(userData);
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setOrganization(userData.organization || '');
        if (userData.language) {
          setLanguage(userData.language);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setErrorMessage('Failed to load profile. Please verify your authentication.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/auth/profile', {
        name: name.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        language: language.trim().toLowerCase(),
      });

      // Update immediate i18n state and localStorage
      i18n.changeLanguage(language);
      localStorage.setItem('language', language);
      localStorage.setItem('userHasSelectedLanguage', 'true');

      setSuccessMessage('Profile and language preferences updated successfully!');
      localStorage.setItem('userName', response.data.user.name);
    } catch (error) {
      console.error('Update profile error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role={storedRole} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Account Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            View your verified credentials and maintain up-to-date contact information.
          </p>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <span>✓ {successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Loading your profile information...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal lowercase">(read-only)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-semibold cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Email address is permanently bound to verification credentials.
                </span>
              </div>

              {/* Role (Read-only badge) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Portal Role <span className="text-slate-400 font-normal lowercase">(read-only)</span>
                </label>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                    {user?.role}
                  </span>
                  <span className="text-xs text-slate-500">
                    Email Status: <strong className={user?.isEmailVerified ? 'text-emerald-700' : 'text-amber-600'}>
                      {user?.isEmailVerified ? 'Verified' : 'Unverified'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Full Name (Editable) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Phone Number (Editable) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Organization (Editable) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Organization / University / Company <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. BIT Mesra or Ranchi Municipal Area"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Preferred Interface Language (Editable) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Preferred Interface Language <span className="text-emerald-600 font-normal">(13 Indian Languages)</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Language updates immediately and synchronizes across all your active sessions.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>SamadhanSetu &bull; User Account &bull; Government of Jharkhand</p>
      </footer>
    </div>
  );
}

export default ProfilePage;
