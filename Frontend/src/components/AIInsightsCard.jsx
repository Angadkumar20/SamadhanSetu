import React from 'react';

function AIInsightsCard({ insights, category }) {
  const data = insights || {};
  const priority = data.priority || 'medium';
  const priorityStyles = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <section className="ai-insights-card" aria-labelledby="ai-insights-title">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">AI-Powered Insights</p>
          <h3 id="ai-insights-title" className="text-base font-extrabold text-slate-900 mt-1">A clearer view for faster action</h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 rounded-full px-2 py-1">Assisted triage</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="ai-insights-card__item">
          <span className="ai-insights-card__label">Category</span>
          <strong>{data.category || category || 'Not available'}</strong>
        </div>
        <div className="ai-insights-card__item">
          <span className="ai-insights-card__label">Priority</span>
          <span className={`inline-flex w-fit px-2 py-1 rounded-full border font-bold uppercase tracking-wide ${priorityStyles[priority] || priorityStyles.medium}`}>
            {priority}
          </span>
        </div>
        <div className="ai-insights-card__item sm:col-span-2">
          <span className="ai-insights-card__label">AI Summary</span>
          <p className="text-slate-700 leading-relaxed">{data.summary || 'AI summary not available.'}</p>
        </div>
        <div className="ai-insights-card__item sm:col-span-2">
          <span className="ai-insights-card__label">Suggested Department / Solution Area</span>
          <strong className="text-slate-800">{data.suggestedDepartment || 'Relevant Government Department'}</strong>
        </div>
      </div>
    </section>
  );
}

export default AIInsightsCard;