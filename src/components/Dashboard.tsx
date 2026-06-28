/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StudySession, PlannerTask, UserProfile } from '../types';
import { formatHours } from '../utils';
import { 
  Flame, Award, Calendar, CheckSquare, Clock, Trophy, 
  ArrowRight, BookOpen, Trash2, Smile, Zap, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

interface DashboardProps {
  sessions: StudySession[];
  tasks: PlannerTask[];
  userProfile: UserProfile | null;
  onDeleteSession: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ sessions, tasks, userProfile, onDeleteSession, onNavigateToTab }: DashboardProps) {
  // Calendar date filter
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // 1. Calculations: Today's Time, Weekly Time, Monthly Time, Total Time
  const calculations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Start of week (Sunday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // Start of month
    const startOfMonthStr = new Date().toISOString().substring(0, 7) + "-01";

    let todaySeconds = 0;
    let weekSeconds = 0;
    let monthSeconds = 0;
    let totalSeconds = 0;

    sessions.forEach(s => {
      totalSeconds += s.actualTime;
      if (s.date === todayStr) {
        todaySeconds += s.actualTime;
      }
      if (s.date >= startOfWeekStr) {
        weekSeconds += s.actualTime;
      }
      if (s.date >= startOfMonthStr) {
        monthSeconds += s.actualTime;
      }
    });

    return {
      todayHours: todaySeconds / 3600,
      weekHours: weekSeconds / 3600,
      monthHours: monthSeconds / 3600,
      totalHours: totalSeconds / 3600
    };
  }, [sessions]);

  // 2. Upcoming Tasks agenda (filter next 3 incomplete tasks)
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [tasks]);

  // 3. Calendar Grid Calculations (Generate dates in current month)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = lastDay.getDate();

    const dayCells = [];
    
    // Padding preceding month
    for (let i = 0; i < startOffset; i++) {
      dayCells.push(null);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const dateStr = cellDate.toISOString().split('T')[0];
      
      // Calculate how many minutes were studied on this date
      const daySessions = sessions.filter(s => s.date === dateStr);
      const dayMinutes = daySessions.reduce((acc, s) => acc + (s.actualTime / 60), 0);

      dayCells.push({
        day,
        dateStr,
        minutes: Math.round(dayMinutes)
      });
    }

    return dayCells;
  }, [currentMonth, sessions]);

  // Next and Previous Month toggles
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Selected date session filter
  const selectedDaySessions = useMemo(() => {
    return sessions.filter(s => s.date === selectedCalendarDate);
  }, [sessions, selectedCalendarDate]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div id="dashboard-panel" className="max-w-6xl mx-auto space-y-6">
      
      {/* XP Level Rewards Header Banner */}
      {userProfile && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={userProfile.avatarUrl} 
              alt="Profile avatar" 
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Welcome back, {userProfile.name}! <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400">Level {userProfile.level} Scholar • Study streak is active</p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="w-full md:w-1/3 space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Next Level XP</span>
              <span>{userProfile.xp} / {userProfile.level * 500} XP</span>
            </div>
            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50" 
                style={{ width: `${Math.min(100, (userProfile.xp / (userProfile.level * 500)) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Statistics Row Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Focus</span>
          <p className="text-2xl font-black text-white">{formatHours(calculations.todayHours)}</p>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
              style={{ width: `${Math.min(100, (calculations.todayHours / (userProfile?.targetDailyHours || 2)) * 100)}%` }} 
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Study</span>
          <p className="text-2xl font-black text-white">{formatHours(calculations.weekHours)}</p>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Completed this week
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Streak</span>
          <p className="text-2xl font-black text-white flex items-center gap-1.5">
            {userProfile?.currentStreak || 0} <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          </p>
          <span className="text-[10px] text-slate-400">Longest: {userProfile?.longestStreak || 0} days</span>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Time</span>
          <p className="text-2xl font-black text-white">{formatHours(calculations.totalHours)}</p>
          <span className="text-[10px] text-indigo-400 font-bold">🏆 Global lifetime score</span>
        </div>
      </div>

      {/* Two Columns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col Left: 2/3 - Interactive Calendar & Selected sessions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Calendar Widget Card */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" /> Study Calendar Tracker
              </h3>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1.5 rounded-lg border border-white/5 text-slate-400 hover:text-white cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-200">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1.5 rounded-lg border border-white/5 text-slate-400 hover:text-white cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Grid header label */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Calendar Days Cells representation */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;
                
                const isSelected = selectedCalendarDate === cell.dateStr;
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
                
                // Color intensity indicator matching AuraFocus frosted theme
                let bgColor = 'bg-white/5 text-slate-300 hover:bg-white/10';
                if (cell.minutes > 0) {
                  bgColor = cell.minutes <= 30 
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' 
                    : 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20';
                }

                return (
                  <button
                    key={`day-${cell.day}`}
                    onClick={() => setSelectedCalendarDate(cell.dateStr)}
                    className={`aspect-square rounded-xl p-1.5 flex flex-col justify-between items-center relative cursor-pointer border transition-all ${bgColor} ${
                      isSelected 
                        ? 'ring-2 ring-indigo-400 scale-105 border-transparent' 
                        : isToday 
                          ? 'border-indigo-400' 
                          : 'border-transparent'
                    }`}
                  >
                    <span className="text-xs font-semibold">{cell.day}</span>
                    {cell.minutes > 0 && !isSelected && (
                      <span className={`w-1.5 h-1.5 rounded-full ${cell.minutes > 30 ? 'bg-white' : 'bg-indigo-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sessions logged on the selected date */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sessions on {selectedCalendarDate}
            </h4>

            {selectedDaySessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No study sessions recorded on this day.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {selectedDaySessions.map(session => (
                  <div key={session.id} className="py-3 flex justify-between items-center group">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">
                        {session.subject} — <span className="text-xs font-medium text-slate-400">{session.chapter}</span>
                      </p>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <Clock className="w-3.5 h-3.5" /> {session.startTime} - {session.endTime} ({Math.round(session.actualTime / 60)} min)
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-indigo-300">
                          {session.difficulty}
                        </span>
                      </div>
                      {session.notes && <p className="text-xs italic text-slate-400">"{session.notes}"</p>}
                    </div>

                    <button
                      onClick={() => onDeleteSession(session.id!)}
                      className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                      title="Delete logged session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Col Right: 1/3 - Goal milestones, Streaks & Planner alerts */}
        <div className="space-y-6">
          {/* Upcoming Planner list */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Agenda</h3>
              <button 
                onClick={() => onNavigateToTab('planner')}
                className="text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Go to Planner <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 space-y-1">
                <CheckSquare className="w-8 h-8 mx-auto stroke-[1.2]" />
                <p className="text-xs">All objectives completed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="p-3 border border-white/5 rounded-xl bg-white/5 space-y-1">
                    <p className="text-xs font-bold text-white truncate">{task.title}</p>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>{task.subject}</span>
                      <span>Due {task.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Study launch cards */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-xl space-y-3.5 border border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block">Deep Work Sandboxing</span>
              <h4 className="text-base font-bold tracking-tight">Ready to focus?</h4>
              <p className="text-xs text-indigo-100/90">Fire up the interactive digital stopwatch block now.</p>
            </div>

            <button 
              onClick={() => onNavigateToTab('timer')}
              className="w-full bg-white text-indigo-600 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 hover:scale-[1.02] transition-transform cursor-pointer shadow-md"
            >
              Launch Timer Block
            </button>
          </div>

          {/* Ambient Sound feature alert */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-5 rounded-[24px] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              💡 Study Tip
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesized "Heavy Rain" audio waves can improve focus by filtering out surrounding ambient conversation noises. Try our Focus Soundboards inside the Live Timer!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
