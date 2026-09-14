import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_LANGUAGES } from '../i18n';
import api from '../api/axios';
import useClickOutside from '../hooks/useClickOutside';
import BrandMark from './BrandMark';

/**
 * Unified Responsive Navbar Component
 * Supports:
 * - Public View: Home, About, Impact, FAQs, Contact, Language, Login
 * - Citizen View: Home, My Submissions, Report Problem, Impact, Notifications, Language, Profile, Refresh, Logout
 * - University / Industry View: Dashboard, Problems, Impact, Notifications, Language, Profile, Refresh, Logout
 */
function Navbar({ role: propRole, onRefresh }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Determine role & authentication from props or localStorage
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');
  const activeRole = propRole || (token ? storedRole : null);
  const userName = localStorage.getItem('userName') || 'User';
  const isEmailVerified = localStorage.getItem('isEmailVerified') === 'true';

  // State toggles for interactive menus
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mobileMenuToggleRef = useRef(null);

  // Click-outside listeners to automatically close open panels/dropdowns
  const languageMenuRef = useClickOutside(() => setLanguageMenuOpen(false), languageMenuOpen);
  const notificationsRef = useClickOutside(() => setNotificationsOpen(false), notificationsOpen);
  const profileRef = useClickOutside(() => setProfileOpen(false), profileOpen);
  const mobileMenuRef = useClickOutside(
    (event) => {
      if (!mobileMenuToggleRef.current?.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    },
    mobileMenuOpen,
  );

  // Notifications live state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setLanguageMenuOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Fetch notifications if logged in
  useEffect(() => {
    if (token) {
      api
        .get('/notifications')
        .then((res) => {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [token, location.pathname]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('isEmailVerified');
    navigate('/');
  };

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Switch Language
  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setLanguageMenuOpen(false);
    if (token) {
      api.put('/auth/language', { language: code }).catch(() => {});
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({ ...notification, read: true }))
      );
      setNotificationsOpen(false);
    } catch (e) {}
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (e) {}
  };

  const currentLangObj =
    AVAILABLE_LANGUAGES.find((l) => l.code === i18n.language) || AVAILABLE_LANGUAGES[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top micro-banner: Government of Jharkhand */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1 text-[11px] font-medium flex items-center justify-between border-b border-slate-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white tracking-wide">
              {t('home.govtTag')}
            </span>
            <span className="text-slate-400 hidden sm:inline">&bull; Built for Problem ID: SIH26043</span>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link to="/impact" className="hover:text-white transition-colors">
              {t('nav.impact')}
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Smart Education Domain</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
          <BrandMark compact />
          <div className="min-w-0">
            <span className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight block truncate group-hover:text-emerald-700 transition-colors">
              Samadhan<span className="text-emerald-600">Setu</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold hidden sm:block">
              {t('nav.subBrand')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Role-Aware) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {/* Public Links */}
          {!activeRole ? (
            <>
              <Link to="/" className="hover:text-emerald-600 transition-colors">
                {t('nav.home')}
              </Link>
              <a href="/#about" className="hover:text-emerald-600 transition-colors">
                {t('nav.about')}
              </a>
              <Link to="/impact" className="hover:text-emerald-600 transition-colors">
                {t('nav.impact')}
              </Link>
              <a href="/#faqs" className="hover:text-emerald-600 transition-colors">
                {t('nav.faqs')}
              </a>
              <a href="/#contact" className="hover:text-emerald-600 transition-colors">
                {t('nav.contact')}
              </a>
            </>
          ) : activeRole === 'citizen' ? (
            /* Citizen Navigation: Home, My Submissions, Report Problem, Impact */
            <>
              <Link to="/" className="hover:text-emerald-600 transition-colors">
                {t('nav.home')}
              </Link>
              <Link to="/my-submissions" className="hover:text-emerald-600 transition-colors font-semibold">
                My Submissions
              </Link>
              <Link to="/report-problem" className="hover:text-emerald-600 transition-colors text-emerald-700 font-bold flex items-center gap-1">
                <span>+ Report Problem</span>
              </Link>
              <Link to="/impact" className="hover:text-emerald-600 transition-colors">
                {t('nav.impact')}
              </Link>
            </>
          ) : activeRole === 'admin' ? (
            /* Admin Navigation */
            <>
              <Link to="/admin/dashboard" className="hover:text-slate-900 transition-colors font-bold text-slate-900 flex items-center gap-1">
                <span>Admin Dashboard</span>
              </Link>
              <Link to="/admin/institutions" className="hover:text-slate-900 transition-colors font-semibold text-slate-700">
                Verified Institutions
              </Link>
              <Link to="/impact" className="hover:text-emerald-600 transition-colors">
                {t('nav.impact')}
              </Link>
            </>
          ) : (
            /* University & Industry Navigation */
            <>
              <Link to={`/${activeRole}/dashboard`} className="hover:text-emerald-600 transition-colors font-semibold">
                {t('nav.dashboard')}
              </Link>
              <Link to="/impact" className="hover:text-emerald-600 transition-colors">
                {t('nav.impact')}
              </Link>
            </>
          )}
        </nav>

        {/* Right Tools: Language, Notifications, Profile, Refresh, Logout/Login */}
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageMenuRef}>
            <button
              type="button"
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className="flex shrink-0 items-center gap-1 px-1.5 sm:gap-1.5 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              title={t('nav.language')}
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="hidden min-[400px]:inline">{currentLangObj.nativeName}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Language Dropdown Menu */}
            {languageMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>{t('nav.language')}</span>
                  <Link
                    to={`/select-language${activeRole ? `/${activeRole}` : ''}`}
                    onClick={() => setLanguageMenuOpen(false)}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      i18n.language === lang.code ? 'font-bold text-emerald-700 bg-emerald-50/60' : 'text-slate-700'
                    }`}
                  >
                    <span>{lang.nativeName} ({lang.name})</span>
                    {i18n.language === lang.code && <span className="text-emerald-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logged In Controls */}
          {activeRole ? (
            <>
              {/* Notifications Button */}
              <div id="notifications" className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 relative transition-colors"
                  title={t('nav.notifications')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popup */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs">
                    <div className="font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>{t('nav.notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-emerald-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="py-2 text-slate-600 space-y-2 max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-slate-400 py-4 text-xs">
                          {t('nav.noNotifications')}
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            type="button"
                            key={notif._id}
                            onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                            className={`p-2.5 rounded-lg border ${
                              notif.read
                                ? 'bg-slate-50/50 border-slate-100'
                                : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                            } text-left w-full transition-colors ${notif.read ? '' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-slate-800">{notif.title}</p>
                              {!notif.read && <span className="mt-1 w-2 h-2 shrink-0 rounded-full bg-emerald-600" aria-label="Unread" />}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title={t('nav.refresh')}
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Profile Button */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex shrink-0 items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                  title={t('nav.profile')}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{userName}</span>
                </button>

                {/* Profile Popup */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 text-xs">
                    <div className="pb-3 border-b border-slate-100">
                      <p className="font-bold text-slate-800 text-sm">{userName}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold text-[10px] capitalize">
                        Role: {activeRole}
                      </span>
                    </div>

                    <div className="py-2.5 text-slate-600 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>Email Status:</span>
                        <span className={`font-semibold ${isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Language:</span>
                        <span className="font-semibold text-slate-800">{currentLangObj.nativeName}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors block text-center"
                      >
                        Edit Profile Details
                      </Link>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                title={t('nav.logout')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{t('nav.logout')}</span>
              </button>
            </>
          ) : (
            /* Public View: Sign In Link */
            <a
              href="/#roles"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              Sign In / Access
            </a>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            ref={mobileMenuToggleRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden shrink-0 p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          {!activeRole ? (
            <>
              <Link to="/" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.home')}
              </Link>
              <a href="/#about" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.about')}
              </a>
              <Link to="/impact" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.impact')}
              </Link>
              <a href="/#faqs" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.faqs')}
              </a>
              <a href="/#contact" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.contact')}
              </a>
            </>
          ) : activeRole === 'citizen' ? (
            <>
              <Link to="/" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.home')}
              </Link>
              <Link to="/my-submissions" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                My Submissions
              </Link>
              <Link to="/report-problem" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-emerald-700 font-bold">
                + Report Problem
              </Link>
              <Link to="/impact" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.impact')}
              </Link>
              <Link to="/profile" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                Profile
              </Link>
            </>
          ) : activeRole === 'admin' ? (
            <>
              <Link to="/admin/dashboard" onClick={closeMobileMenu} className="block py-2 text-sm font-bold text-slate-900">
                Admin Dashboard
              </Link>
              <Link to="/admin/institutions" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                Verified Institutions
              </Link>
              <Link to="/impact" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.impact')}
              </Link>
              <Link to="/profile" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link to={`/${activeRole}/dashboard`} onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.dashboard')}
              </Link>
              <a href={`/${activeRole}/dashboard#problems-list`} onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.browseChallenges')}
              </a>
              <Link to="/impact" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                {t('nav.impact')}
              </Link>
              <Link to="/profile" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600">
                Profile
              </Link>
            </>
          )}

          {activeRole && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Logged in as {userName}</span>
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
