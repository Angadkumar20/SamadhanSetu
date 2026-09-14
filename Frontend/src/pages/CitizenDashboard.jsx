import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';
import { Link } from 'react-router-dom';

/**
 * CitizenDashboard Component
 * Route: "/citizen/dashboard"
 * Primary hub for verified citizens:
 * 1. Overview metrics and quick-action launcher for the official 3-Step Report flow.
 * 2. Fetches and displays recent personal submissions using GET /api/problems/my-submissions.
 * 3. Shows clean empty state if no submissions exist.
 */
function CitizenDashboard() {
  const [problems, setProblems] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Fetch current user's submitted problems from Phase 3 endpoint
  const fetchProblems = async () => {
    try {
      setIsLoadingProblems(true);
      setFeedback({ type: '', message: '' });
      // GET /api/problems/my-submissions attaches JWT token via axios interceptor
      const response = await api.get('/problems/my-submissions');
      const list = response.data?.problems || (Array.isArray(response.data) ? response.data : []);
      setProblems(list);
    } catch (error) {
      console.error('Error fetching citizen submissions:', error);
      setFeedback({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Could not load your previous submissions. Please check backend connection.',
      });
    } finally {
      setIsLoadingProblems(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Auto-dismiss temporary success messages after 4 seconds
  useEffect(() => {
    if (feedback.message && feedback.type === 'success') {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Quick metrics calculations
  const totalCount = problems.length;
  const pendingCount = problems.filter((p) => p.status === 'pending').length;
  const inProgressCount = problems.filter((p) =>
    ['under_review', 'assigned', 'in_progress'].includes(p.status)
  ).length;
  const solvedCount = problems.filter((p) => p.status === 'solved').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="citizen" onRefresh={fetchProblems} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Citizen Action Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Community Problems Dashboard
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Submit local civic, environmental, or public challenges and monitor research & resolution progress.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/report-problem"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New 3-Step Report</span>
            </Link>
            <Link
              to="/my-submissions"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>View Portfolio</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
              }`}
          >
            {feedback.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Quick Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Total Reported
            </p>
            <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
              Pending Review
            </p>
            <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
              Under Investigation
            </p>
            <p className="text-2xl font-black text-teal-700">{inProgressCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              Solved & Resolved
            </p>
            <p className="text-2xl font-black text-emerald-700">{solvedCount}</p>
          </div>
        </div>

        {/* Submitted Problems Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Submitted Problems ({problems.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official grievances and problem statements filed from your account.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchProblems}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh List</span>
              </button>

              <Link
                to="/report-problem"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
              >
                + New Report
              </Link>
            </div>
          </div>

          {isLoadingProblems ? (
            <div className="p-16 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm font-medium">Loading your submissions from database...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl">
                📝
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No problems submitted yet
              </h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto mb-6 leading-relaxed">
                You haven't reported any local societal or civic challenges yet. Use the 3-Step Report flow with Voice-to-Text and AI categorization to submit your first issue.
              </p>
              <Link
                to="/report-problem"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Start 3-Step Report</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {problems.map((problem) => {
                const pId = problem._id || problem.id;
                const refCode = pId ? `#REF-${pId.slice(-6).toUpperCase()}` : '';
                const createdDate = problem.createdAt
                  ? new Date(problem.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  : 'Recent';

                return (
                  <div
                    key={pId}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between bg-slate-50/50"
                  >
                    <div>
                      {/* Top Bar: Category, Reference ID & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                            {problem.category || 'General'}
                          </span>
                          {refCode && (
                            <span className="text-[11px] font-mono text-slate-400 font-semibold">
                              {refCode}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={problem.status} />
                      </div>

                      {/* Problem Title */}
                      <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug">
                        {problem.title}
                      </h3>

                      {/* Problem Description */}
                      <p className="text-slate-600 text-xs mb-4 leading-relaxed line-clamp-3">
                        {problem.description}
                      </p>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium text-slate-600 truncate max-w-[200px]">
                          {problem.district
                            ? `${problem.landmark ? problem.landmark + ', ' : ''}${problem.district}, ${problem.state || 'Jharkhand'}`
                            : typeof problem.location === 'string'
                              ? problem.location
                              : problem.location?.latitude
                                ? `GPS: ${problem.location.latitude.toFixed(3)}, ${problem.location.longitude.toFixed(3)}`
                                : 'Jharkhand'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {problem.media && problem.media.length > 0 && (
                          <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium">
                            📎 {problem.media.length} file{problem.media.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {createdDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CitizenDashboard;
