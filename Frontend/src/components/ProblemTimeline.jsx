import React from 'react';

/**
 * ProblemTimeline Component
 * Displays the 8-stage lifecycle of a civic problem in the SamadhanSetu Closed Network:
 * 1. Submitted
 * 2. Under Review
 * 3. Approved
 * 4. Institution Assigned
 * 5. Work In Progress
 * 6. Solution Submitted
 * 7. Government Verified
 * 8. Solved (or Rejected)
 */
function ProblemTimeline({ status, timeline = [], detailed = false }) {
  const normalizedStatus = (status || 'pending').toLowerCase();

  // If problem is rejected, show a clear rejected state
  const isRejected = normalizedStatus === 'rejected';

  // Standard ordered lifecycle stages
  const stages = [
    { key: 'submitted', label: '1. Submitted', desc: 'Problem logged by citizen' },
    { key: 'under_review', label: '2. Under Review', desc: 'Administrative scrutiny' },
    { key: 'approved', label: '3. Approved', desc: 'Approved for matching' },
    { key: 'assigned', label: '4. Institution Assigned', desc: 'Verified partners assigned' },
    { key: 'in_progress', label: '5. Work In Progress', desc: 'Research & engineering active' },
    { key: 'solution_submitted', label: '6. Solution Submitted', desc: 'Awaiting government verification' },
    { key: 'government_verified', label: '7. Govt Verified', desc: 'Official evaluation passed' },
    { key: 'solved', label: '8. Solved', desc: 'Civic issue resolved' },
  ];

  // Determine stage index
  const statusToStageIndex = {
    pending: 0,
    under_review: 1,
    approved: 2,
    assigned: 3,
    in_progress: 4,
    solution_submitted: 5,
    solved: 7,
    rejected: -1,
  };

  const currentIndex = statusToStageIndex[normalizedStatus] !== undefined ? statusToStageIndex[normalizedStatus] : 0;

  // Find timeline events for metadata
  const findTimelineEvent = (stageKey) => {
    if (!timeline || !Array.isArray(timeline)) return null;
    return timeline
      .slice()
      .reverse()
      .find((t) => t.stage === stageKey || (stageKey === 'in_progress' && t.stage === 'work_started'));
  };

  if (isRejected) {
    const rejectionEvent = timeline?.find((t) => t.stage === 'rejected');
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">
            ✕
          </span>
          <span>Submission Status: Rejected</span>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          {rejectionEvent?.note || 'This problem report does not meet administrative verification criteria or guidelines.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-3">
      {/* Mobile Vertical / Desktop Horizontal Flow */}
      <div className="hidden lg:flex items-center justify-between relative">
        {/* Connecting line behind items */}
        <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 z-0"></div>
        <div
          className="absolute left-6 top-4 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, (currentIndex / (stages.length - 1)) * 100))}%`,
          }}
        ></div>

        {stages.map((stage, idx) => {
          const isDone = idx < currentIndex || (idx === 7 && normalizedStatus === 'solved');
          const isCurrent = idx === currentIndex && normalizedStatus !== 'solved';
          const event = findTimelineEvent(stage.key);

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center text-center max-w-[110px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  isDone
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>

              <span
                className={`text-[11px] font-bold mt-2 leading-tight ${
                  isDone
                    ? 'text-emerald-800'
                    : isCurrent
                    ? 'text-amber-800'
                    : 'text-slate-400'
                }`}
              >
                {stage.label.split('. ')[1]}
              </span>

              {detailed && event && (
                <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                  {new Date(event.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Accordion/Vertical Steps */}
      <div className="lg:hidden space-y-3">
        {stages.map((stage, idx) => {
          const isDone = idx < currentIndex || (idx === 7 && normalizedStatus === 'solved');
          const isCurrent = idx === currentIndex && normalizedStatus !== 'solved';
          const event = findTimelineEvent(stage.key);

          return (
            <div
              key={stage.key}
              className={`flex items-start gap-3 p-2.5 rounded-xl border ${
                isDone
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : isCurrent
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-white border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <div className="text-xs">
                <p className="font-bold">{stage.label}</p>
                <p className="text-[11px] text-slate-500">{stage.desc}</p>
                {event && detailed && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(event.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {event.note ? `— ${event.note}` : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProblemTimeline;
