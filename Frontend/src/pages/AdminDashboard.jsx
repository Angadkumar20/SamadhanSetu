import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import DistrictMap, { DISTRICT_POINTS } from '../components/DistrictMap';
import api from '../api/axios';

const normalizeDistrict = (value) => String(value || '')
  .toLowerCase()
  .replace(/[()]/g, ' ')
  .replace(/[^a-z\s-]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const canonicalDistrict = (value) => {
  const normalized = normalizeDistrict(value);
  if (!normalized) return 'Location Not Available';
  if (normalized.includes('east singhbhum')) return 'East Singhbhum';
  if (normalized.includes('west singhbhum')) return 'West Singhbhum';
  if (normalized.includes('sahibganj') || normalized.includes('sahebganj')) return 'Sahibganj';
  if (normalized.includes('seraikela') || normalized.includes('serai kela')) return 'Seraikela-Kharsawan';

  const match = DISTRICT_POINTS.find((district) => normalizeDistrict(district.name) === normalized);
  return match?.name || 'Location Not Available';
};

const getProblemPriority = (problem) => String(problem.priority || problem.aiInsights?.priority || '').toLowerCase();

const getDistrictStats = (problems) => {
  const stats = {};
  [...DISTRICT_POINTS.map((district) => district.name), 'Location Not Available'].forEach((district) => {
    stats[district] = { total: 0, pending: 0, inProgress: 0, solved: 0, high: 0, unresolved: 0, categories: {} };
  });

  problems.forEach((problem) => {
    const district = canonicalDistrict(problem.district);
    const current = stats[district];
    const status = String(problem.status || '').toLowerCase();
    const isSolved = status === 'solved';
    const isRejected = status === 'rejected';
    current.total += 1;
    current.pending += ['pending', 'under_review'].includes(status) ? 1 : 0;
    current.inProgress += ['assigned', 'in_progress', 'solution_submitted'].includes(status) ? 1 : 0;
    current.solved += isSolved ? 1 : 0;
    current.unresolved += !isSolved && !isRejected ? 1 : 0;
    current.high += getProblemPriority(problem) === 'high' && !isSolved && !isRejected ? 1 : 0;
    const category = problem.category || problem.aiInsights?.category || 'Other';
    current.categories[category] = (current.categories[category] || 0) + 1;
  });

  return stats;
};

/**
 * AdminDashboard Component
 * Route: "/admin/dashboard"
 * Primary control center for Government Administrators:
 * 1. Live metrics across all lifecycle stages
 * 2. Problem review & assignment queue
 * 3. Verified institution partner statistics
 * 4. Geographic & category distribution summaries
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'all' | 'analytics'
  const [allProblems, setAllProblems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login/admin');
      return;
    }
    if (role !== 'admin') {
      navigate(`/${role}/dashboard`);
      return;
    }

    fetchDashboardData();
  }, [token, role]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [dashRes, probsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/problems'),
      ]);
      setData(dashRes.data);
      setAllProblems(probsRes.data.problems || []);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      setErrorMessage(
        error.response?.data?.message || 'Could not load admin dashboard. Ensure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = data?.metrics || {
    totalProblems: 0,
    pendingProblems: 0,
    underReviewProblems: 0,
    approvedProblems: 0,
    assignedProblems: 0,
    inProgressProblems: 0,
    solutionSubmittedProblems: 0,
    solvedProblems: 0,
    rejectedProblems: 0,
    resolutionRate: 0,
    totalUniversities: 0,
    totalIndustries: 0,
    verifiedUniversities: 0,
    verifiedIndustries: 0,
    pendingInstitutions: 0,
  };

  const filteredProblems = allProblems.filter((p) => {
    if (statusFilter === 'All') return true;
    return p.status === statusFilter;
  });

  const districtStats = useMemo(() => getDistrictStats(allProblems), [allProblems]);
  const priorityDistricts = useMemo(
    () => Object.entries(districtStats)
      .filter(([district, stats]) => district !== 'Location Not Available' && stats.total > 0)
      .sort(([, left], [, right]) => right.unresolved - left.unresolved || right.high - left.high)
      .slice(0, 5),
    [districtStats],
  );
  const selectedDistrictStats = selectedDistrict ? districtStats[selectedDistrict] : null;
  const selectedDistrictProblems = selectedDistrict
    ? allProblems.filter((problem) => canonicalDistrict(problem.district) === selectedDistrict)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="admin" onRefresh={fetchDashboardData} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Government Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span>🏛️ Government of Jharkhand • Closed Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              State Civic Administration Portal
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Review crowdsourced challenges, enforce institutional verifications, assign research labs, and evaluate solutions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/institutions"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Verify Institutions</span>
              {metrics.pendingInstitutions > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {metrics.pendingInstitutions}
                </span>
              )}
            </Link>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* 8-Lifecycle State Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{metrics.pendingProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Review</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{metrics.underReviewProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{metrics.approvedProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-sky-200 bg-sky-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Assigned</p>
            <p className="text-2xl font-black text-sky-700 mt-1">{metrics.assignedProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-black text-teal-700 mt-1">{metrics.inProgressProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-violet-200 bg-violet-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Solutions</p>
            <p className="text-2xl font-black text-violet-700 mt-1">{metrics.solutionSubmittedProblems}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Solved</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.solvedProblems}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'review'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Action Queue ({(data?.reviewQueue || []).length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Submissions ({allProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            State Demographics & Analytics
          </button>
        </div>

        {/* TAB 1: Review Queue */}
        {activeTab === 'review' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Administrative Action Required
                </h2>
                <p className="text-xs text-slate-500">
                  Problems waiting for initial review, clarification, or final solution verification.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">Loading action queue...</p>
              </div>
            ) : (data?.reviewQueue || []).length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-sm font-bold text-slate-800">Action Queue Clear!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  All citizen reports and developed solutions have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.reviewQueue.map((problem) => {
                  const pId = problem._id;
                  const isSolutionReview = problem.status === 'solution_submitted';

                  return (
                    <div
                      key={pId}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            #REF-{(pId || '').slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                            {problem.category || 'General'}
                          </span>
                          <StatusBadge status={problem.status} />
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-1">
                          {problem.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {problem.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>📍 {problem.district || 'Jharkhand'}</span>
                          <span>👤 By: {problem.submittedBy?.name || 'Citizen'}</span>
                          {isSolutionReview && (
                            <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded">
                              ✨ Solution by {problem.solution?.submittedBy?.name || 'Assigned Partner'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/admin/problems/${pId}`}
                          className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                            isSolutionReview
                              ? 'bg-violet-600 hover:bg-violet-700'
                              : 'bg-slate-900 hover:bg-slate-800'
                          }`}
                        >
                          {isSolutionReview ? 'Verify Solution →' : 'Review & Assign →'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Submissions Table */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">All Crowdsourced Submissions</h2>
                <p className="text-xs text-slate-500">Complete catalog of civic challenges across Jharkhand.</p>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  'All',
                  'pending',
                  'under_review',
                  'approved',
                  'assigned',
                  'in_progress',
                  'solution_submitted',
                  'solved',
                  'rejected',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {filteredProblems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No problems match the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Ref ID</th>
                      <th className="p-3">Title & Category</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Citizen</th>
                      <th className="p-3">Assigned Partner</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProblems.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700">
                          #{(p._id || '').slice(-6).toUpperCase()}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 line-clamp-1 max-w-xs">{p.title}</p>
                          <span className="text-[10px] text-slate-500 font-semibold">{p.category}</span>
                        </td>
                        <td className="p-3">{p.district || 'Jharkhand'}</td>
                        <td className="p-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="p-3">{p.submittedBy?.name || 'Citizen'}</td>
                        <td className="p-3">
                          {p.assignedUniversity?.name ||
                            p.assignedInstitutions?.[0]?.institution?.name ||
                            'Unassigned'}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            to={`/admin/problems/${p._id}`}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                          >
                            Manage &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Analytics & Demographic Overview */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* District decision-support map */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">District Problem Map</p>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">Where unresolved civic workload is concentrated</h2>
                  <p className="text-xs text-slate-500 mt-1">Interactive view based on the real problem records currently available to Government.</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{allProblems.length} records</span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
                  <div className="h-80 rounded-xl bg-slate-100" />
                  <div className="h-80 rounded-xl bg-slate-100" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <DistrictMap
                    districtStats={districtStats}
                    selectedDistrict={selectedDistrict}
                    onSelect={setSelectedDistrict}
                  />

                  <div className="space-y-4">
                    {selectedDistrict && selectedDistrictStats ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Selected District</p>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedDistrict}</h3>
                          </div>
                          <button type="button" onClick={() => setSelectedDistrict(null)} className="text-[11px] font-bold text-slate-500 hover:text-slate-900">Clear</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                          {[
                            ['Total', selectedDistrictStats.total, 'text-slate-900'],
                            ['Pending', selectedDistrictStats.pending, 'text-amber-700'],
                            ['In Progress', selectedDistrictStats.inProgress, 'text-sky-700'],
                            ['Solved', selectedDistrictStats.solved, 'text-emerald-700'],
                            ['High Priority', selectedDistrictStats.high, 'text-red-700'],
                          ].map(([label, value, color]) => (
                            <div key={label} className="rounded-lg border border-white bg-white/80 p-2">
                              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
                              <strong className={`mt-1 block text-lg ${color}`}>{value}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-emerald-100 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Common Categories</p>
                          {Object.keys(selectedDistrictStats.categories).length === 0 ? (
                            <p className="text-xs text-slate-500">No problems recorded for this district.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(selectedDistrictStats.categories).sort(([, left], [, right]) => right - left).slice(0, 6).map(([category, count]) => (
                                <span key={category} className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 border border-emerald-100">{category}: {count}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-emerald-100 pt-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">District Problems</p>
                            <span className="text-[10px] text-slate-500">{selectedDistrictProblems.length} records</span>
                          </div>
                          {selectedDistrictProblems.length === 0 ? (
                            <p className="text-xs text-slate-500">No problems in this district.</p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {selectedDistrictProblems.slice(0, 8).map((problem) => (
                                <Link key={problem._id} to={`/admin/problems/${problem._id}`} className="block rounded-lg bg-white px-3 py-2 border border-slate-200 hover:border-emerald-300">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-bold text-slate-800">{problem.title}</span>
                                    <StatusBadge status={problem.status} />
                                  </div>
                                  <span className="text-[10px] text-slate-500">{problem.category || 'Other'}{getProblemPriority(problem) === 'high' ? ' • High priority' : ''}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 min-h-72 flex items-center justify-center text-center">
                        <div>
                          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">⌖</div>
                          <h3 className="text-sm font-bold text-slate-800">Select a district</h3>
                          <p className="mt-1 text-xs text-slate-500">Choose a marker to see workload, categories, and problem links.</p>
                        </div>
                      </div>
                    )}

                    <button type="button" onClick={() => setSelectedDistrict('Location Not Available')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Location Not Available</span>
                      <span className="mt-1 block text-sm font-bold text-slate-800">{districtStats['Location Not Available'].total} problem{districtStats['Location Not Available'].total === 1 ? '' : 's'} without a usable district</span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">District Attention</p>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1">Priority Districts</h2>
                <p className="text-xs text-slate-500 mt-1">Ranked by unresolved workload, with high-priority cases as additional context.</p>
              </div>
              {priorityDistricts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">No district problem data is available yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {priorityDistricts.map(([district, stats], index) => (
                    <button key={district} type="button" onClick={() => setSelectedDistrict(district)} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-amber-300 hover:bg-amber-50/40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-slate-400">0{index + 1}</span>
                        <span className="text-[10px] font-bold text-amber-700">{stats.high} high priority</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-bold text-slate-900">{district}</p>
                      <p className="mt-1 text-xs text-slate-600"><strong className="text-slate-900">{stats.unresolved}</strong> unresolved of {stats.total}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Problems by Category</h3>
              <p className="text-xs text-slate-500 mb-4">Focus areas submitted by citizens across sectors.</p>
              <div className="space-y-3">
                {(data?.categoryDistribution || []).map((cat) => {
                  const pct =
                    metrics.totalProblems > 0
                      ? Math.round((cat.count / metrics.totalProblems) * 100)
                      : 0;
                  return (
                    <div key={cat._id}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{cat._id || 'Uncategorized'}</span>
                        <span className="text-slate-500">
                          {cat.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* District Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Problems by District</h3>
              <p className="text-xs text-slate-500 mb-4">Geographic distribution across 24 Jharkhand districts.</p>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(data?.districtDistribution || []).map((dst) => {
                  const pct =
                    metrics.totalProblems > 0
                      ? Math.round((dst.count / metrics.totalProblems) * 100)
                      : 0;
                  return (
                    <div key={dst._id}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{dst._id || 'General'}</span>
                        <span className="text-slate-500">
                          {dst.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
