import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LandingPage Component
 * Route: "/"
 * The public entry point for SamadhanSetu.
 * Displays the mission, tagline, and three distinct entry cards for:
 * 1. Citizens
 * 2. Universities
 * 3. Industries
 */
function LandingPage() {
  const roles = [
    {
      id: 'citizen',
      title: 'Citizen Login',
      badge: 'Report & Track',
      description:
        'Raise civic issues, infrastructure concerns, and local community challenges directly to solvers.',
      iconBg: 'bg-emerald-100 text-emerald-700',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      borderAccent: 'hover:border-emerald-500',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'university',
      title: 'University Login',
      badge: 'Research & Innovate',
      description:
        'Engage faculty and student researchers to adopt real local challenges and develop working prototypes.',
      iconBg: 'bg-sky-100 text-sky-700',
      buttonBg: 'bg-sky-600 hover:bg-sky-700',
      borderAccent: 'hover:border-sky-500',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
        </svg>
      ),
    },
    {
      id: 'industry',
      title: 'Industry Login',
      badge: 'Collaborate & Scale',
      description:
        'Collaborate on university projects with mentorship, corporate grants, and industrial-scale manufacturing.',
      iconBg: 'bg-teal-100 text-teal-700',
      buttonBg: 'bg-teal-600 hover:bg-teal-700',
      borderAccent: 'hover:border-teal-500',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-emerald-50 flex flex-col justify-between">
      
      {/* Top Banner Header */}
      <header className="max-w-7xl mx-auto w-full px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
            SS
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
            Samadhan<span className="text-emerald-600">Setu</span>
          </span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Govt / Civic Innovation Initiative
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Subtle top pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Empowering Grassroots Solutions
        </div>

        {/* Main Title & Tagline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl">
          Samadhan<span className="text-emerald-600">Setu</span>
        </h1>
        
        <p className="mt-4 text-xl sm:text-2xl font-medium text-sky-800 max-w-2xl">
          Bridging Citizens, Universities & Industry
        </p>

        <p className="mt-3 text-slate-600 max-w-2xl text-base sm:text-lg">
          A tri-party collaboration portal where citizens voice local issues, universities
          engineer tangible research solutions, and industries scale them into reality.
        </p>

        {/* Three Big Role Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl border border-slate-200 transition-all duration-300 flex flex-col justify-between ${role.borderAccent}`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-xl ${role.iconBg}`}>
                    {role.icon}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {role.badge}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {role.title}
                </h2>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {role.description}
                </p>
              </div>

              {/* Action Link Button */}
              <Link
                to={`/login/${role.id}`}
                className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-center text-sm shadow-md transition-colors flex items-center justify-center gap-2 ${role.buttonBg}`}
              >
                Continue as {role.id.charAt(0).toUpperCase() + role.id.slice(1)}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-sm text-slate-500 bg-white/60 backdrop-blur-sm">
        <p>SamadhanSetu &bull; Built with React, Tailwind CSS & Vite</p>
      </footer>

    </div>
  );
}

export default LandingPage;
