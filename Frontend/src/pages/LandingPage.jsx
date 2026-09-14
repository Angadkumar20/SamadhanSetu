import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import api from '../api/axios';

/**
 * LandingPage Component
 * Route: "/"
 * Government-style, professional portal landing page for SamadhanSetu:
 * 1. Top Section: Government of Jharkhand Initiative with civic seal emblem.
 * 2. Hero Section: "Every Problem Deserves a Path to a Solution."
 * 3. CTAs: "Report a Problem" and "View Public Impact".
 * 4. Conditional Access Section:
 *    - Unauthenticated Public Visitor: Displays 3 Role Portals + Admin Gateway.
 *    - Authenticated Logged-In User (Citizen/Univ/Ind/Admin): Displays Personalized Workspace Overview without role cards.
 * 5. How It Works: Visual workflow diagram.
 * 6. About / Our Mission: Exact required text and four pillars.
 * 7. FAQ Section: Expandable interactive accordion.
 * 8. Contact Section: Form UI with support coordination desk info.
 */
function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check login state for conditional routing
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName') || 'User';

  // Live citizen metrics for logged-in citizen view
  const [citizenStats, setCitizenStats] = useState({ total: 0, pending: 0, inProgress: 0, solved: 0 });

  useEffect(() => {
    if (token && role === 'citizen') {
      api.get('/problems/my-submissions')
        .then((res) => {
          const list = res.data?.problems || (Array.isArray(res.data) ? res.data : []);
          setCitizenStats({
            total: list.length,
            pending: list.filter((p) => p.status === 'pending').length,
            inProgress: list.filter((p) => ['under_review', 'assigned', 'in_progress'].includes(p.status)).length,
            solved: list.filter((p) => p.status === 'solved').length,
          });
        })
        .catch(() => {});
    }
  }, [token, role]);

  const handleReportProblemClick = () => {
    if (token && role === 'citizen') {
      navigate('/report-problem');
    } else if (token) {
      navigate(`/${role}/dashboard`);
    } else {
      navigate('/login/citizen');
    }
  };

  // FAQ open/close state tracker
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Contact form local state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
  };

  // FAQ items list
  const faqs = [
    {
      q: 'What is SamadhanSetu?',
      a: 'SamadhanSetu is a digital bridge built for the Government of Jharkhand problem statement (SIH26043). It enables citizens to voice real societal challenges, government administrators to vet them, and verified universities and industry partners to collaborate on viable technical solutions.',
    },
    {
      q: 'Who can report a problem?',
      a: 'Any citizen of Jharkhand or user can register a Citizen account, verify their email address, and submit local community, civic, or infrastructure issues with description and optional photos.',
    },
    {
      q: 'Who can solve problems?',
      a: 'Faculty researchers, engineering institutions, and student innovators adopt challenges allocated to them. Corporate and industrial partners collaborate to provide technical mentorship and help scale working prototypes.',
    },
    {
      q: 'How are institutions verified?',
      a: 'Institutional accounts undergo manual administrative vetting. Only verified universities and accredited industry entities receive access to review and adopt problems.',
    },
    {
      q: 'Does SamadhanSetu process payments?',
      a: 'No. SamadhanSetu never processes payments. Industry funding commitments and research grants are recorded for public transparency only, with financial transactions occurring strictly through external official banking channels.',
    },
    {
      q: 'How will I know if my problem is solved?',
      a: 'Citizens can track real-time milestone badges directly from their dashboard: Pending Review → Verified → Adopted by University → In Progress → Solved.',
    },
    {
      q: 'Can I change my profile information?',
      a: 'Yes, basic profile details can be viewed from the top navigation bar, and contact details can be updated as profile management capabilities expand in Phase 3.',
    },
    {
      q: 'Can I change the language?',
      a: 'Yes! SamadhanSetu supports 12+ major Indian languages. Click the "Change Language" button in the navigation bar or top header at any time to switch instantly.',
    },
  ];

  const roles = [
    {
      id: 'citizen',
      title: 'Citizen Portal',
      badge: 'Report & Track',
      description:
        'Voice localized civic issues, infrastructure deficits, and public challenges directly to solvers.',
      iconBg: 'bg-emerald-100 text-emerald-700',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      borderAccent: 'hover:border-emerald-500',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'university',
      title: 'University Portal',
      badge: 'Research & Innovate',
      description:
        'Engage faculty researchers and student engineering teams to adopt verified local challenges for R&D.',
      iconBg: 'bg-sky-100 text-sky-700',
      buttonBg: 'bg-sky-600 hover:bg-sky-700',
      borderAccent: 'hover:border-sky-500',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
        </svg>
      ),
    },
    {
      id: 'industry',
      title: 'Industry Portal',
      badge: 'Collaborate & Scale',
      description:
        'Support university prototypes with domain mentorship, technology transfer, and industrial scaling.',
      iconBg: 'bg-teal-100 text-teal-700',
      buttonBg: 'bg-teal-600 hover:bg-teal-700',
      borderAccent: 'hover:border-teal-500',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  // How It Works Steps
  const workflowSteps = [
    {
      step: '01',
      title: 'Citizen Reports Problem',
      desc: 'Citizen submits civic challenge with location and evidence.',
      icon: '📝',
    },
    {
      step: '02',
      title: 'Government / Admin Review',
      desc: 'Administration validates legitimacy, prevents duplicates, and allocates challenge.',
      icon: '🏛️',
    },
    {
      step: '03',
      title: 'Verified Academic Access',
      desc: 'Accredited university researchers and students adopt the challenge.',
      icon: '🎓',
    },
    {
      step: '04',
      title: 'Research & Collaboration',
      desc: 'Universities develop prototypes with industry technology and mentorship.',
      icon: '⚙️',
    },
    {
      step: '05',
      title: 'Solution Implemented',
      desc: 'Field testing, administrative sign-off, and ground deployment.',
      icon: '🚀',
    },
    {
      step: '06',
      title: 'Citizen Notified + Impact Updated',
      desc: 'Citizen receives resolution status and public metrics reflect live impact.',
      icon: '📊',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Unified Role-Aware Navigation Bar */}
      <Navbar />

      <main className="flex-1">
        {/* ========================================================
            HERO SECTION
           ======================================================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            
            {/* Government Attribution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm border border-emerald-200">
              <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span>Government of Jharkhand Initiative &bull; SIH 2026</span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Every Problem Deserves a{' '}
              <span className="text-emerald-700 underline decoration-emerald-400 underline-offset-8">
                Path to a Solution.
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-normal">
              SamadhanSetu connects citizens voicing real community challenges with district administrators, engineering university researchers, and industry leaders to collaboratively build tested, scalable solutions.
            </p>

            {/* Hero Call-To-Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleReportProblemClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('home.reportBtn')}
              </button>

              <Link
                to="/impact"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm shadow-sm border border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('home.impactBtn')}
              </Link>
            </div>

            {/* Sub-notice */}
            <div className="mt-6 text-xs text-slate-500">
              Built for Problem Statement SIH26043 &bull; Closed, Verified Network with District Oversight
            </div>

          </div>
        </section>

        {/* ========================================================
            ROLE / DASHBOARD ACCESS SECTION
            - Public visitors see role entry cards
            - Logged-in users see personalized workspace without role cards
           ======================================================== */}
        {!token || !role ? (
          <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Gateway Access
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {t('home.portalsTitle')}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {t('home.portalsSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {roles.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl border border-slate-200 transition-all duration-200 flex flex-col justify-between ${item.borderAccent}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-xl ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={`/login/${item.id}`}
                      className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-center text-sm shadow-sm transition-colors flex items-center justify-center gap-2 ${item.buttonBg}`}
                    >
                      <span>Sign In as {item.id.charAt(0).toUpperCase() + item.id.slice(1)}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>

                    <Link
                      to={`/register/${item.id}`}
                      className="block text-center text-xs text-slate-500 hover:text-slate-800 hover:underline py-1"
                    >
                      Don't have an account? Register &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Government Administrator Access Banner */}
            <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-lg shrink-0">
                  🏛️
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-100">
                    Government of Jharkhand Administration
                  </p>
                  <p className="text-xs text-slate-400">
                    State-level nodal oversight: review submissions, verify institutions, assign research labs, and audit solutions.
                  </p>
                </div>
              </div>
              <Link
                to="/login/admin"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 text-center shadow-xs"
              >
                Government Admin Portal &rarr;
              </Link>
            </div>
          </section>
        ) : role === 'citizen' ? (
          /* ========================================================
              LOGGED-IN CITIZEN PERSONALIZED HOME HUB
             ======================================================== */
          <section className="relative overflow-hidden border-y border-emerald-100 bg-emerald-50/50 py-12 sm:py-16">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(5, 150, 105, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(5, 150, 105, 0.07) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
              aria-hidden="true"
            />
            <div className="absolute -right-24 -top-28 hidden h-72 w-72 rounded-full border-[18px] border-emerald-200/40 sm:block" aria-hidden="true" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
              <div className="bg-white/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-emerald-900/5 border border-white/80 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-700 text-amber-200 flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l2.2 5.6L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.4L12 2z" />
                      </svg>
                    </span>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                      Citizen Action Hub
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t('auth.welcomeBack', 'Welcome Back')}, {userName}
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Track your reported civic issues and help Jharkhand build better local solutions.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/report-problem"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <span>+ {t('problem.submitProblem', 'Report a Problem')}</span>
                  </Link>
                  <Link
                    to="/my-submissions"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    View My Submissions &rarr;
                  </Link>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold">i</span>
                <p className="text-xs leading-relaxed text-sky-900">
                  Share a clear description, location, and any helpful evidence when reporting a civic problem. Your submission is reviewed before it reaches verified research and industry partners.
                </p>
              </div>

              {/* Your Overview Metrics */}
              <div className="mt-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Your Submission Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500">{t('impact.totalReported', 'Total Reported')}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{citizenStats.total}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-800">{t('status.pending', 'Pending')}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1">{citizenStats.pending}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <p className="text-xs font-semibold text-teal-800">{t('status.in_progress', 'In Progress')}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-1">{citizenStats.inProgress}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-800">{t('status.solved', 'Solved')}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">{citizenStats.solved}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Launcher */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    to="/report-problem"
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center gap-3 group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      ✍️
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Report a Problem</p>
                      <p className="text-xs text-slate-500">Submit a 3-step civic report</p>
                    </div>
                  </Link>

                  <Link
                    to="/my-submissions"
                    className="p-4 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 transition-all flex items-center gap-3 group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      📁
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">My Submissions</p>
                      <p className="text-xs text-slate-500">View timeline and updates</p>
                    </div>
                  </Link>

                  <Link
                    to="/impact"
                    className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all flex items-center gap-3 group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      📊
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">View Public Impact</p>
                      <p className="text-xs text-slate-500">24 Districts real-time stats</p>
                    </div>
                  </Link>
                </div>
              </div>
              </div>
            </div>
          </section>
        ) : (
          /* ========================================================
              LOGGED-IN UNIVERSITY / INDUSTRY / ADMIN WORKSPACE HUB
             ======================================================== */
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-widest block mb-1">
                    {role === 'university'
                      ? 'University Researcher Workspace'
                      : role === 'industry'
                      ? 'Industry Scale Workspace'
                      : 'State Administration Portal'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t('auth.welcomeBack', 'Welcome Back')}, {userName}
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    {role === 'university'
                      ? 'Adopt allocated challenges, build prototypes, and post research milestones.'
                      : role === 'industry'
                      ? 'Collaborate on university prototypes, provide grants, and industrial scaling.'
                      : 'Supervise problem verification, institutional onboarding, and state audits.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/${role}/dashboard`}
                    className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Open {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard &rarr;</span>
                  </Link>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to={`/${role}/dashboard`}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Manage Active Tasks
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/admin/institutions"
                    className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors"
                  >
                    Verified Institutions
                  </Link>
                )}
                <Link
                  to="/impact"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  View Public Impact
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            HOW IT WORKS SECTION
           ======================================================== */}
        <section className="bg-slate-100/70 border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Collaborative Process
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                How SamadhanSetu Works
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                A structured 6-stage lifecycle ensuring accountability, technical vetting, and measurable public impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowSteps.map((s) => (
                <div
                  key={s.step}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{s.icon}</span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-mono">
                      {s.step}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {s.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            ABOUT / OUR MISSION SECTION (With exact requested texts)
           ======================================================== */}
        <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              About SamadhanSetu
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Connecting Jharkhand's grassroots realities with institutional technical capabilities.
            </p>
          </div>

          <div className="space-y-8">
            {/* Mission Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-extrabold tracking-widest uppercase text-emerald-800 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                OUR MISSION
              </h3>
              <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
                "Jharkhand has thousands of local problems that may already have technical answers sitting in university departments — and thousands of students who need real problems to work on. SamadhanSetu is the bridge (Setu) between citizens, government administration, universities and industry, helping verified institutions collaborate on real societal challenges."
              </p>
            </div>

            {/* For Whom Grid */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-extrabold tracking-widest uppercase text-sky-800 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                FOR WHOM
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Citizens</span>
                  <p className="text-slate-600">Report real localized civic, water, agricultural, and infrastructure problems.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Government</span>
                  <p className="text-slate-600">Administrators review, vet, and coordinate problem assignments.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Universities</span>
                  <p className="text-slate-600">Engineering and research faculties adopt meaningful real-world challenges.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Students</span>
                  <p className="text-slate-600">Aspiring innovators gain practical engineering experience building prototypes.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Industry Partners</span>
                  <p className="text-slate-600">Contribute domain expertise, equipment, and scale-up innovation.</p>
                </div>
              </div>
            </div>

            {/* Money Stays Outside + Closed Verified Network Two-Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Money Outside */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold tracking-widest uppercase text-amber-800 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    MONEY STAYS OUTSIDE THE PLATFORM
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "Industry funding commitments may be recorded for transparency and reporting only. Actual transfer of funds happens through existing government and institutional channels. SamadhanSetu does not process payments."
                  </p>
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-800 font-medium">
                  Zero financial transaction risk &bull; Strict transparency tracking
                </div>
              </div>

              {/* Closed Verified Network */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold tracking-widest uppercase text-teal-800 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    A CLOSED, VERIFIED NETWORK
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "This is not an open marketplace. Problems and institutional participation follow a verified and accountable process. Government administration can review and coordinate institutional access."
                  </p>
                </div>
                <div className="mt-4 p-3 bg-teal-50 rounded-xl text-xs text-teal-800 font-medium">
                  Institutional vetting &bull; Administrative oversight at every milestone
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            FAQ SECTION (Accordion)
           ======================================================== */}
        <section id="faqs" className="bg-slate-100/70 border-y border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Help & Clarifications
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Essential information on reporting, academic adoption, verification, and governance.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 py-4 text-left font-semibold text-sm sm:text-base text-slate-900 hover:text-emerald-700 flex items-center justify-between gap-4 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <svg
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-600' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================
            CONTACT SECTION
           ======================================================== */}
        <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
              Assistance & Helpdesk
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Contact SamadhanSetu Support
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Official coordination desk for citizens, institutions, and industrial partners across Jharkhand.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Details Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Coordination Office
                </h4>
                <p className="text-sm font-semibold text-slate-800">
                  Project Management Unit (PMU) - Smart Jharkhand Innovation Cell
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Directorate of Higher & Technical Education, HEC Sector 4, Dhurwa, Ranchi, Jharkhand - 834004 (Placeholder)
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Electronic Mail
                </h4>
                <p className="text-sm font-semibold text-emerald-700">
                  support@samadhansetu.jharkhand.gov.in
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  General queries, institutional verification requests, and technical helpdesk.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Toll-Free Civic Helpline
                </h4>
                <p className="text-sm font-semibold text-slate-800">
                  1800-XXX-XXXX / 0651-XXXXXXX
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Operating Hours: Monday to Friday, 9:30 AM – 6:00 PM IST
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Important Note:</strong> To report a civic or community problem, please use the <strong>Report a Problem</strong> button above or sign in to your Citizen Portal. The contact form is designated for platform assistance and institutional inquiries.
              </div>
            </div>

            {/* Contact Form Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Send an Inquiry
              </h3>

              {contactSubmitted ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    ✓
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">Inquiry Recorded</h4>
                  <p className="text-xs text-slate-600 mb-4">
                    Thank you, {contactForm.name}. Your message has been received by our coordination desk.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactForm({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Send another inquiry &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Institutional Partnership or Account Query"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your query or request..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-colors"
                  >
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>SamadhanSetu &bull; Built for Government of Jharkhand Problem Statement (SIH26043)</p>
      </footer>
    </div>
  );
}

export default LandingPage;
