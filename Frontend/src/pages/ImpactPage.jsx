import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const metricDefinitions = {
  total: {
    label: 'Total Reported',
    description: 'All civic problems submitted through SamadhanSetu.',
    color: 'slate',
    statuses: null,
  },
  review: {
    label: 'Under Review',
    description: 'Problems awaiting or undergoing administrative review.',
    color: 'amber',
    statuses: ['pending', 'under_review'],
  },
  progress: {
    label: 'In Progress',
    description: 'Problems assigned to institutions or actively being worked on.',
    color: 'sky',
    statuses: ['assigned', 'in_progress', 'solution_submitted'],
  },
  solved: {
    label: 'Solved',
    description: 'Problems with solutions verified by Government administration.',
    color: 'emerald',
    statuses: ['solved'],
  },
};

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  solution_submitted: 'Solution Submitted',
  solved: 'Solved',
  rejected: 'Rejected',
};

/**
 * ImpactPage Component
 * Route: "/impact"
 * Displays public metrics for SamadhanSetu:
 * - Total Problems, Pending, In Progress, Solved
 * - Problems by Category
 * - Problems by Jharkhand Districts
 * - Live connection to /api/problems/public-stats with clean fallback
 */
function ImpactPage() {
  const [stats, setStats] = useState({
    totalProblems: 0,
    pendingProblems: 0,
    assignedProblems: 0,
    inProgressProblems: 0,
    solvedProblems: 0,
    totalUniversities: 0,
    totalIndustries: 0,
    byCategory: [],
    byLocation: [],
    byStatus: [],
    problems: [],
    resolutionRate: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // 24 Official Districts of Jharkhand
  const jharkhandDistricts = [
    'Ranchi', 'Dhanbad', 'East Singhbhum (Jamshedpur)', 'Bokaro',
    'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh',
    'Palamu', 'Dumka', 'West Singhbhum (Chaibasa)', 'Godda',
    'Sahebganj', 'Koderma', 'Chatra', 'Gumla',
    'Lohardaga', 'Latehar', 'Simdega', 'Garhwa',
    'Pakur', 'Jamtara', 'Khunti', 'Seraikela Kharsawan',
  ];

  // Standard Categories
  const standardCategories = [
    'Education', 'Healthcare', 'Agriculture', 'Water Resources',
    'Environment', 'Energy', 'Urban Development', 'Accessibility',
    'Public Administration', 'Rural Livelihoods',
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/problems/public-stats');
        if (response.data) {
          setStats((prev) => ({
            ...prev,
            ...response.data,
          }));
        }
      } catch (error) {
        console.warn('Could not fetch live public stats, displaying base metrics:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Compute category map
  const categoryMap = {};
  if (Array.isArray(stats.byCategory)) {
    stats.byCategory.forEach((item) => {
      if (item._id) categoryMap[item._id] = item.count;
    });
  }

  // Compute district map
  const locationMap = {};
  if (Array.isArray(stats.byLocation)) {
    stats.byLocation.forEach((item) => {
      if (item._id) locationMap[item._id.toLowerCase()] = item.count;
    });
  }

  const problems = Array.isArray(stats.problems) ? stats.problems : [];
  const statusMap = {};
  if (Array.isArray(stats.byStatus)) {
    stats.byStatus.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });
  }

  const metricProblems = selectedMetric
    ? problems.filter((problem) => {
        const statuses = metricDefinitions[selectedMetric].statuses;
        return !statuses || statuses.includes(problem.status);
      })
    : [];

  const selectedDefinition = selectedMetric ? metricDefinitions[selectedMetric] : null;
  const selectedCategoryMap = metricProblems.reduce((result, problem) => {
    const category = problem.category || 'General';
    result[category] = (result[category] || 0) + 1;
    return result;
  }, {});
  const selectedDistrictMap = metricProblems.reduce((result, problem) => {
    const district = problem.district || 'Unspecified';
    result[district] = (result[district] || 0) + 1;
    return result;
  }, {});

  const selectedStatusData = Object.entries(
    metricProblems.reduce((result, problem) => {
      const status = statusLabels[problem.status] || problem.status || 'Unknown';
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
  const selectedCategoryData = Object.entries(selectedCategoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const selectedDistrictData = Object.entries(selectedDistrictMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const chartColors = ['#059669', '#0284c7', '#d97706', '#7c3aed', '#e11d48', '#475569'];

  const openMetric = (metric) => setSelectedMetric(metric);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Public Accountability & Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            SamadhanSetu Public Impact Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Real-time status of civic problems reported by citizens, verified by government administrators, and engineered by university labs across Jharkhand.
          </p>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {/* Total Problems */}
          <button type="button" onClick={() => openMetric('total')} className="text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Reported</span>
              <span className="p-2 rounded-lg bg-slate-100 text-slate-700">📋</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {isLoading ? '...' : stats.totalProblems}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total civic issues submitted</p>
          </button>

          {/* Pending Verification */}
          <button type="button" onClick={() => openMetric('review')} className="text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Under Review</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-700">⏳</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-600">
              {isLoading ? '...' : stats.pendingProblems + stats.underReviewProblems}
            </div>
            <p className="text-xs text-slate-400 mt-1">Awaiting administrative vetting</p>
          </button>

          {/* In Progress */}
          <button type="button" onClick={() => openMetric('progress')} className="text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-sky-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
              <span className="p-2 rounded-lg bg-sky-50 text-sky-700">⚙️</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-sky-600">
              {isLoading ? '...' : stats.inProgressProblems + stats.assignedProblems + stats.solutionSubmittedProblems}
            </div>
            <p className="text-xs text-slate-400 mt-1">Adopted by university labs</p>
          </button>

          {/* Solved Problems */}
          <button type="button" onClick={() => openMetric('solved')} className="text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Solved</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">✅</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600">
              {isLoading ? '...' : stats.solvedProblems}
            </div>
            <p className="text-xs text-slate-400 mt-1">Verified solutions completed</p>
          </button>
        </div>

        {selectedMetric && selectedDefinition && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-10" aria-labelledby="metric-detail-title">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Selected Metric Detail</p>
                <h2 id="metric-detail-title" className="text-2xl font-extrabold text-slate-900 mt-1">{selectedDefinition.label}</h2>
                <p className="text-sm text-slate-600 mt-1">{selectedDefinition.description}</p>
              </div>
              <button type="button" onClick={() => setSelectedMetric(null)} className="self-start px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Back to Overview
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 p-5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Live matching problems</p>
                    <p className="text-4xl font-black text-slate-900 mt-1">{metricProblems.length}</p>
                  </div>
                  <span className="text-xs text-slate-500">Updated from the public statistics API</span>
                </div>
                {metricProblems.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No live problems match this metric yet.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {metricProblems.map((problem) => (
                      <div key={problem._id} className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{problem.title}</p>
                          <p className="text-xs text-slate-500">{problem.category || 'General'} · {problem.district || 'District not specified'}</p>
                        </div>
                        <span className="shrink-0 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">{statusLabels[problem.status] || problem.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(selectedCategoryMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([category, count]) => (
                    <div key={category}>
                      <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{category}</span><strong>{count}</strong></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.max(8, (count / metricProblems.length) * 100)}%` }} /></div>
                    </div>
                  ))}
                  {Object.keys(selectedCategoryMap).length === 0 && <p className="text-xs text-slate-500">No category data available.</p>}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-6 mb-3">Districts</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedDistrictMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([district, count]) => <span key={district} className="px-2 py-1 rounded-md bg-sky-50 text-sky-800 text-[11px] font-semibold">{district}: {count}</span>)}
                  {Object.keys(selectedDistrictMap).length === 0 && <p className="text-xs text-slate-500">No district data available.</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
              <div className="p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Status distribution</h3>
                <p className="text-xs text-slate-500 mb-3">Current status of matching problems.</p>
                {selectedStatusData.length === 0 ? (
                  <p className="text-xs text-slate-500 py-10 text-center">No status data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={selectedStatusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} label>
                        {selectedStatusData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="p-5 rounded-xl border border-slate-200 lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900">Problems by category</h3>
                <p className="text-xs text-slate-500 mb-3">Real category counts for this metric.</p>
                {selectedCategoryData.length === 0 ? (
                  <p className="text-xs text-slate-500 py-10 text-center">No category data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={selectedCategoryData} layout="vertical" margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Problems" fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="p-5 rounded-xl border border-slate-200 lg:col-span-3">
                <h3 className="text-sm font-bold text-slate-900">Problems by district</h3>
                <p className="text-xs text-slate-500 mb-3">Top districts represented in this metric.</p>
                {selectedDistrictData.length === 0 ? (
                  <p className="text-xs text-slate-500 py-10 text-center">No district data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={selectedDistrictData} margin={{ left: 8, right: 12, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={75} tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Problems" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {selectedMetric === 'solved' && metricProblems.some((problem) => problem.solution) && (
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Verified resolution information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {metricProblems.filter((problem) => problem.solution).slice(0, 6).map((problem) => (
                    <div key={`${problem._id}-solution`} className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                      <p className="font-bold text-emerald-900">{problem.solution.title || 'Verified solution'}</p>
                      <p className="text-emerald-800 mt-1">{problem.solution.verificationStatus || 'Verified'} · {problem.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Stakeholder Participation Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 mb-10 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                Participating Institutions
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">
                {stats.totalUniversities}
              </span>
              <p className="text-xs text-slate-300 mt-1">Engineering universities & research colleges</p>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                Industry Scaling Partners
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-sky-400">
                {stats.totalIndustries}
              </span>
              <p className="text-xs text-slate-300 mt-1">Corporate mentorship & tech contributors</p>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                Geographic Coverage
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-amber-300">
                24 Districts
              </span>
              <p className="text-xs text-slate-300 mt-1">Across the State of Jharkhand</p>
            </div>
          </div>
        </div>

        {/* Status Distribution + Resolution Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Status Distribution</h3>
            <p className="text-xs text-slate-500 mb-6">Current lifecycle state of every live reported problem.</p>
            <div className="space-y-3">
              {Object.entries(statusLabels).map(([status, label]) => {
                const count = statusMap[status] || 0;
                const percentage = stats.totalProblems > 0 ? (count / stats.totalProblems) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>{label}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-sky-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            {stats.totalProblems === 0 && <p className="text-xs text-slate-500 mt-4">No problem data is available yet.</p>}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Resolution Progress</h3>
            <p className="text-xs text-slate-500 mb-6">Verified solved problems as a share of all reported problems.</p>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 shrink-0 rounded-full" style={{ background: `conic-gradient(#059669 ${stats.resolutionRate}%, #e2e8f0 0)` }}>
                <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                  <span className="text-2xl font-black text-emerald-700">{stats.resolutionRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{stats.solvedProblems} of {stats.totalProblems} solved</p>
                <p className="text-xs text-slate-500 mt-1">Only Government-verified solutions count as resolved.</p>
              </div>
            </div>
            {stats.totalProblems === 0 && <p className="text-xs text-slate-500 mt-5">Resolution progress will appear when problems are reported.</p>}
          </div>
        </div>

        {/* Two Columns: Category Breakdown + District Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Categories Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Problems by Category</span>
              <span className="text-xs font-normal text-slate-400">AI-Classified</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Distribution of societal issues automatically routed to corresponding domain faculties.
            </p>

            <div className="space-y-3">
              {standardCategories.map((cat) => {
                const count = categoryMap[cat] || 0;
                const percentage = stats.totalProblems > 0 ? Math.min(100, Math.round((count / stats.totalProblems) * 100)) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{cat}</span>
                      <span className="font-bold text-slate-900">{count} issue{count === 1 ? '' : 's'}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, count > 0 ? 8 : 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Districts Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Jharkhand District Coverage</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                24 Districts
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Regional distribution of reported civic challenges across Jharkhand.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {jharkhandDistricts.map((district) => {
                const matchedCount = locationMap[district.toLowerCase()] || 0;
                return (
                  <div
                    key={district}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-700 font-medium truncate max-w-[140px]" title={district}>
                      {district}
                    </span>
                    <span className="font-semibold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                      {matchedCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Recently Solved Civic Challenges Showcase */}
        {stats.recentSolvedProblems && stats.recentSolvedProblems.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Recently Solved & Government-Verified Challenges
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real community impact engineered by university researchers and industrial partners.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                ✓ Verified Resolutions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentSolvedProblems.map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-bold text-emerald-800 uppercase">{p.category || 'General'}</span>
                    <span className="text-slate-500">📍 {p.district || 'Jharkhand'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1">{p.title}</h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    ✓ Verified Solved
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Portal CTA */}
        <div className="text-center py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            &larr; Return to Home Portal
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>SamadhanSetu &bull; Public Impact & Civic Accountability Dashboard &bull; Government of Jharkhand</p>
      </footer>
    </div>
  );
}

export default ImpactPage;
