import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

/**
 * UniversityDashboard Component
 * Route: "/university/dashboard"
 * Allows universities and researchers to:
 * 1. Browse all submitted problems (GET /api/problems)
 * 2. Assign a problem to their university (PUT /api/problems/:id/assign)
 * 3. Update the status of assigned problems via dropdown (PUT /api/problems/:id/status)
 */
function UniversityDashboard() {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Fetch all problems from backend
  const fetchAllProblems = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/problems');
      const data = Array.isArray(response.data) ? response.data : response.data.problems || [];
      setProblems(data);
    } catch (error) {
      console.error('Failed to load problems:', error);
      setFeedback({
        type: 'error',
        message: 'Could not fetch problems from backend API. Make sure http://localhost:5000 is online.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProblems();
  }, []);

  // Handle "Assign to my university"
  const handleAssign = async (problemId) => {
    setFeedback({ type: '', message: '' });
    setActionLoadingId(problemId);

    try {
      // PUT /api/problems/:id/assign
      await api.put(`/problems/${problemId}/assign`);
      
      setFeedback({
        type: 'success',
        message: 'Problem successfully assigned to your university!',
      });

      // Refresh the problems list
      fetchAllProblems();
    } catch (error) {
      console.error('Assign failed:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign problem.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Dropdown Status Update
  const handleStatusChange = async (problemId, newStatus) => {
    setFeedback({ type: '', message: '' });
    setActionLoadingId(problemId);

    try {
      // PUT /api/problems/:id/status with { status: newStatus }
      await api.put(`/problems/${problemId}/status`, {
        status: newStatus,
      });

      setFeedback({
        type: 'success',
        message: `Status updated to "${newStatus.replace('_', ' ')}"!`,
      });

      // Refresh the list
      fetchAllProblems();
    } catch (error) {
      console.error('Status update failed:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update problem status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar with university role */}
      <Navbar role="university" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              University Research Portal
            </h1>
            <p className="text-slate-600 mt-1">
              Select community problems for student capstones, PhD theses, or departmental research.
            </p>
          </div>

          <button
            onClick={fetchAllProblems}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Feed
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

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <div className="animate-spin w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading problems catalog...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No problems available</h3>
            <p className="text-slate-500 text-sm">No citizen problems have been reported yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => {
              const pId = problem._id || problem.id;
              const isAssigned = problem.status === 'assigned' || problem.status === 'in_progress' || problem.status === 'solved';
              const isCurrentActionBusy = actionLoadingId === pId;

              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Status & Category Tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold rounded-md uppercase tracking-wider">
                        {problem.category || 'General'}
                      </span>
                      <StatusBadge status={problem.status} />
                    </div>

                    {/* Problem Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                      {problem.title}
                    </h3>

                    {/* Problem Description */}
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {problem.description}
                    </p>

                    {/* Location Info */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{problem.location || 'Location unspecified'}</span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {/* Assign Button */}
                    {!isAssigned ? (
                      <button
                        onClick={() => handleAssign(pId)}
                        disabled={isCurrentActionBusy}
                        className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isCurrentActionBusy ? 'Processing...' : 'Assign to my university'}
                      </button>
                    ) : (
                      <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-lg text-center">
                        ✓ Assigned to University
                      </div>
                    )}

                    {/* Dropdown to Update Status (Available for assigned problems) */}
                    {isAssigned && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Update Live Status:
                        </label>
                        <select
                          value={problem.status}
                          disabled={isCurrentActionBusy}
                          onChange={(e) => handleStatusChange(pId, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="solved">Solved</option>
                        </select>
                      </div>
                    )}
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

export default UniversityDashboard;
