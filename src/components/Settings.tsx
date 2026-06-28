/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudySettings, StudySession } from '../types';
import { playAlarmSound } from '../utils';
import { 
  Settings as SettingsIcon, Volume2, Bell, FileDown, 
  Trash2, RefreshCw, Moon, Sun, Check, Clock, Calendar,
  Sparkles, TreePine, Sunset, Zap
} from 'lucide-react';

interface SettingsProps {
  settings: StudySettings;
  setSettings: React.Dispatch<React.SetStateAction<StudySettings>>;
  sessions: StudySession[];
  onClearData: () => void;
}

export default function Settings({ settings, setSettings, sessions, onClearData }: SettingsProps) {
  const [copied, setCopied] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const handleTestSound = () => {
    playAlarmSound(settings.alarmSound, settings.alarmVolume / 100);
  };

  const handleExportCSV = () => {
    if (sessions.length === 0) {
      alert("No sessions logged yet to export.");
      return;
    }

    const headers = ["ID", "Subject", "Chapter", "Topic", "Target Duration (Min)", "Actual Duration (Sec)", "Date", "Start Time", "End Time", "Type", "Notes", "Difficulty", "Mood", "Rating"];
    const rows = sessions.map(s => [
      s.id || 'N/A',
      s.subject,
      s.chapter,
      s.topic,
      s.duration,
      s.actualTime,
      s.date,
      s.startTime,
      s.endTime,
      s.sessionType,
      `"${s.notes.replace(/"/g, '""')}"`,
      s.difficulty,
      s.mood,
      s.productivityRating
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="settings-panel" className="max-w-2xl mx-auto bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-2xl space-y-6">
      
      {/* Header section */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="p-2.5 rounded-xl bg-white/5 text-slate-300">
          <SettingsIcon className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-sans tracking-tight">App Configuration</h2>
          <p className="text-sm text-slate-400">Personalize alarms, themes, and backup your statistics logs.</p>
        </div>
      </div>

      <div className="space-y-6 divide-y divide-white/5">
        
        {/* Row 1: Themes & Styling */}
        <div className="py-4 first:pt-0 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> Style Customization
            </h4>
            <p className="text-xs text-slate-400">Choose an immersive color space to set the perfect visual focus for your sessions.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {/* Cosmic Dark */}
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, theme: 'dark' });
                document.documentElement.classList.add('dark');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2.5 font-bold text-[10px] cursor-pointer transition-all ${
                settings.theme === 'dark' 
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-900/20' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <span className="tracking-wide text-center">Cosmic Dark</span>
            </button>

            {/* Aura Light */}
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, theme: 'light' });
                document.documentElement.classList.remove('dark');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2.5 font-bold text-[10px] cursor-pointer transition-all ${
                settings.theme === 'light' 
                  ? 'bg-zinc-800/15 text-zinc-800 border-zinc-800/20 shadow-md' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <span className="tracking-wide text-center">Aura Light</span>
            </button>

            {/* Forest Zen */}
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, theme: 'emerald' });
                document.documentElement.classList.add('dark');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2.5 font-bold text-[10px] cursor-pointer transition-all ${
                settings.theme === 'emerald' 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-900/20' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TreePine className="w-5 h-5" />
              </div>
              <span className="tracking-wide text-center">Forest Zen</span>
            </button>

            {/* Sunset Horizon */}
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, theme: 'amber' });
                document.documentElement.classList.add('dark');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2.5 font-bold text-[10px] cursor-pointer transition-all ${
                settings.theme === 'amber' 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-900/20' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <Sunset className="w-5 h-5" />
              </div>
              <span className="tracking-wide text-center">Sunset Glow</span>
            </button>

            {/* Neon Matrix */}
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, theme: 'cyberpunk' });
                document.documentElement.classList.add('dark');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2.5 font-bold text-[10px] cursor-pointer transition-all ${
                settings.theme === 'cyberpunk' 
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-900/20' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <span className="tracking-wide text-center">Neon Matrix</span>
            </button>
          </div>
        </div>

        {/* Row 2: Alarms and sounds */}
        <div className="py-4 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" /> Alarm Bell Options
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alarm Audio Style</label>
              <select
                value={settings.alarmSound}
                onChange={e => setSettings({ ...settings, alarmSound: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="digital">🚨 Digital Retro Double Beep</option>
                <option value="bell">🔔 Crystal Healing Temple Bell</option>
                <option value="analog">⏰ Classic Ringing Alarm</option>
                <option value="forest_bird">🐦 Mystic Chirping Birds</option>
                <option value="gentle_piano">🎹 Soft Arpeggio Piano Chord</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Alarm Volume</span>
                <span>{settings.alarmVolume}%</span>
              </label>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.alarmVolume}
                  onChange={e => setSettings({ ...settings, alarmVolume: parseInt(e.target.value) })}
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleTestSound}
            className="px-4 py-2 text-xs font-semibold bg-emerald-500/10 text-emerald-300 rounded-xl hover:bg-emerald-500/20 transition-all cursor-pointer border border-emerald-500/20"
          >
            🔊 Test Alarm Tone
          </button>
        </div>

        {/* Row 3: Display configs */}
        <div className="py-4 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Time and Formats
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Format</label>
              <select
                value={settings.timeFormat}
                onChange={e => setSettings({ ...settings, timeFormat: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="12h">12-Hour (AM/PM)</option>
                <option value="24h">24-Hour (Military)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={e => setSettings({ ...settings, dateFormat: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 4: Data management */}
        <div className="py-4 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileDown className="w-4 h-4 text-indigo-400" /> Data Export & Backup
          </h4>
          <p className="text-xs text-slate-400">Keep standard local spreadsheet backups for school portfolios or homework reports.</p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
            >
              <FileDown className="w-4 h-4" /> Export History (CSV)
            </button>
            
            <button
              onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2.5 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" /> 
              {copied ? 'Success' : 'Cloud Sync Backup'}
            </button>
          </div>
        </div>

        {/* Row 5: Dangerous Zone */}
        <div className="py-4 pt-6 space-y-4">
          <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone
          </h4>
          
          <div className="border border-red-500/10 p-4 rounded-xl flex items-center justify-between gap-4 bg-red-500/5">
            <div className="space-y-1 flex-1 pr-2">
              <p className="text-xs font-bold text-white">Reset Study Analytics</p>
              <p className="text-[10px] text-slate-400">This will permanently delete all local & synchronized database sessions, goals, and notes. This is irreversible.</p>
            </div>
            
            {resetConfirmed ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onClearData();
                    setResetConfirmed(false);
                    alert("All data cleared successfully.");
                  }}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setResetConfirmed(false)}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setResetConfirmed(true)}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 cursor-pointer"
              >
                Clear Database
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
