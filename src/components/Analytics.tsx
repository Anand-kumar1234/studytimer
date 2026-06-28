/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { StudySession } from '../types';
import { formatHours } from '../utils';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Award, Calendar, Timer, BookOpen, Smile, Zap, BarChart3, HelpCircle } from 'lucide-react';

interface AnalyticsProps {
  sessions: StudySession[];
}

export default function Analytics({ sessions }: AnalyticsProps) {
  
  // 1. Process Core Statistics
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalHours: 0,
        averageMinutes: 0,
        longestMinutes: 0,
        productivityScore: 0,
        consistencyScore: 0,
        bestSubject: 'None',
        totalSessions: 0
      };
    }

    let totalSeconds = 0;
    let maxSeconds = 0;
    let totalProductivity = 0;
    const subjectsCount: Record<string, number> = {};
    const datesStudied = new Set<string>();

    sessions.forEach(s => {
      totalSeconds += s.actualTime;
      if (s.actualTime > maxSeconds) maxSeconds = s.actualTime;
      totalProductivity += s.productivityRating;
      subjectsCount[s.subject] = (subjectsCount[s.subject] || 0) + s.actualTime;
      datesStudied.add(s.date);
    });

    // Find best subject
    let bestSub = 'None';
    let maxSubTime = 0;
    Object.entries(subjectsCount).forEach(([sub, time]) => {
      if (time > maxSubTime) {
        maxSubTime = time;
        bestSub = sub;
      }
    });

    const totalHours = totalSeconds / 3600;
    const avgMin = (totalSeconds / 60) / sessions.length;
    const longestMin = maxSeconds / 60;
    const avgProductivityPercent = (totalProductivity / sessions.length) * 20; // convert 1-5 scale to percentage (out of 100)

    // Consistency score (fraction of days active in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let daysActiveIn30 = 0;
    datesStudied.forEach(d => {
      if (new Date(d) >= thirtyDaysAgo) daysActiveIn30++;
    });
    const consistency = Math.min(100, Math.round((daysActiveIn30 / 30) * 100));

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageMinutes: Math.round(avgMin),
      longestMinutes: Math.round(longestMin),
      productivityScore: Math.round(avgProductivityPercent),
      consistencyScore: consistency,
      bestSubject: bestSub,
      totalSessions: sessions.length
    };
  }, [sessions]);

  // 2. Weekly Daily Hours Chart Data (Last 7 Days)
  const last7DaysData = useMemo(() => {
    const data = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];

      // Filter sessions for this date
      const daySessions = sessions.filter(s => s.date === dateStr);
      const totalMin = daySessions.reduce((acc, s) => acc + (s.actualTime / 60), 0);

      data.push({
        name: dayName,
        Minutes: Math.round(totalMin),
        Hours: Math.round((totalMin / 60) * 10) / 10
      });
    }
    return data;
  }, [sessions]);

  // 3. Subject-wise breakdown Data
  const subjectBreakdownData = useMemo(() => {
    const subTime: Record<string, number> = {};
    sessions.forEach(s => {
      subTime[s.subject] = (subTime[s.subject] || 0) + (s.actualTime / 60);
    });

    return Object.entries(subTime).map(([subject, minutes]) => ({
      subject,
      Hours: Math.round((minutes / 60) * 10) / 10,
      Minutes: Math.round(minutes)
    })).sort((a, b) => b.Minutes - a.Minutes).slice(0, 5);
  }, [sessions]);

  // 4. Productivity Rating / Mood breakdown data
  const moodPieData = useMemo(() => {
    const moods: Record<string, number> = { focused: 0, tired: 0, stressed: 0, neutral: 0, energized: 0 };
    sessions.forEach(s => {
      if (moods[s.mood] !== undefined) {
        moods[s.mood]++;
      }
    });

    const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];
    return Object.entries(moods)
      .filter(([_, count]) => count > 0)
      .map(([mood, count], idx) => ({
        name: mood.charAt(0).toUpperCase() + mood.slice(1),
        value: count,
        color: COLORS[idx % COLORS.length]
      }));
  }, [sessions]);

  // 5. 12-Week Study Heatmap (Last 84 Days grid)
  const heatmapData = useMemo(() => {
    const grid = [];
    const today = new Date();
    // 12 weeks = 84 days.
    // Create an array representing each day
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr);
      const dayMinutes = daySessions.reduce((acc, s) => acc + (s.actualTime / 60), 0);

      grid.push({
        date: dateStr,
        minutes: Math.round(dayMinutes),
        dayOfWeek: d.getDay()
      });
    }
    return grid;
  }, [sessions]);

  // Group heatmap by day-of-week for easier column rendering (7 rows x 12 cols)
  const heatmapRows = useMemo(() => {
    const rows = Array.from({ length: 7 }, () => [] as any[]);
    heatmapData.forEach(day => {
      rows[day.dayOfWeek].push(day);
    });
    return rows;
  }, [heatmapData]);

  // Color mapper helper for study minutes
  const getIntensityColor = (mins: number) => {
    if (mins === 0) return 'bg-zinc-100 dark:bg-zinc-800';
    if (mins <= 25) return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 border border-emerald-200/40';
    if (mins <= 60) return 'bg-emerald-300 dark:bg-emerald-800 text-emerald-900';
    if (mins <= 120) return 'bg-emerald-500 dark:bg-emerald-600 text-white';
    return 'bg-emerald-700 dark:bg-emerald-400 text-white';
  };

  const dayLabelList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div id="analytics-panel" className="max-w-6xl mx-auto space-y-6">
      
      {/* Aggregate Score Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Total Studied</p>
            <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">{stats.totalHours} <span className="text-sm font-semibold">Hours</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Focus Score</p>
            <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">{stats.productivityScore}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Consistency</p>
            <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">{stats.consistencyScore}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Best Subject</p>
            <p className="text-lg font-black text-zinc-950 dark:text-zinc-50 truncate max-w-[120px]">{stats.bestSubject}</p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 dark:text-zinc-600 space-y-3 shadow-sm">
          <BarChart3 className="w-16 h-16 mx-auto stroke-[1.2]" />
          <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">No Analytics Available Yet</h3>
          <p className="text-xs max-w-md mx-auto">Complete timer focus sessions or log your study chapters manually to generate beautiful, interactive tracking charts!</p>
        </div>
      ) : (
        <>
          {/* Main Visual charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Daily Focus Hours (Last 7 days) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Study Minutes (Last 7 Days)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="Minutes" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Subject Time Breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" /> Subject balance (Hours Studied)
              </h3>
              {subjectBreakdownData.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No subject parameters found.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectBreakdownData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
                      <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="subject" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="Hours" fill="#10b981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500 animate-pulse" /> 12-Week Study Grid Heatmap
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                <span>Less</span>
                <div className="w-3.5 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="w-3.5 h-3.5 bg-emerald-100 dark:bg-emerald-950/40 rounded" />
                <div className="w-3.5 h-3.5 bg-emerald-300 dark:bg-emerald-800 rounded" />
                <div className="w-3.5 h-3.5 bg-emerald-500 dark:bg-emerald-600 rounded" />
                <div className="w-3.5 h-3.5 bg-emerald-700 dark:bg-emerald-400 rounded" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap calendar grid layout */}
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-[500px] select-none py-2">
                <div className="grid grid-rows-7 gap-1.5 text-[10px] font-bold text-zinc-400/80 pr-1 select-none">
                  {dayLabelList.map((lbl, idx) => (
                    <div key={idx} className="h-4 flex items-center justify-end pr-1 select-none">
                      {idx % 2 === 1 ? lbl : ''}
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5">
                  {heatmapRows.map((row, rowIdx) => (
                    row.map((day, colIdx) => (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className={`w-4 h-4 rounded transition-all cursor-pointer hover:scale-120 hover:ring-2 hover:ring-emerald-400 relative group ${getIntensityColor(day.minutes)}`}
                      >
                        {/* Interactive tooltip details on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 bg-zinc-950 text-white text-[9px] font-semibold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                          {day.minutes} min on {day.date}
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deep session history specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Smile className="w-4 h-4 text-yellow-500" /> Focus Mood Balance
              </h4>
              {moodPieData.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No moods logged.</p>
              ) : (
                <div className="space-y-3">
                  {moodPieData.map((item) => {
                    const pct = Math.round((item.value / sessions.length) * 100);
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <span>{item.name}</span>
                          <span>{pct}% ({item.value})</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick insights indicators */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" /> Efficiency Insights
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl space-y-1 bg-zinc-50/20">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Average Study Duration</p>
                  <p className="text-lg font-black text-zinc-950 dark:text-zinc-50">{stats.averageMinutes} Minutes</p>
                  <p className="text-[10px] text-zinc-400">Excellent Pomodoro pace.</p>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl space-y-1 bg-zinc-50/20">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Longest Deep Session</p>
                  <p className="text-lg font-black text-zinc-950 dark:text-zinc-50">{stats.longestMinutes} Minutes</p>
                  <p className="text-[10px] text-zinc-400">Maximum focus milestone.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
