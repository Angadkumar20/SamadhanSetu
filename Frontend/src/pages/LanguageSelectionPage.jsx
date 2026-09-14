import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_LANGUAGES } from '../i18n';
import api from '../api/axios';

/**
 * LanguageSelectionPage Component
 * Route: "/select-language" or "/select-language/:role"
 * Shown when user explicitly requests language setup or for new user preference.
 */
function LanguageSelectionPage() {
  const { role: routeRole } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const savedRole = routeRole || localStorage.getItem('role') || 'citizen';
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  const handleContinue = async () => {
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('language', selectedLanguage);
    localStorage.setItem('userHasSelectedLanguage', 'true');
    localStorage.removeItem('pendingLanguageSelection');
    localStorage.removeItem('pendingLanguageEmail');
    localStorage.removeItem('pendingLanguageRole');
    
    // If user is authenticated, persist preference in MongoDB
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.put('/auth/language', { language: selectedLanguage });
      } catch (err) {
        console.error('Failed to sync language with backend:', err);
      }
    }
    const dashboardRoutes = {
      citizen: '/citizen/dashboard',
      university: '/university/dashboard',
      industry: '/industry/dashboard',
      admin: '/admin/dashboard',
    };
    navigate(dashboardRoutes[savedRole] || `/${savedRole}/dashboard`);
  };

  const handleSkip = () => {
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('language', selectedLanguage);
    localStorage.setItem('userHasSelectedLanguage', 'true');
    localStorage.removeItem('pendingLanguageSelection');
    localStorage.removeItem('pendingLanguageEmail');
    localStorage.removeItem('pendingLanguageRole');
    const dashboardRoutes = {
      citizen: '/citizen/dashboard',
      university: '/university/dashboard',
      industry: '/industry/dashboard',
      admin: '/admin/dashboard',
    };
    navigate(dashboardRoutes[savedRole] || `/${savedRole}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center pt-4">
        {/* Government Emblem / Seal Neutral Civic Icon */}
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center shadow-md font-bold text-lg">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-900 block">
              {t('home.govtTag')}
            </span>
            <span className="text-xs text-slate-500 font-medium block">
              {t('home.deptName')}
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {t('lang.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          {t('lang.subtitle')}
        </p>
      </div>

      {/* Language Grid Container */}
      <div className="mt-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`relative p-4 rounded-xl text-left border-2 transition-all duration-200 flex flex-col justify-between h-28 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {lang.code}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-base sm:text-lg font-bold text-slate-900 block tracking-tight">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {lang.name}
                    </span>
                  </div>

                  {lang.isComplete ? (
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1">
                      Full Translation
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1">
                      English Fallback
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Selected: <strong className="text-slate-800 uppercase">{selectedLanguage}</strong> &bull; Can be modified later in the navigation bar.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                {t('lang.skip')}
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow transition-all flex items-center justify-center gap-2"
              >
                {t('lang.continue')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-6">
        SamadhanSetu &bull; Government of Jharkhand Civic Problem Solving Platform
      </footer>
    </div>
  );
}

export default LanguageSelectionPage;
