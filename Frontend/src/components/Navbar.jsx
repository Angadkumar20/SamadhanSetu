import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Navbar Component
 * Displays the application brand, current role badge (if logged in),
 * and a Logout button that clears localStorage and redirects to Home.
 */
function Navbar({ role }) {
  const navigate = useNavigate();

  // Function to handle logout
  const handleLogout = () => {
    // 1. Remove the JWT token and stored user details from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');

    // 2. Redirect user to the Landing Page
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            SS
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 tracking-tight block group-hover:text-sky-600 transition-colors">
              Samadhan<span className="text-emerald-600">Setu</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:block">
              Civic Solutions Bridge
            </span>
          </div>
        </Link>

        {/* Right Section: Role Indicator & Logout Button */}
        <div className="flex items-center gap-4">
          {role && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold rounded-full capitalize">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Role: {role}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all duration-200"
            title="Logout and return to Home"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
