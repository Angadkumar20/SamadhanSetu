import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

/**
 * CitizenDashboard Component
 * Route: "/citizen/dashboard"
 * Allows citizens to:
 * 1. Submit local problems with Title, Description, Location, and optional Image URL.
 *    (Note: Category is left for backend AI processing and not asked from the user).
 * 2. View all submitted problems along with their live progress status.
 */
function CitizenDashboard() {
  // Form input states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Status and data states
  const [problems, setProblems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Function to fetch submitted problems from backend
  const fetchProblems = async () => {
    try {
      setIsLoadingProblems(true);
      // GET /api/problems (Axios automatically attaches the JWT token from localStorage)
      const response = await api.get('/problems');
      // Set the problems list (handle either array or object response format)
      setProblems(Array.isArray(response.data) ? response.data : response.data.problems || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setFeedback({
        type: 'error',
        message: 'Could not load your previous submissions. Please check backend connection.',
      });
    } finally {
      setIsLoadingProblems(false);
    }
  };

  // Run fetchProblems once on initial mount
  useEffect(() => {
    fetchProblems();
  }, []);

  // Handle Form Submission for new problem
  const handleSubmitProblem = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    setIsSubmitting(true);

    try {
      // Data payload for POST /api/problems
      // Category is omitted from user inputs as requested (backend AI will classify)
      const payload = {
        title,
        description,
        location,
        imageUrl: imageUrl.trim() || undefined,
      };

      await api.post('/problems', payload);

      setFeedback({
        type: 'success',
        message: 'Problem submitted successfully! AI categorization and university matching in progress.',
      });

      // Clear the form fields
      setTitle('');
      setDescription('');
      setLocation('');
      setImageUrl('');

      // Refresh the list of problems below
      fetchProblems();
    } catch (error) {
      console.error('Submission failed:', error);
      setFeedback({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Failed to submit problem. Please ensure the backend is running.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <Navbar role="citizen" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Citizen Action Hub
          </h1>
          <p className="text-slate-600 mt-1">
            Report civic, environmental, or community issues to connect with university research teams.
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Problem Submission Form (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  +
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Report a Problem
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Fill in the details below. Our AI automatically classifies the domain to match universities.
              </p>

              <form onSubmit={handleSubmitProblem} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Severe waterlogging at Subhash Nagar crossroad"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, frequency, how long it has existed, and the impact on locals..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  ></textarea>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Location / Ward / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Sector 4, Indiranagar, Bengaluru"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                {/* Image URL (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                {/* AI Classification Info Notice */}
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-800 flex items-start gap-2">
                  <svg className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>AI Tagging:</strong> The problem category will be automatically detected by AI upon submission.
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm hover:shadow transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Submitting Issue...
                    </>
                  ) : (
                    'Submit Problem'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Submitted Problems List (7 cols on lg) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                My Submitted Problems ({problems.length})
              </h2>
              <button
                onClick={fetchProblems}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh List
              </button>
            </div>

            {isLoadingProblems ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-slate-500 text-sm">Loading submitted problems...</p>
              </div>
            ) : problems.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">
                  No problems submitted yet
                </h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Use the form on the left to submit your first local civic issue. It will appear here once saved.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {problems.map((problem) => (
                  <div
                    key={problem._id || problem.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {problem.title}
                      </h3>
                      <StatusBadge status={problem.status} />
                    </div>

                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                      {problem.description}
                    </p>

                    {/* Optional Image Preview */}
                    {(problem.imageUrl || problem.image) && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 max-h-56 bg-slate-100">
                        <img
                          src={problem.imageUrl || problem.image}
                          alt={problem.title}
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Meta details footer */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{problem.location || 'Local Area'}</span>
                      </div>

                      {problem.category && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-700 font-medium">
                          <span>AI Category: {problem.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default CitizenDashboard;
