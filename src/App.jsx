import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import data from './data/appearances.json';
import tourData from './data/schoolTour.json';

const mediaAppearances = data.appearances;

const getOutletBreakdown = () => {
  const counts = {};
  mediaAppearances.forEach(a => {
    const outlet = a.outlet.includes('Inforum') ? 'Inforum' :
                   a.outlet.includes('BEK') ? 'BEK TV' :
                   a.outlet.includes('Tribune') ? 'Bismarck Tribune' : a.outlet;
    counts[outlet] = (counts[outlet] || 0) + 1;
  });
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#6366F1', '#14B8A6'];
  return Object.entries(counts).map(([outlet, count], i) => ({ outlet, count, color: colors[i % colors.length] })).sort((a, b) => b.count - a.count);
};

const getTopicBreakdown = () => {
  const counts = {};
  mediaAppearances.forEach(a => {
    const topic = a.topic.includes('Appointment') ? 'Appointment' :
                  a.topic.includes('Tour') || a.topic.includes('First Day') ? 'Listening Tour' :
                  a.topic.includes('AI') ? 'AI & Innovation' :
                  a.topic.includes('Safety') ? 'School Safety' :
                  a.topic.includes('Dual') || a.topic.includes('Options') ? 'Education Options' : 'Education Policy';
    counts[topic] = (counts[topic] || 0) + 1;
  });
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  return Object.entries(counts).map(([topic, count], i) => ({ topic, count, color: colors[i % colors.length] })).sort((a, b) => b.count - a.count);
};

const getCumulativeData = () => {
  const sorted = [...mediaAppearances].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dateMap = {};
  let cumulative = 0;
  sorted.forEach(a => {
    const dateStr = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    cumulative++;
    dateMap[dateStr] = cumulative;
  });
  return Object.entries(dateMap).map(([date, appearances]) => ({ date, appearances }));
};

function SchoolTourMap() {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [showPulse, setShowPulse] = useState(true);
  const visitedNames = new Set(tourData.visits.map(v => v.district));
  const upcomingNames = new Set(tourData.upcoming.map(u => u.district));
  const lastVisit = tourData.visits[tourData.visits.length - 1];
  const progress = tourData.visits.length;
  const progressPercent = (progress / tourData.totalDistricts) * 100;

  const toSvg = (lat, lng) => {
    const minLat = 45.9, maxLat = 49.0, minLng = -104.1, maxLng = -96.5;
    return { x: ((lng - minLng) / (maxLng - minLng)) * 580 + 10, y: ((maxLat - lat) / (maxLat - minLat)) * 280 + 10 };
  };

  useEffect(() => {
    const interval = setInterval(() => setShowPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">167-School Listening Tour</h3>
          <p className="text-slate-400 text-sm">Track Levi's journey across North Dakota</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-cyan-400">{progress}<span className="text-slate-500 text-lg">/{tourData.totalDistricts}</span></div>
          <div className="text-slate-400 text-xs">districts visited</div>
        </div>
      </div>
      <div className="mb-6">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Started Dec 2025</span>
          <span>{progressPercent.toFixed(1)}% complete</span>
          <span>Goal: All 167</span>
        </div>
      </div>
      <div className="relative bg-slate-800/50 rounded-xl p-4 overflow-hidden">
        <svg viewBox="0 0 600 300" className="w-full h-auto">
          <path d="M10,10 L590,10 L590,290 L10,290 Z" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
          {[0,1,2,3,4].map(i => <line key={`h${i}`} x1="10" y1={10+i*70} x2="590" y2={10+i*70} stroke="#1e293b" strokeWidth="1" />)}
          {[0,1,2,3,4,5,6,7].map(i => <line key={`v${i}`} x1={10+i*82.8} y1="10" x2={10+i*82.8} y2="290" stroke="#1e293b" strokeWidth="1" />)}
          {tourData.allDistricts.map((district, i) => {
            const { x, y } = toSvg(district.lat, district.lng);
            const isVisited = visitedNames.has(district.name);
            const isUpcoming = upcomingNames.has(district.name);
            const isLast = district.name === lastVisit?.district;
            const isHovered = hoveredDistrict === district.name;
            return (
              <g key={i}>
                {isLast && showPulse && (
                  <circle cx={x} cy={y} r="20" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.5">
                    <animate attributeName="r" from="8" to="25" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={isLast ? 8 : isHovered ? 7 : 5}
                  fill={isVisited ? '#22c55e' : isUpcoming ? '#f59e0b' : '#475569'}
                  stroke={isLast ? '#22d3ee' : isVisited ? '#16a34a' : isUpcoming ? '#d97706' : '#334155'}
                  strokeWidth={isLast ? 3 : 1.5} className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict(district.name)} onMouseLeave={() => setHoveredDistrict(null)} />
                {(isHovered || isLast) && <text x={x} y={y-12} textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="bold">{district.name}</text>}
              </g>
            );
          })}
          {lastVisit && (() => { const {x,y} = toSvg(lastVisit.lat, lastVisit.lng); return <text x={x} y={y+4} textAnchor="middle" fontSize="16">🚗</text>; })()}
        </svg>
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" /><span className="text-slate-400">Visited ({progress})</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600" /><span className="text-slate-400">Upcoming ({tourData.upcoming.length})</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-600 border border-slate-500" /><span className="text-slate-400">Not Yet Scheduled</span></div>
          <div className="flex items-center gap-2"><span>🚗</span><span className="text-slate-400">Current Location</span></div>
        </div>
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Recent Visits</h4>
          <div className="space-y-2">
            {tourData.visits.slice(-4).reverse().map((visit, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{visit.district}</div>
                  <div className="text-xs text-slate-400">{new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {visit.students} students</div>
                </div>
                {visit.note && <div className="text-xs text-cyan-400" title={visit.note}>★</div>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Coming Up</h4>
          <div className="space-y-2">
            {tourData.upcoming.map((visit, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{visit.district}</div>
                  <div className="text-xs text-slate-400">{new Date(visit.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {visit.students.toLocaleString()} students</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedQuote, setSelectedQuote] = useState(0);
  const [daysInOffice, setDaysInOffice] = useState(0);
  const outletBreakdown = getOutletBreakdown();
  const topicBreakdown = getTopicBreakdown();
  const cumulativeData = getCumulativeData();

  useEffect(() => {
    const startDate = new Date(data.officeStartDate);
    const diffDays = Math.ceil(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24));
    setDaysInOffice(diffDays);
    const interval = setInterval(() => setSelectedQuote(prev => (prev + 1) % mediaAppearances.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1 text-blue-300 text-sm mb-4">North Dakota Department of Public Instruction</div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Levi Bachmeier</h1>
          <p className="text-xl text-slate-300">Superintendent of Public Instruction</p>
          <p className="text-slate-400 mt-1">Media & Tour Tracker</p>
          <p className="text-slate-500 text-xs mt-2">Last updated: {data.lastUpdated}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-4xl font-bold text-cyan-400">{daysInOffice}</div>
            <div className="text-slate-400 text-sm mt-1">Days in Office</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-4xl font-bold text-green-400">{mediaAppearances.length}</div>
            <div className="text-slate-400 text-sm mt-1">Media Appearances</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-4xl font-bold text-purple-400">{tourData.visits.length}<span className="text-lg text-slate-500">/167</span></div>
            <div className="text-slate-400 text-sm mt-1">Schools Visited</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-4xl font-bold text-amber-400">{(mediaAppearances.length / Math.max(daysInOffice / 7, 1)).toFixed(1)}</div>
            <div className="text-slate-400 text-sm mt-1">Appearances/Week</div>
          </div>
        </div>

        <SchoolTourMap />

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">"</div>
            <div className="flex-1">
              <p className="text-lg text-slate-200 italic mb-3">{mediaAppearances[selectedQuote].quote}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-400">{mediaAppearances[selectedQuote].outlet}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{formatDate(mediaAppearances[selectedQuote].date)}</span>
                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">{mediaAppearances[selectedQuote].topic}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {mediaAppearances.map((_, i) => (
              <button key={i} onClick={() => setSelectedQuote(i)} className={`w-2 h-2 rounded-full transition-all ${i === selectedQuote ? 'bg-blue-400 w-6' : 'bg-slate-600 hover:bg-slate-500'}`} />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Cumulative Media Appearances</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cumulativeData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="appearances" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Coverage by Outlet</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={outletBreakdown} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="outlet" type="category" stroke="#64748b" fontSize={10} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>{outletBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">Topics Covered</h3>
          <div className="flex flex-wrap gap-3">
            {topicBreakdown.map((topic, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }} />
                <span className="text-sm text-slate-300">{topic.topic}</span>
                <span className="text-sm font-semibold text-white">{topic.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6 text-slate-200">Media Appearance Timeline</h3>
          <div className="space-y-4">
            {mediaAppearances.map((appearance, i) => (
              <div key={appearance.id} className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-lg">{appearance.icon}</div>
                  {i < mediaAppearances.length - 1 && <div className="w-0.5 h-12 bg-gradient-to-b from-blue-500/50 to-transparent mt-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {appearance.url ? <a href={appearance.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cyan-300 transition-colors">{appearance.outlet} ↗</a> : <span className="font-semibold text-white">{appearance.outlet}</span>}
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{appearance.type}</span>
                  </div>
                  <div className="text-sm text-slate-400 mb-2">{formatDate(appearance.date)} • {appearance.topic}</div>
                  <p className="text-sm text-slate-300 italic">"{appearance.quote}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Tracking media presence since appointment on {new Date(data.appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="mt-1">Office start date: {new Date(data.officeStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
