import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

/**
 * IndustryDashboard Component
 * Route: "/industry/dashboard"
 * Allows industry partners to:
 * 1. Discover problems that are already taken up by universities ("assigned" or "in_progress").
 * 2. Offer to collaborate (calls PUT /api/problems/:id/status with { status: "in_progress" }).
 */
function IndustryDashboard() {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collaboratingId, setCollaboratingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Fetch problems and filter for assigned or in_progress
  const fetchCollaborativeProblems = async () => {
    try {
      setIsLoading(true);
      // GET /api/problems
      const response = await api.get('/problems');
      const allProblems = Array.isArray(response.data) ? response.data : response.data.problems || [];

      // Filter only problems that are 'assigned' or 'in_progress'
      const filtered = allProblems.filter(
        (p) => p.status === 'assigned' || p.status === 'in_progress'
      );

      setProblems(filtered);
    } catch (error) {
      console.error('Failed to load industry collaboration feed:', error);
      setFeedback({
        type: 'error',
        message: 'Could not fetch projects. Make sure http://localhost:5000 is active.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborativeProblems();
  }, []);

  // Handle "Offer to collaborate"
  // As requested: call PUT /api/problems/:id/status with status "in_progress"
  const handleCollaborate = async (problemId) => {
    setFeedback({ type: '', message: '' });
    setCollaboratingId(problemId);

    try {
      await api.put(`/problems/${problemId}/status`, {
        status: 'in_progress',
      });

      setFeedback({
        type: 'success',
        message: 'Collaboration offer registered! Project status marked as In Progress.',
      });

      // Refresh data
      fetchCollaborativeProblems();
    } catch (error) {
      console.error('Collaboration failed:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Could not send collaboration offer.',
      });
    } finally {
      setCollaboratingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar role="industry" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Industry Collaboration Exchange
            </h1>
            <p className="text-slate-600 mt-1">
              Partner with academic teams working on verified civic challenges. Provide funding, mentoring, or tech.
            </p>
          </div>

          <button
            onClick={fetchCollaborativeProblems}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Projects
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${
              feedback.type === 'success'
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

        {/* Content Listing */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <div className="animate-spin w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Scanning active university projects...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No Active Projects Available</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Problems will appear here once universities adopt them (status &quot;assigned&quot; or &quot;in_progress&quot;).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => {
              const pId = problem._id || problem.id;
              const isWorking = collaboratingId === pId;
              const isInProgress = problem.status === 'in_progress';

              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Category & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold rounded-md uppercase tracking-wider">
                        {problem.category || 'Civic'}
                      </span>
                      <StatusBadge status={problem.status} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                      {problem.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {problem.description}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{problem.location || 'Local Area'}</span>
                    </div>
                  </div>

                  {/* Collaboration Action */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleCollaborate(pId)}
                      disabled={isWorking}
                      className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                        isInProgress
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isWorking ? (
                        'Submitting Collaboration...'
                      ) : isInProgress ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Collaborating (In Progress)
                        </>
                      ) : (
                        'Offer to collaborate'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

export default IndustryDashboard;
