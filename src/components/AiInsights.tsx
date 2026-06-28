/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudySession } from '../types';
import { 
  Brain, Sparkles, Calendar, Zap, Lightbulb, BookOpen, 
  HelpCircle, ArrowRight, Hourglass, CheckSquare, Target
} from 'lucide-react';

interface AiInsightsProps {
  sessions: StudySession[];
  recentSubjects: string[];
}

export default function AiInsights({ sessions, recentSubjects }: AiInsightsProps) {
  // AI Suggestions State
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // AI Timetable State
  const [planner, setPlanner] = useState<any>(null);
  const [loadingPlanner, setLoadingPlanner] = useState(false);
  
  // Planner form inputs
  const [subjectsStr, setSubjectsStr] = useState('');
  const [dailyHours, setDailyHours] = useState('3');
  const [targetDays, setTargetDays] = useState('7');
  const [difficulty, setDifficulty] = useState('medium');

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: sessions })
      });
      const data = await response.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
      alert('Could not connect to the AI analyzer server.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchPlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectsStr.trim()) {
      alert('Please enter at least one subject.');
      return;
    }
    
    setLoadingPlanner(true);
    const subjectsList = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/ai/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subjects: subjectsList, 
          dailyHours: parseFloat(dailyHours),
          targetDays: parseInt(targetDays),
          difficulty
        })
      });
      const data = await response.json();
      setPlanner(data);
    } catch (e) {
      console.error(e);
      alert('Could not connect to the AI planner server.');
    } finally {
      setLoadingPlanner(false);
    }
  };

  return (
    <div id="ai-insights-panel" className="max-w-5xl mx-auto space-y-8">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-500/20 via-slate-900/60 to-emerald-500/20 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-56 h-56 text-white animate-pulse" />
        </div>
        <div className="max-w-xl space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Gemini Study Assistant
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Empower Your Learning with Artificial Intelligence</h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">Get customized schedules, habit tracking recommendations, and optimal study blocks designed uniquely for your topics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Col Left: AI Suggestions based on logged history */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-6 rounded-[24px] shadow-2xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400 animate-pulse" /> Performance Analysis
            </h3>
            <p className="text-xs text-slate-400">Gemini analyzes your logged subjects, ratings, and difficulty states to offer custom feedback.</p>
          </div>

          <button
            onClick={fetchSuggestions}
            disabled={loadingSuggestions}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/40 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/15 transition-all"
          >
            {loadingSuggestions ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lightbulb className="w-4 h-4" /> Generate Productivity Insights
              </>
            )}
          </button>

          {suggestions && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Habit Score</span>
                <span className="text-lg font-black text-emerald-400">{suggestions.score}/100</span>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${suggestions.score}%` }} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Personalized Highlights</span>
                <ul className="space-y-2">
                  {suggestions.insights?.map((ins: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-300 leading-relaxed pl-4 border-l-2 border-emerald-400">
                      {ins}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Smart Practice Tips</span>
                <ul className="space-y-2">
                  {suggestions.tips?.map((tip: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      🎯 {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Col Right: AI Timetable & Study Scheduler Generator */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-6 rounded-[24px] shadow-2xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" /> AI Study Timetable Generator
            </h3>
            <p className="text-xs text-slate-400">Input your ongoing modules to generate a complete balanced day-by-day schedule.</p>
          </div>

          <form onSubmit={fetchPlanner} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Active Subjects (comma separated)</label>
              <input
                type="text"
                placeholder="Physics, Chemistry, Algebra"
                value={subjectsStr}
                onChange={e => setSubjectsStr(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 text-white px-3.5 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hours/Day</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={e => setDailyHours(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days Target</label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={targetDays}
                  onChange={e => setTargetDays(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white px-2 py-1.5 rounded-xl text-xs focus:outline-none [&>option]:bg-zinc-900"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingPlanner}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 transition-all"
            >
              {loadingPlanner ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Build Custom Timetable
                </>
              )}
            </button>
          </form>

          {/* Render parsed planner schedule */}
          {planner && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-4 max-h-96 overflow-y-auto pr-1 animate-fade-in">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">AI Break Strategy</span>
                <p className="text-xs text-slate-300 leading-relaxed">{planner.breakRecommendation}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Suggested Schedule Outline</span>
                {planner.schedule?.map((day: any, dIdx: number) => (
                  <div key={dIdx} className="border border-white/5 p-3.5 rounded-xl bg-white/5 space-y-2">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      📅 {day.day}
                    </span>
                    <div className="space-y-2">
                      {day.sessions?.map((sess: any, sIdx: number) => (
                        <div key={sIdx} className="text-xs space-y-1 pl-3.5 border-l-2 border-indigo-500">
                          <p className="font-bold text-white">
                            {sess.subject} — <span className="text-indigo-400">{sess.duration} ({sess.type})</span>
                          </p>
                          <p className="text-slate-400 text-[10px]">{sess.topic}</p>
                          <p className="text-indigo-300/80 italic text-[10px]">Tip: {sess.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
