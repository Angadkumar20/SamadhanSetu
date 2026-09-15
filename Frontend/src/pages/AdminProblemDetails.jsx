import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import ProblemTimeline from '../components/ProblemTimeline';
import AIInsightsCard from '../components/AIInsightsCard';
import api, { buildApiUrl } from '../api/axios';

const getWorkflowState = (status) => {
  const normalized = String(status || 'pending').toLowerCase();

  if (['pending', 'under_review'].includes(normalized)) {
    return { step1Active: true, step2Active: false, step3Active: false, step1Complete: false, step2Complete: false, step3Complete: false };
  }

  if (normalized === 'approved') {
    return { step1Active: false, step2Active: true, step3Active: false, step1Complete: true, step2Complete: false, step3Complete: false };
  }

  if (normalized === 'assigned') {
    return { step1Active: false, step2Active: false, step3Active: true, step1Complete: true, step2Complete: true, step3Complete: false };
  }

  if (['in_progress', 'solution_submitted'].includes(normalized)) {
    return { step1Active: false, step2Active: false, step3Active: true, step1Complete: true, step2Complete: true, step3Complete: true };
  }

  if (normalized === 'solved') {
    return { step1Active: false, step2Active: false, step3Active: false, step1Complete: true, step2Complete: true, step3Complete: true };
  }

  if (normalized === 'rejected') {
    return { step1Active: false, step2Active: false, step3Active: false, step1Complete: false, step2Complete: false, step3Complete: false };
  }

  return { step1Active: true, step2Active: false, step3Active: false, step1Complete: false, step2Complete: false, step3Complete: false };
};

/**
 * AdminProblemDetails Component
 * Route: "/admin/problems/:id"
 * Administrative problem command center:
 * - Scrutinize citizen submission, evidence, and coordinates
 * - Execute Review Actions (Approve, Reject, Request More Info)
 * - Execute Institution Assignment (Verified University / Industry)
 * - Execute Solution Verification (Approve Solved / Request Changes / Reject)
 */
function AdminProblemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Verified institutions for assignment dropdown
  const [institutions, setInstitutions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Review action modal state
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject' | 'request_info'
  const [reviewReason, setReviewReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Solution verification state
  const [solutionNotes, setSolutionNotes] = useState('');
  const [isVerifyingSolution, setIsVerifyingSolution] = useState(false);

  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate('/login/admin');
      return;
    }

    fetchProblemDetails();
    fetchVerifiedInstitutions();
  }, [id, token, role]);

  // Auto-dismiss temporary success messages after 4 seconds
  useEffect(() => {
    if (feedback.message && feedback.type === 'success') {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchProblemDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/problems/${id}`);
      setProblem(res.data);
      if (res.data.assignedUniversity?._id) {
        setSelectedUniversity(res.data.assignedUniversity._id);
      }
    } catch (err) {
      console.error('Error fetching problem details:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not load problem details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVerifiedInstitutions = async () => {
    try {
      const res = await api.get(`/admin/institutions?status=Verified&problemId=${id}`);
      setInstitutions(res.data.institutions || []);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error('Error fetching verified institutions:', err);
    }
  };

  // Submit Problem Review (Approve / Reject / Request Info)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsReviewing(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        action: reviewAction,
        reason: reviewReason,
        message: reviewReason,
      };

      const res = await api.put(`/admin/problems/${id}/review`, payload);
      setFeedback({
        type: 'success',
        message: res.data.message || 'Problem review recorded successfully!',
      });
      setReviewReason('');
      setProblem(res.data.problem || null);
      await fetchProblemDetails();
    } catch (err) {
      console.error('Review submit failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit review.',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // Submit Institution Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUniversity && !selectedIndustry) {
      setFeedback({
        type: 'error',
        message: 'Please select at least one verified University or Industry.',
      });
      return;
    }

    setIsAssigning(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.put(`/admin/problems/${id}/assign`, {
        universityId: selectedUniversity || undefined,
        industryId: selectedIndustry || undefined,
        notes: assignNotes,
      });

      setFeedback({
        type: 'success',
        message: res.data.message || 'Assignment completed successfully!',
      });
      setAssignNotes('');
      setProblem(res.data.problem || null);
      await fetchProblemDetails();
    } catch (err) {
      console.error('Assignment submit failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to assign institutions.',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Submit Solution Verification (Approve / Request Changes / Reject)
  const handleSolutionVerification = async (action) => {
    setIsVerifyingSolution(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.put(`/admin/solutions/${id}/review`, {
        action,
        notes: solutionNotes,
      });

      setFeedback({
        type: 'success',
        message: res.data.message || `Solution verification action "${action}" completed!`,
      });
      setSolutionNotes('');
      setProblem(res.data.problem || null);
      await fetchProblemDetails();
    } catch (err) {
      console.error('Solution verification failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to verify solution.',
      });
    } finally {
      setIsVerifyingSolution(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600 text-sm font-medium">Loading administrative problem data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar role="admin" />
        <div className="flex-1 max-w-4xl mx-auto w-full p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Problem Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">The requested problem reference could not be located.</p>
          <Link to="/admin/dashboard" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pId = problem._id;
  const refCode = `#REF-${pId.slice(-6).toUpperCase()}`;
  const verifiedUniversities = institutions.filter((i) => i.role === 'university');
  const verifiedIndustries = institutions.filter((i) => i.role === 'industry');
  const workflowState = getWorkflowState(problem.status);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="admin" onRefresh={fetchProblemDetails} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link to="/admin/dashboard" className="hover:text-slate-900">
            Admin Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{refCode}</span>
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
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Main Header */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {refCode}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                  {problem.category}
                </span>
                <StatusBadge status={problem.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {problem.title}
              </h1>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p>
                Reported on:{' '}
                <strong className="text-slate-700">
                  {new Date(problem.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </p>
              <p className="mt-0.5">
                District: <strong className="text-slate-700">{problem.district || 'Jharkhand'}</strong>
              </p>
            </div>
          </div>

          {/* Problem Lifecycle Timeline */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Government Lifecycle Timeline
            </h3>
            <ProblemTimeline problem={problem} status={problem.status} timeline={problem.timeline} detailed={true} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Details, Evidence, Progress, and Submitted Solution */}
          <div className="lg:col-span-7 space-y-6">
            {/* Description & Location */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-2">Problem Description</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
                {problem.description}
              </p>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Geographic Coordinates & Location
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5 border border-slate-200">
                <p>
                  <strong>State:</strong> {problem.state || 'Jharkhand'}
                </p>
                <p>
                  <strong>District:</strong> {problem.district || 'Unspecified'}
                </p>
                {problem.landmark && (
                  <p>
                    <strong>Landmark / Ward:</strong> {problem.landmark}
                  </p>
                )}
                {problem.latitude && problem.longitude && (
                  <p className="flex items-center gap-2">
                    <strong>GPS:</strong> {problem.latitude.toFixed(5)}, {problem.longitude.toFixed(5)}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${problem.latitude}&mlon=${problem.longitude}#map=16/${problem.latitude}/${problem.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline hover:text-sky-700 ml-2"
                    >
                      Open in Map ↗
                    </a>
                  </p>
                )}
              </div>
            </div>

            <AIInsightsCard insights={problem.aiInsights} category={problem.category} />

            {/* Evidence Media Viewer */}
            {problem.media && problem.media.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-3">
                  Photo & Video Evidence ({problem.media.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {problem.media.map((item, idx) => {
                    const isVideo = item.mimetype?.startsWith('video/');
                    const mediaSrc = buildApiUrl(`/api/problems/media/${item.filename}?token=${encodeURIComponent(token || '')}`);

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-white flex flex-col justify-between"
                      >
                        {isVideo ? (
                          <>
                            <video
                              controls
                              className="w-full h-44 object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                const fallback = event.currentTarget.parentElement?.querySelector('[data-fallback]');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            >
                              <source src={mediaSrc} type={item.mimetype} />
                            </video>
                            <div data-fallback style={{ display: 'none' }} className="h-44 w-full items-center justify-center bg-slate-800 text-slate-300 text-xs font-semibold">
                              Media unavailable
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={mediaSrc}
                              alt={item.originalName}
                              className="w-full h-44 object-cover bg-slate-100"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                const fallback = event.currentTarget.parentElement?.querySelector('[data-fallback]');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div data-fallback style={{ display: 'none' }} className="h-44 w-full items-center justify-center bg-slate-800 text-slate-300 text-xs font-semibold">
                              Media unavailable
                            </div>
                          </>
                        )}
                        <div className="p-2.5 text-[11px] bg-slate-900 truncate">
                          <span className="font-semibold">{item.originalName}</span>
                          <span className="text-slate-400 block">
                            {(item.size / (1024 * 1024)).toFixed(1)} MB • {item.mimetype}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submitted Solution Section (If Available) */}
            {problem.solution && problem.solution.title && (
              <div className="bg-white p-6 rounded-2xl border-2 border-violet-300 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider">
                    ✨ Submitted Engineering Solution
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Status: <strong className="text-violet-900">{problem.solution.verificationStatus || 'pending'}</strong>
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  {problem.solution.title}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  {problem.solution.description}
                </p>

                <div className="space-y-3 bg-violet-50/50 p-4 rounded-xl text-xs text-slate-800 border border-violet-100">
                  <div>
                    <strong className="block text-violet-900 uppercase font-bold text-[10px] mb-0.5">
                      Implementation Details:
                    </strong>
                    <p className="whitespace-pre-line">{problem.solution.implementationDetails}</p>
                  </div>
                  <div>
                    <strong className="block text-violet-900 uppercase font-bold text-[10px] mb-0.5">
                      Expected Impact:
                    </strong>
                    <p className="whitespace-pre-line">{problem.solution.expectedImpact}</p>
                  </div>
                  {(problem.solution.repositoryUrl || problem.solution.demoUrl) && (
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-violet-200">
                      {problem.solution.repositoryUrl && (
                        <a
                          href={problem.solution.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-700 font-bold underline"
                        >
                          Code Repository ↗
                        </a>
                      )}
                      {problem.solution.demoUrl && (
                        <a
                          href={problem.solution.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 font-bold underline"
                        >
                          Live Working Demo ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Government Solution Verification Controls (For admin when solution is submitted) */}
                <div className="mt-5 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Government Solution Verification
                  </h4>
                  <textarea
                    rows="2"
                    value={solutionNotes}
                    onChange={(e) => setSolutionNotes(e.target.value)}
                    placeholder="Enter official verification notes, review observations, or revision instructions..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-3"
                  ></textarea>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isVerifyingSolution}
                      onClick={() => handleSolutionVerification('approve')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      ✓ Approve Solution & Mark Problem Solved
                    </button>
                    <button
                      type="button"
                      disabled={isVerifyingSolution}
                      onClick={() => handleSolutionVerification('request_changes')}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      ↩ Request Revisions
                    </button>
                    <button
                      type="button"
                      disabled={isVerifyingSolution}
                      onClick={() => handleSolutionVerification('reject')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      ✕ Reject Solution
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Updates Feed */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                Institutional Research & Progress Logs ({problem.progressUpdates?.length || 0})
              </h2>

              {!problem.progressUpdates || problem.progressUpdates.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No progress logs posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {problem.progressUpdates.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          {item.postedBy?.name || 'Assigned Partner'}
                        </span>
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {item.progressPercentage || 0}% Complete
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{item.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(item.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: Citizen Profile, Review Form, and Assignment Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Citizen Identity Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Reporting Citizen Details
              </h3>
              <div className="text-xs space-y-1.5 text-slate-700">
                <p>
                  <strong>Name:</strong> {problem.submittedBy?.name || 'Citizen'}
                </p>
                <p>
                  <strong>Email:</strong> {problem.submittedBy?.email || 'N/A'}
                </p>
                {problem.submittedBy?.phone && (
                  <p>
                    <strong>Phone:</strong> {problem.submittedBy.phone}
                  </p>
                )}
                {problem.submittedBy?.organization && (
                  <p>
                    <strong>Affiliation:</strong> {problem.submittedBy.organization}
                  </p>
                )}
              </div>
            </div>

            {/* ADMINISTRATIVE ACTION 1: Problem Review Form */}
            {!problem.status || problem.status === 'pending' || problem.status === 'under_review' ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Step 1: Administrative Review
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Validate problem legitimacy and readiness for university assignment.
                </p>

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Review Decision:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReviewAction('approve')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                          reviewAction === 'approve'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('request_info')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                          reviewAction === 'request_info'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ? Ask Info
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('reject')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                          reviewAction === 'reject'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {reviewAction === 'reject'
                        ? 'Rejection Reason *'
                        : reviewAction === 'request_info'
                        ? 'Information Required from Citizen *'
                        : 'Internal Review Notes (Optional)'}
                    </label>
                    <textarea
                      rows="3"
                      required={reviewAction !== 'approve'}
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder={
                        reviewAction === 'reject'
                          ? 'State specific reason for rejection...'
                          : reviewAction === 'request_info'
                          ? 'Describe what specific information the citizen should provide...'
                          : 'Optional notes for audit log...'
                      }
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isReviewing}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isReviewing ? 'Saving Review...' : `Submit Review (${reviewAction.replace('_', ' ')})`}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-emerald-900 mb-1">Step 1: Administrative Review Complete</h3>
                <p className="text-xs text-emerald-800">
                  This problem has already passed the government review stage. The next available step is based on the current backend status.
                </p>
              </div>
            )}

            {/* ADMINISTRATIVE ACTION 2: Institutional Assignment Form */}
            {['approved', 'assigned', 'in_progress', 'solution_submitted', 'solved'].includes(problem.status) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Step 2: Assign Verified Institutions
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Closed Verified Network: Assign verified academic and industry partners.
                </p>

                {problem.status === 'approved' || problem.status === 'assigned' || problem.status === 'in_progress' || problem.status === 'solution_submitted' || problem.status === 'solved' ? (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Recommended Institutions</p>
                        <p className="text-[11px] text-emerald-900 mt-1">Compatibility suggestions based on this problem's category and text.</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">Verified only</span>
                    </div>

                    {recommendations.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-emerald-200 bg-white/70 px-3 py-3 text-xs text-slate-600">
                        No strong institution match found. Use the verified institution lists below for manual assignment.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recommendations.map((institution) => (
                          <div key={institution.id} className="rounded-lg border border-white bg-white p-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-slate-900" title={institution.name}>{institution.name}</p>
                                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  {institution.type === 'university' ? 'University' : 'Industry'}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">
                                {institution.matchScore}% Match
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="min-w-0 truncate text-[11px] text-slate-600" title={institution.expertise}>
                                <span className="font-bold text-slate-500">Expertise:</span> {institution.expertise}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (institution.type === 'university') setSelectedUniversity(institution.id);
                                  if (institution.type === 'industry') setSelectedIndustry(institution.id);
                                }}
                                className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {problem.status === 'approved' || problem.status === 'assigned' ? (
                  <form onSubmit={handleAssignSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Verified University / Research Lab:
                      </label>
                      <select
                        value={selectedUniversity}
                        onChange={(e) => setSelectedUniversity(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="">-- Select Verified University --</option>
                        {verifiedUniversities.map((uni) => (
                          <option key={uni._id} value={uni._id}>
                            {uni.name} ({uni.organization || 'University'}) ✓ Verified
                          </option>
                        ))}
                      </select>
                      {verifiedUniversities.length === 0 && (
                        <p className="text-[10px] text-amber-700 mt-1">
                          No verified universities available.{' '}
                          <Link to="/admin/institutions" className="underline font-bold">
                            Verify universities here
                          </Link>
                          .
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Verified Industry Partner (Optional):
                      </label>
                      <select
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="">-- Select Verified Industry Partner --</option>
                        {verifiedIndustries.map((ind) => (
                          <option key={ind._id} value={ind._id}>
                            {ind.name} ({ind.organization || 'Industry'}) ✓ Verified
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Special Directives / Funding Notes:
                      </label>
                      <textarea
                        rows="2"
                        value={assignNotes}
                        onChange={(e) => setAssignNotes(e.target.value)}
                        placeholder="e.g. Focus on student capstone testing within 6 weeks..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isAssigning || problem.status === 'assigned'}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isAssigning ? 'Dispatching Assignment...' : problem.status === 'assigned' ? 'Institution Assignment Already Completed' : 'Confirm Institutional Assignment'}
                    </button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-900 font-semibold">
                    Institutional assignment is already completed for this problem. The government workflow is now in the work and verification stage.
                  </div>
                )}
              </div>
            )}

            {problem.status === 'rejected' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-rose-900 mb-1">Submission Rejected</h3>
                <p className="text-xs text-rose-800">
                  This reporting cycle is closed. No further assignment or solution workflow is available until a new review is initiated.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminProblemDetails;
