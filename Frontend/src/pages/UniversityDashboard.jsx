import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import ProblemTimeline from '../components/ProblemTimeline';
import api from '../api/axios';

/**
 * UniversityDashboard Component
 * Route: "/university/dashboard"
 * Closed Verified Network Workspace for Academic Institutions & Researchers:
 * 1. Shows verification status from Government Administration
 * 2. Fetches only problems assigned by Government Admin (GET /api/problems/assigned)
 * 3. Allows accepting assignments, starting work, posting progress updates, and submitting solutions for review.
 */
function UniversityDashboard() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'in_progress' | 'solution_submitted' | 'solved'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal states for Progress Update and Solution Submission
  const [activeModal, setActiveModal] = useState(null); // 'progress' | 'solution' | null
  const [targetProblem, setTargetProblem] = useState(null);

  // Progress update form
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(25);

  // Solution submission form
  const [solTitle, setSolTitle] = useState('');
  const [solDesc, setSolDesc] = useState('');
  const [solImpl, setSolImpl] = useState('');
  const [solImpact, setSolImpact] = useState('');
  const [solRepo, setSolRepo] = useState('');
  const [solDemo, setSolDemo] = useState('');

  const token = localStorage.getItem('token');

  // Load user profile & assigned problems
  const loadData = async () => {
    setIsLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const profileRes = await api.get('/auth/me');
      if (profileRes.data.user?.role !== 'university') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('isEmailVerified');
        navigate('/login/university');
        return;
      }
      const assignedRes = await api.get('/problems/assigned');
      setUserProfile(profileRes.data.user);
      setProblems(assignedRes.data.problems || []);
    } catch (error) {
      console.error('Failed to load university workspace:', error);
      setFeedback({
        type: 'error',
        message:
          error.response?.data?.message || 'Could not fetch assigned problems. Ensure backend is running.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  // Auto-dismiss temporary success messages after 4 seconds
  useEffect(() => {
    if (feedback.message && feedback.type === 'success') {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Accept Assignment
  const handleAccept = async (problemId) => {
    setActionLoadingId(problemId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.put(`/problems/${problemId}/accept`);
      setFeedback({
        type: 'success',
        message: res.data.message || 'Assignment accepted by your university.',
      });
      loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to accept assignment.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Start Work
  const handleStartWork = async (problemId) => {
    setActionLoadingId(problemId);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.put(`/problems/${problemId}/start`);
      setFeedback({
        type: 'success',
        message: res.data.message || 'Work marked as In Progress. Citizen notified.',
      });
      loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to start problem work.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Progress Update
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!targetProblem) return;
    setActionLoadingId(targetProblem._id);
    try {
      const res = await api.post(`/problems/${targetProblem._id}/progress`, {
        message: progressMsg,
        progressPercentage: progressPct,
      });
      setFeedback({
        type: 'success',
        message: res.data.message || 'Milestone progress recorded.',
      });
      setActiveModal(null);
      setProgressMsg('');
      loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to post progress.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Solution for Government Verification
  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!targetProblem) return;
    setActionLoadingId(targetProblem._id);
    try {
      const res = await api.post(`/problems/${targetProblem._id}/solution`, {
        title: solTitle,
        description: solDesc,
        implementationDetails: solImpl,
        expectedImpact: solImpact,
        repositoryUrl: solRepo,
        demoUrl: solDemo,
      });
      setFeedback({
        type: 'success',
        message: res.data.message || 'Solution submitted for Government verification!',
      });
      setActiveModal(null);
      setSolTitle('');
      setSolDesc('');
      setSolImpl('');
      setSolImpact('');
      setSolRepo('');
      setSolDemo('');
      loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit solution.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter problems by tab
  const assignedList = problems.filter((p) => p.status === 'assigned');
  const inProgressList = problems.filter((p) => p.status === 'in_progress');
  const solutionList = problems.filter((p) => p.status === 'solution_submitted');
  const solvedList = problems.filter((p) => p.status === 'solved');

  const currentTabList =
    activeTab === 'assigned'
      ? assignedList
      : activeTab === 'in_progress'
      ? inProgressList
      : activeTab === 'solution_submitted'
      ? solutionList
      : solvedList;

  const isVerified = userProfile?.isVerified || userProfile?.verificationStatus === 'Verified';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="university" onRefresh={loadData} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold uppercase tracking-wider mb-2">
              <span>University Research Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Assigned Civic Research Catalog
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Work on problems assigned by the Government of Jharkhand. Collaborate, log lab progress, and submit final solutions.
            </p>
          </div>

          <button
            onClick={loadData}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Workspace</span>
          </button>
        </div>

        {/* Closed Verified Network Verification Status Banner */}
        {!isVerified && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
            <span className="text-base">⏳</span>
            <div>
              <p className="font-bold">Institutional Account Pending Government Verification</p>
              <p className="mt-0.5 text-amber-800">
                In accordance with Jharkhand Closed Verified Network policy, a Government Administrator must verify your university credentials before active problem assignments can be dispatched.
              </p>
            </div>
          </div>
        )}

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tabs for Assigned / In Progress / Solution Submitted / Solved */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'assigned'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Assigned Queue ({assignedList.length})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'in_progress'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            In Progress ({inProgressList.length})
          </button>
          <button
            onClick={() => setActiveTab('solution_submitted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'solution_submitted'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Solutions Under Verification ({solutionList.length})
          </button>
          <button
            onClick={() => setActiveTab('solved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'solved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Solved Archives ({solvedList.length})
          </button>
        </div>

        {/* Problems List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm font-medium">Loading university assignments...</p>
          </div>
        ) : currentTabList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
              📚
            </div>
            <h3 className="text-sm font-bold text-slate-800">No problems in this section</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Problems assigned to your university by the Government Administrator will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTabList.map((problem) => {
              const pId = problem._id;
              const refCode = `#REF-${pId.slice(-6).toUpperCase()}`;
              const isBusy = actionLoadingId === pId;

              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Status & Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {refCode}
                        </span>
                        <span className="px-2.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold rounded-md uppercase">
                          {problem.category || 'General'}
                        </span>
                      </div>
                      <StatusBadge status={problem.status} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                      {problem.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {problem.description}
                    </p>

                    {/* Location Info */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <span>📍</span>
                      <span className="truncate">
                        {problem.district
                          ? `${problem.landmark ? problem.landmark + ', ' : ''}${problem.district}, ${problem.state || 'Jharkhand'}`
                          : 'Location unspecified'}
                      </span>
                    </div>

                    {/* Timeline Snippet */}
                    <div className="mb-4 pt-3 border-t border-slate-100">
                      <ProblemTimeline problem={problem} status={problem.status} timeline={problem.timeline} />
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                    {problem.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => handleAccept(pId)}
                          disabled={isBusy}
                          className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                        >
                          {isBusy ? '...' : 'Accept Assignment'}
                        </button>
                        <button
                          onClick={() => handleStartWork(pId)}
                          disabled={isBusy}
                          className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                        >
                          {isBusy ? '...' : 'Start Active Work'}
                        </button>
                      </>
                    )}

                    {problem.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => {
                            setTargetProblem(problem);
                            setActiveModal('progress');
                          }}
                          className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition-colors"
                        >
                          + Post Progress Update
                        </button>
                        <button
                          onClick={() => {
                            setTargetProblem(problem);
                            setActiveModal('solution');
                          }}
                          className="flex-1 py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          Submit Final Solution →
                        </button>
                      </>
                    )}

                    {problem.status === 'solution_submitted' && (
                      <div className="w-full text-center py-2 px-3 bg-violet-50 text-violet-800 border border-violet-200 text-xs font-semibold rounded-xl">
                        ⏳ Solution Submitted — Awaiting Government Verification
                      </div>
                    )}

                    {problem.status === 'solved' && (
                      <div className="w-full text-center py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl">
                        ✓ Verified & Marked Solved by Government
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: Add Progress Update */}
        {activeModal === 'progress' && targetProblem && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Post Lab / Field Progress Update
              </h3>
              <p className="text-xs text-slate-500 mb-4">{targetProblem.title}</p>

              <form onSubmit={handleProgressSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Progress Update Details *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={progressMsg}
                    onChange={(e) => setProgressMsg(e.target.value)}
                    placeholder="e.g. Field water samples collected and analyzed; filter prototype designed."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Completion Percentage ({progressPct}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressPct}
                    onChange={(e) => setProgressPct(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Record Progress
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Submit Solution */}
        {activeModal === 'solution' && targetProblem && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
          >
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Submit Solution for Government Verification
              </h3>
              <p className="text-xs text-slate-500 mb-4">{targetProblem.title}</p>

              <form onSubmit={handleSolutionSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Solution Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={solTitle}
                    onChange={(e) => setSolTitle(e.target.value)}
                    placeholder="e.g. Low-cost IoT Smart Sump Pump for Subhash Nagar"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Solution Overview & Executive Summary *
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={solDesc}
                    onChange={(e) => setSolDesc(e.target.value)}
                    placeholder="Summarize the core mechanism, engineering approach, or social policy..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Implementation Details *
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={solImpl}
                    onChange={(e) => setSolImpl(e.target.value)}
                    placeholder="Describe bill of materials, deployment steps, code structure, or operational setup..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Societal Impact *
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={solImpact}
                    onChange={(e) => setSolImpact(e.target.value)}
                    placeholder="Estimated families helped, cost savings, or environmental improvement..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Repository URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={solRepo}
                      onChange={(e) => setSolRepo(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Working Demo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={solDemo}
                      onChange={(e) => setSolDemo(e.target.value)}
                      placeholder="https://demo.example.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Dispatch Solution for Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default UniversityDashboard;
