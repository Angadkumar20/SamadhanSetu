import React from 'react';

const DISTRICT_POINTS = [
  { name: 'Garhwa', x: 72, y: 254 },
  { name: 'Palamu', x: 132, y: 209 },
  { name: 'Latehar', x: 193, y: 266 },
  { name: 'Chatra', x: 232, y: 145 },
  { name: 'Koderma', x: 306, y: 93 },
  { name: 'Hazaribagh', x: 307, y: 181 },
  { name: 'Lohardaga', x: 153, y: 345 },
  { name: 'Gumla', x: 110, y: 414 },
  { name: 'Simdega', x: 147, y: 484 },
  { name: 'Ranchi', x: 245, y: 350 },
  { name: 'Khunti', x: 254, y: 430 },
  { name: 'Ramgarh', x: 347, y: 260 },
  { name: 'Giridih', x: 407, y: 157 },
  { name: 'Deoghar', x: 493, y: 183 },
  { name: 'Dumka', x: 494, y: 278 },
  { name: 'Jamtara', x: 566, y: 264 },
  { name: 'Dhanbad', x: 455, y: 238 },
  { name: 'Bokaro', x: 394, y: 304 },
  { name: 'Seraikela-Kharsawan', x: 343, y: 409 },
  { name: 'East Singhbhum', x: 452, y: 447 },
  { name: 'West Singhbhum', x: 294, y: 478 },
  { name: 'Godda', x: 553, y: 132 },
  { name: 'Sahibganj', x: 570, y: 67 },
];

const getWorkloadColor = (unresolved, maximum) => {
  if (!unresolved) return '#e2e8f0';
  const ratio = maximum > 0 ? unresolved / maximum : 0;
  if (ratio >= 0.66) return '#dc2626';
  if (ratio >= 0.33) return '#f59e0b';
  return '#84cc16';
};

function DistrictMap({ districtStats, selectedDistrict, onSelect }) {
  const maximum = Math.max(...DISTRICT_POINTS.map(({ name }) => districtStats[name]?.unresolved || 0), 1);

  return (
    <div className="district-map-wrap">
      <div className="district-map-legend" aria-label="District workload legend">
        <span><i className="district-legend-dot district-legend-dot--high" /> High unresolved</span>
        <span><i className="district-legend-dot district-legend-dot--medium" /> Medium</span>
        <span><i className="district-legend-dot district-legend--low" /> Low or none</span>
        <span><i className="district-legend-dot district-legend-dot--solved" /> Solved-heavy</span>
      </div>
      <svg className="district-map" viewBox="0 0 640 540" role="img" aria-label="Interactive schematic map of Jharkhand districts">
        <path
          className="district-map__outline"
          d="M72 226 115 164 184 133 211 78 302 44 390 72 447 39 531 62 599 119 578 207 601 281 558 340 540 430 472 484 390 516 296 520 219 503 134 515 83 454 91 373 43 306Z"
        />
        {DISTRICT_POINTS.map((district) => {
          const stats = districtStats[district.name] || { total: 0, unresolved: 0, solved: 0, high: 0 };
          const isSelected = selectedDistrict === district.name;
          const solvedHeavy = stats.total > 0 && stats.solved > stats.unresolved;
          return (
            <g
              key={district.name}
              className="district-map__point"
              role="button"
              tabIndex="0"
              aria-label={`${district.name}: ${stats.unresolved} unresolved problems`}
              onClick={() => onSelect(district.name)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelect(district.name);
              }}
            >
              <circle
                cx={district.x}
                cy={district.y}
                r={isSelected ? 17 : 13}
                fill={getWorkloadColor(stats.unresolved, maximum)}
                stroke={isSelected ? '#0f172a' : solvedHeavy ? '#059669' : '#ffffff'}
                strokeWidth={isSelected ? 4 : 3}
              />
              <text x={district.x} y={district.y + 4} textAnchor="middle" className="district-map__count">
                {stats.unresolved}
              </text>
              <text x={district.x} y={district.y + 29} textAnchor="middle" className="district-map__label">
                {district.name === 'Seraikela-Kharsawan' ? 'Seraikela' : district.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="district-map__hint">Select a district marker to inspect its actual problem workload.</p>
    </div>
  );
}

export { DISTRICT_POINTS };
export default DistrictMap;
