import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * StatusBadge Component
 * Renders a color-coded status badge for problems:
 * - pending: Amber/Yellow (Awaiting review)
 * - assigned: Sky Blue (Assigned to a university)
 * - in_progress: Indigo/Cyan (Active collaboration/research)
 * - solved: Emerald Green (Resolved)
 */
function StatusBadge({ status }) {
  const { t } = useTranslation();
  const normalizedStatus = (status || 'pending').toLowerCase();

  const statusConfig = {
    pending: {
      label: 'Pending',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    under_review: {
      label: 'Under Review',
      classes: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
    },
    approved: {
      label: 'Approved',
      classes: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
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
    solution_submitted: {
      label: 'Solution Submitted',
      classes: 'bg-violet-50 text-violet-700 border-violet-200',
      dot: 'bg-violet-500',
    },
    solved: {
      label: 'Solved',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    rejected: {
      label: 'Rejected',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const current = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${current.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {t(`status.${normalizedStatus}`, current.label)}
    </span>
  );
}

export default StatusBadge;
