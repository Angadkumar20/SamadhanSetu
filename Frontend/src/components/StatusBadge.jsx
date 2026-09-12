import React from 'react';

/**
 * StatusBadge Component
 * Renders a color-coded status badge for problems:
 * - pending: Amber/Yellow (Awaiting review)
 * - assigned: Sky Blue (Assigned to a university)
 * - in_progress: Indigo/Cyan (Active collaboration/research)
 * - solved: Emerald Green (Resolved)
 */
function StatusBadge({ status }) {
  const normalizedStatus = (status || 'pending').toLowerCase();

  const statusConfig = {
    pending: {
      label: 'Pending',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    assigned: {
      label: 'Assigned',
      classes: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    solved: {
      label: 'Solved',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
  };

  const current = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${current.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}

export default StatusBadge;
