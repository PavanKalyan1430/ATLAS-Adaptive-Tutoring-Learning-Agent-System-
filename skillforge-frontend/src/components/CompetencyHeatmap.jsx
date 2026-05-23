import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function CompetencyHeatmap({ competencyVector }) {
  // Convert {topic: score} to Array for Recharts
  const data = Object.entries(competencyVector).map(([topic, score]) => ({
    name: topic.replace('_', ' ').toUpperCase(),
    score: score * 100, // percentage representation
    rawScore: score
  }));

  const getBarColor = (score) => {
    if (score >= 75) return '#10b981'; // Green for Mastered
    if (score >= 45) return '#6366f1'; // Indigo for Proficient
    return '#f43f5e'; // Rose for Struggling
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="glass px-4 py-3 rounded-xl border border-slate-700/80 text-xs shadow-xl text-left">
          <p className="font-bold text-slate-100 mb-1">{dataPoint.name}</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: getBarColor(dataPoint.score) }}
            />
            <span className="text-slate-350">Mastery Level:</span>
            <span className="text-slate-100 font-extrabold">{dataPoint.score.toFixed(0)}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-1.5 uppercase">
            {dataPoint.score >= 75 ? '✓ MASTERED' : dataPoint.score >= 45 ? '⚡ IN PROGRESS' : '⚠️ GAPS DETECTED'}
          </span>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm font-semibold p-6">
        Heatmap loading post diagnostic...
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full mt-4 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            unit="%"
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 700 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
          <Bar 
            dataKey="score" 
            radius={[0, 8, 8, 0]} 
            barSize={14}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.score)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
