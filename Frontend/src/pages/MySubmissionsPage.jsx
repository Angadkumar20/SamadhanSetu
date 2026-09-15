import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import AIInsightsCard from '../components/AIInsightsCard';
import ProblemTimeline from '../components/ProblemTimeline';

/**
 * MySubmissionsPage Component
 * Route: "/my-submissions"
 * Lists all problems submitted by the logged-in citizen with:
 * - Title, Category, District, Submission Date, Status Badge
 * - Interactive modal displaying full problem details & evidence files
 * - Filter by status
 */
function MySubmissionsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login/citizen');
      return;
    }
    if (role !== 'citizen') {
      navigate(`/${role}/dashboard`);
      return;
    }

    fetchSubmissions();
  }, [token, role]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/problems/my-submissions');
      setSubmissions(response.data.problems || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setErrorMessage(
        error.response?.data?.message || 'Could not load submissions. Please ensure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            ● Pending
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            ● Under Review
          </span>
        );
      case 'assigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            ● Assigned
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
            ● In Progress
          </span>
        );
      case 'solved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ Solved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            ✕ Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((p) => {
    if (statusFilter === 'All') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="citizen" onRefresh={fetchSubmissions} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Citizen Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Submitted Problems
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track the progress, administrative verification, and university R&D status of your community challenges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/report-problem"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>+ Report New Problem</span>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 mr-1 uppercase tracking-wider">Filter:</span>
            {['All', 'pending', 'under_review', 'assigned', 'in_progress', 'solved', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredSubmissions.length} of {submissions.length} submission{submissions.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Content Listing */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 text-sm font-medium">Retrieving your submissions from the database...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              📂
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No submissions found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {statusFilter === 'All'
                ? "You haven't submitted any civic problems yet. Voice a local challenge today!"
                : `No submissions with status "${statusFilter.replace('_', ' ')}" found.`}
            </p>
            <Link
              to="/report-problem"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Report a Problem Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSubmissions.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedProblem(item)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                      {item.category || 'General'}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    📍 {item.district || 'Jharkhand'}
                  </span>
                  <span>
                    📅 {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProblem(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedProblem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                {selectedProblem.category}
              </span>
              {getStatusBadge(selectedProblem.status)}
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 mb-2">
              {selectedProblem.title}
            </h2>

            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4 mb-5 pb-3 border-b border-slate-100">
              <span>📍 {selectedProblem.landmark ? `${selectedProblem.landmark}, ` : ''}{selectedProblem.district}, {selectedProblem.state || 'Jharkhand'}</span>
              <span>📅 Submitted: {new Date(selectedProblem.createdAt).toLocaleString()}</span>
              <span className="font-mono text-[11px] text-slate-400">ID: {selectedProblem._id}</span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Detailed Description:
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {selectedProblem.description}
              </p>
            </div>

            <div className="mb-6">
              <AIInsightsCard
                insights={selectedProblem.aiInsights}
                category={selectedProblem.category}
              />
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <ProblemTimeline
                problem={selectedProblem}
                status={selectedProblem.status}
                timeline={selectedProblem.timeline}
                detailed={true}
              />
            </div>

            {/* Assigned Academic Institution (if any) */}
            {selectedProblem.assignedUniversity && (
              <div className="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                <span className="font-bold block mb-1">🎓 Adopted by University Lab:</span>
                <p className="font-semibold text-sm text-sky-950">
                  {selectedProblem.assignedUniversity.name}
                  {selectedProblem.assignedUniversity.organization ? ` (${selectedProblem.assignedUniversity.organization})` : ''}
                </p>
                <p className="text-sky-700 text-[11px] mt-0.5">Faculty and student research teams are engineering technical prototypes for this problem.</p>
              </div>
            )}

            {/* Evidence Media Preview */}
            {selectedProblem.media && selectedProblem.media.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Uploaded Evidence ({selectedProblem.media.length}):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedProblem.media.map((file, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between text-xs"
                    >
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        {file.mimetype.startsWith('video') ? '🎬 Video' : '📷 Photo'}
                      </span>
                      <span className="font-semibold text-slate-800 truncate mt-1" title={file.originalName}>
                        {file.originalName}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      {token && (
                        <a
                          href={buildApiUrl(`${file.url}?token=${encodeURIComponent(token)}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 text-[11px] font-bold text-emerald-600 hover:underline"
                        >
                          View Evidence &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Coordinates */}
            {(selectedProblem.latitude || selectedProblem.longitude) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mb-6 flex items-center justify-between">
                <span>GPS Site Coordinates:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedProblem.latitude}, {selectedProblem.longitude}
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProblem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>SamadhanSetu &bull; Citizen Grievance Portal &bull; Government of Jharkhand</p>
      </footer>
    </div>
  );
}

export default MySubmissionsPage;
