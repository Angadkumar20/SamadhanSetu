import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

/**
 * InstitutionManagement Component
 * Route: "/admin/institutions"
 * Closed Verified Network Management:
 * Government Admin verifies or rejects universities and industry partners
 * before they can view or receive problem assignments.
 */
function InstitutionManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [institutions, setInstitutions] = useState([]);
  const [counts, setCounts] = useState({
    totalUniversities: 0,
    totalIndustries: 0,
    verifiedCount: 0,
    pendingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate('/login/admin');
      return;
    }
    fetchInstitutions();
  }, [roleFilter, statusFilter, token, role]);

  // Auto-dismiss temporary success messages after 4 seconds
  useEffect(() => {
    if (feedback.message && feedback.type === 'success') {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchInstitutions = async () => {
    setIsLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/admin/institutions?${params.toString()}`);
      setInstitutions(res.data.institutions || []);
      if (res.data.counts) setCounts(res.data.counts);
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load institutions catalog.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    setProcessingId(id);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.put(`/admin/institutions/${id}/verify`, {
        status,
        isActive: status === 'Verified',
      });
      setFeedback({
        type: 'success',
        message: res.data.message || `Institution marked as ${status}`,
      });
      fetchInstitutions();
    } catch (err) {
      console.error('Verification update failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not update verification status.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="admin" onRefresh={fetchInstitutions} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Link to="/admin/dashboard" className="hover:text-slate-900 font-semibold">
                Admin Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Institution Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verified Institution Management
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Enforce Jharkhand's Closed Verified Network. Validate universities and corporate R&D teams before granting problem access.
            </p>
          </div>

          <button
            onClick={fetchInstitutions}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            Refresh Catalog
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
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Universities</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{counts.totalUniversities}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Industry Partners</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{counts.totalIndustries}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Verified & Active</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{counts.verifiedCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Verification</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{counts.pendingCount}</p>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase mr-1">Role:</span>
              {['all', 'university', 'industry'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    roleFilter === r
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase mr-1">Status:</span>
              {['all', 'Pending Verification', 'Verified', 'Rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    statusFilter === s
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-16 text-center">
              <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Loading institutional partners...</p>
            </div>
          ) : institutions.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-bold text-slate-700">No institutions match the filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Institution / Name</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Affiliation</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {institutions.map((inst) => {
                    const isBusy = processingId === inst._id;
                    const isVerified = inst.isVerified || inst.verificationStatus === 'Verified';
                    const isRejected = inst.verificationStatus === 'Rejected';

                    return (
                      <tr key={inst._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {inst.name}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                              inst.role === 'university'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}
                          >
                            {inst.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">
                          {inst.organization || 'Unspecified'}
                        </td>
                        <td className="p-3.5">
                          <span className="block text-slate-900">{inst.email}</span>
                          {inst.phone && <span className="text-slate-400 text-[11px]">{inst.phone}</span>}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isVerified
                                  ? 'bg-emerald-600'
                                  : isRejected
                                  ? 'bg-rose-600'
                                  : 'bg-amber-500'
                              }`}
                            ></span>
                            {inst.verificationStatus || 'Pending Verification'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {!isVerified && (
                              <button
                                onClick={() => handleVerify(inst._id, 'Verified')}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                              >
                                {isBusy ? '...' : 'Verify ✓'}
                              </button>
                            )}
                            {!isRejected && (
                              <button
                                onClick={() => handleVerify(inst._id, 'Rejected')}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors disabled:opacity-50"
                              >
                                {isBusy ? '...' : 'Reject ✕'}
                              </button>
                            )}
                            {isVerified && (
                              <span className="text-[11px] text-emerald-700 font-bold">
                                ✓ Verified Partner
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default InstitutionManagement;
