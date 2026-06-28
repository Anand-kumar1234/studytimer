/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudySession } from '../types';
import { BookOpen, Calendar, Clock, Smile, Award, Check, AlertCircle } from 'lucide-react';

interface ManualTimerProps {
  onSaveSession: (session: StudySession) => void;
  recentSubjects: string[];
}

export default function ManualTimer({ onSaveSession, recentSubjects }: ManualTimerProps) {
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('45'); // default target duration in minutes
  const [actualTimeMin, setActualTimeMin] = useState('45'); // actual minutes studied
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:45');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<'focused' | 'tired' | 'stressed' | 'neutral' | 'energized'>('focused');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [productivityRating, setProductivityRating] = useState(4);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !chapter || !topic) return;

    const actualSeconds = parseFloat(actualTimeMin) * 60;
    const session: StudySession = {
      subject,
      chapter,
      topic,
      duration: parseFloat(duration),
      actualTime: actualSeconds,
      date,
      startTime,
      endTime,
      sessionType: 'manual',
      notes,
      mood,
      difficulty,
      productivityRating
    };

    onSaveSession(session);
    setSaved(true);
    
    // Reset form partially
    setChapter('');
    setTopic('');
    setNotes('');
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div id="manual-timer-panel" className="max-w-3xl mx-auto bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Log Session Manually</h2>
          <p className="text-sm text-slate-400">Add an offline study session to your statistics history.</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-semibold animate-pulse">
          <Check className="w-5 h-5" /> Session logged successfully! XP and stats updated.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Subject and Chapter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Physics" 
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
            {recentSubjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {recentSubjects.slice(0, 4).map((sub) => (
                  <button 
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter Name</label>
            <input 
              type="text" 
              value={chapter} 
              onChange={e => setChapter(e.target.value)}
              placeholder="e.g. Current Electricity" 
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Topic</label>
            <input 
              type="text" 
              value={topic} 
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Kirchhoff's Law" 
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
          </div>
        </div>

        {/* Row 2: Date, start and end times */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actual Time (Min)</label>
            <input 
              type="number" 
              value={actualTimeMin} 
              onChange={e => {
                setActualTimeMin(e.target.value);
                setDuration(e.target.value); // Sync target with actual by default
              }}
              min="1"
              max="600"
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
          </div>
        </div>

        {/* Row 3: Mood, Difficulty, Productivity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-white/5 py-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-indigo-400" /> Study Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {(['focused', 'tired', 'neutral', 'energized', 'stressed'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer capitalize ${
                    mood === m 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25' 
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" /> Difficulty
            </label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer capitalize ${
                    difficulty === d 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25' 
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Productivity rating
            </label>
            <div className="flex items-center gap-1.5 h-[34px]">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setProductivityRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                >
                  <svg 
                    className={`w-6 h-6 ${star <= productivityRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.25.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 10.11c-.773-.56-.374-1.81.588-1.81h4.908a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              ))}
              <span className="text-xs font-bold text-slate-400 ml-2">({productivityRating}/5)</span>
            </div>
          </div>
        </div>

        {/* Notes input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Notes / Key Learnings</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What formulas did you practice? What chapters did you outline? Write brief summaries or reminders..."
            className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white focus:outline-none"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer text-sm"
        >
          Add Session to History
        </button>
      </form>
    </div>
  );
}
