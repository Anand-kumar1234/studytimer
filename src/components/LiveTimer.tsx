/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StudySession, StudySettings } from '../types';
import { 
  formatTime, 
  playAlarmSound, 
  WebAudioAmbientSynth, 
  AMBIENT_TRACKS, 
  MOTIVATIONAL_QUOTES 
} from '../utils';
import { 
  Play, Pause, RotateCcw, StopCircle, Maximize2, Minimize2, 
  Volume2, VolumeX, Music, HelpCircle, Check, Flame, Trophy, Award, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveTimerProps {
  onSaveSession: (session: StudySession) => void;
  settings: StudySettings;
  recentSubjects: string[];
}

export default function LiveTimer({ onSaveSession, settings, recentSubjects }: LiveTimerProps) {
  // Timer settings
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [presetDuration, setPresetDuration] = useState('25'); // minutes
  
  // Timer core states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Focus Mode & Ambient Sounds
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [ambientSound, setAmbientSound] = useState<string>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.4);
  const [isMuted, setIsMuted] = useState(false);

  // Auto-Save summary form state (when stopped or completed)
  const [showSummaryForm, setShowSummaryForm] = useState(false);
  const [timeStudied, setTimeStudied] = useState(0); // in seconds
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<'focused' | 'tired' | 'stressed' | 'neutral' | 'energized'>('focused');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [productivityRating, setProductivityRating] = useState(4);

  // Quotes cycling
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);

  // Advanced Pomodoro Cycles & Breathing States
  const [isCycleMode, setIsCycleMode] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [cycleState, setCycleState] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [autoStartIntervals, setAutoStartIntervals] = useState(true);
  const [totalCycleStudiedTime, setTotalCycleStudiedTime] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold_out'>('inhale');
  const [breathingPhaseTime, setBreathingPhaseTime] = useState(4);

  // Ref trackers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<WebAudioAmbientSynth>(new WebAudioAmbientSynth());

  // Breathing simulation tick
  useEffect(() => {
    let breathingInterval: NodeJS.Timeout | null = null;
    if (showBreathing && isActive && !isPaused) {
      breathingInterval = setInterval(() => {
        setBreathingPhaseTime(prev => {
          if (prev <= 1) {
            setBreathingPhase(current => {
              switch (current) {
                case 'inhale': return 'hold';
                case 'hold': return 'exhale';
                case 'exhale': return 'hold_out';
                case 'hold_out':
                default:
                  return 'inhale';
              }
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (breathingInterval) clearInterval(breathingInterval);
    };
  }, [showBreathing, isActive, isPaused]);

  // Setup initial preset changes
  useEffect(() => {
    if (!isActive) {
      const mins = parseInt(presetDuration) || 25;
      setTimeLeft(mins * 60);
      setInitialTime(mins * 60);
    }
  }, [presetDuration, isActive]);

  // Quote rotation interval
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIdx(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 15000);
    return () => clearInterval(quoteInterval);
  }, []);

  // Timer Tick implementation
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Completed!
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  // Ambient sound setup & lifecycle
  useEffect(() => {
    if (isActive && !isPaused && ambientSound !== 'none') {
      synthRef.current.start(ambientSound, isMuted ? 0 : ambientVolume);
    } else {
      synthRef.current.stop();
    }
    return () => synthRef.current.stop();
  }, [ambientSound, isActive, isPaused, isMuted]);

  // Dynamic volume changer
  useEffect(() => {
    synthRef.current.setVolume(isMuted ? 0 : ambientVolume);
  }, [ambientVolume, isMuted]);

  const handleStart = () => {
    if (!subject.trim()) {
      alert('Please enter a Study Subject before starting the timer.');
      return;
    }
    setIsActive(true);
    setIsPaused(false);
    setShowSummaryForm(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setIsBreak(false);
    setCycleState('focus');
    setCurrentCycle(1);
    setTotalCycleStudiedTime(0);
    const mins = parseInt(presetDuration) || 25;
    setTimeLeft(mins * 60);
    setInitialTime(mins * 60);
    synthRef.current.stop();
  };

  const handleStop = () => {
    let elapsed = 0;
    if (isCycleMode) {
      elapsed = totalCycleStudiedTime;
      if (cycleState === 'focus') {
        elapsed += (initialTime - timeLeft);
      }
    } else {
      elapsed = initialTime - timeLeft;
    }

    setTimeStudied(elapsed);
    setIsActive(false);
    setIsPaused(false);
    synthRef.current.stop();
    
    if (elapsed > 10) {
      setShowSummaryForm(true);
    } else {
      alert('Session was too short to record (< 10 seconds).');
      handleReset();
    }
  };

  const handleTimerComplete = () => {
    // Play Alarms
    playAlarmSound(settings.alarmSound, settings.alarmVolume / 100);
    
    // Trigger Beautiful Confetti Celebrations!
    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    if (isCycleMode) {
      if (cycleState === 'focus') {
        // Complete focus block
        const elapsed = initialTime;
        setTotalCycleStudiedTime(prev => prev + elapsed);

        if (currentCycle < 4) {
          // Transition to short break (5 mins)
          setCycleState('short_break');
          setIsBreak(true);
          const breakMins = 5;
          setTimeLeft(breakMins * 60);
          setInitialTime(breakMins * 60);
          
          if (!autoStartIntervals) {
            setIsPaused(true);
          }
        } else {
          // Transition to long break (15 mins)
          setCycleState('long_break');
          setIsBreak(true);
          const breakMins = 15;
          setTimeLeft(breakMins * 60);
          setInitialTime(breakMins * 60);
          
          if (!autoStartIntervals) {
            setIsPaused(true);
          }
        }
      } else {
        // Break completed!
        if (cycleState === 'short_break') {
          setCurrentCycle(prev => prev + 1);
        } else {
          setCurrentCycle(1); // Reset cycles
        }

        setCycleState('focus');
        setIsBreak(false);
        const focusMins = parseInt(presetDuration) || 25;
        setTimeLeft(focusMins * 60);
        setInitialTime(focusMins * 60);

        if (!autoStartIntervals) {
          setIsPaused(true);
        }
      }
    } else {
      // Regular timer complete
      setIsActive(false);
      setIsPaused(false);
      synthRef.current.stop();
      
      const elapsed = initialTime;
      setTimeStudied(elapsed);
      setShowSummaryForm(true);
    }
  };

  const handleSaveSummary = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const endTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const startObj = new Date(now.getTime() - timeStudied * 1000);
    const startTimeStr = startObj.toTimeString().split(' ')[0].substring(0, 5);

    const session: StudySession = {
      subject,
      chapter: chapter || 'Unscheduled',
      topic: topic || 'General Study',
      duration: Math.round(initialTime / 60),
      actualTime: timeStudied,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      sessionType: 'pomodoro',
      notes,
      mood,
      difficulty,
      productivityRating
    };

    onSaveSession(session);
    setShowSummaryForm(false);
    handleReset();
    
    // Clear chapter and notes
    setChapter('');
    setTopic('');
    setNotes('');
  };

  // Progress Calculations for Ring SVG
  const progressPercent = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div id="live-timer-panel" className={`relative transition-all duration-300 ${
      fullscreenMode 
        ? 'fixed inset-0 z-50 bg-[#05060f] text-white flex flex-col justify-center items-center p-6' 
        : 'max-w-3xl mx-auto bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-2xl'
    }`}>
      
      {/* 1. Fullscreen Toggle absolute on corner */}
      <button 
        onClick={() => setFullscreenMode(!fullscreenMode)}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all cursor-pointer z-10"
        title="Toggle Distraction-free Fullscreen Mode"
      >
        {fullscreenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      {/* Show regular session configuration or active timer */}
      {!isActive && !showSummaryForm ? (
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white">Launch Focus Timer</h2>
            <p className="text-sm text-slate-400">Set your objective and start studying in a highly focused sandbox.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject To Study</label>
              <input 
                type="text" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Mathematics" 
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
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter</label>
              <input 
                type="text" 
                value={chapter} 
                onChange={e => setChapter(e.target.value)}
                placeholder="e.g. Linear Algebra" 
                className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Style</label>
              <select 
                value={presetDuration} 
                onChange={e => setPresetDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="15" className="bg-[#05060f]">Short Block (15 min)</option>
                <option value="25" className="bg-[#05060f]">Classic Pomodoro (25 min)</option>
                <option value="45" className="bg-[#05060f]">Standard Focus (45 min)</option>
                <option value="50" className="bg-[#05060f]">Deep Work (50 min)</option>
                <option value="60" className="bg-[#05060f]">Extended Study (60 min)</option>
                <option value="90" className="bg-[#05060f]">Extreme Deep Study (90 min)</option>
                <option value="120" className="bg-[#05060f]">Super Focus (120 min)</option>
              </select>
            </div>
          </div>

          {/* Advanced Mode Toggles */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">Advanced Study Tools</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isCycleMode}
                  onChange={e => setIsCycleMode(e.target.checked)}
                  className="mt-1 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white">Automated Cycles</span>
                  <p className="text-[10px] text-slate-400">Automate Study-Rest periods (25m study / 5m break × 4 cycles + 15m rest).</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={autoStartIntervals}
                  onChange={e => setAutoStartIntervals(e.target.checked)}
                  className="mt-1 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white">Auto-Start Intervals</span>
                  <p className="text-[10px] text-slate-400">Automatically launch the next work/break session when timer rings.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showBreathing}
                  onChange={e => setShowBreathing(e.target.checked)}
                  className="mt-1 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white">Guided Box Breathing</span>
                  <p className="text-[10px] text-slate-400">Integrate real-time paced breathing exercise visual to maximize rest relaxation.</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-white" /> Start Focus Session
          </button>
        </div>
      ) : showSummaryForm ? (
        /* Summary Evaluation Form */
        <div className="space-y-6 max-w-xl mx-auto">
          <div className="text-center space-y-2 pb-4 border-b border-white/5">
            <div className="inline-flex p-3 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 mb-2">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white">Excellent Session!</h2>
            <p className="text-sm text-slate-400">
              You studied <span className="font-bold text-indigo-400">{Math.round(timeStudied / 60)} minutes</span> of {subject}. Rate your focus and experience.
            </p>
          </div>

          <form onSubmit={handleSaveSummary} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="easy" className="bg-[#05060f]">Easy (Fluid review)</option>
                  <option value="medium" className="bg-[#05060f]">Medium (Moderate concentration)</option>
                  <option value="hard" className="bg-[#05060f]">Hard (Extreme complexity)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Mood</label>
                <select 
                  value={mood} 
                  onChange={e => setMood(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="focused" className="bg-[#05060f]">Focused</option>
                  <option value="energized" className="bg-[#05060f]">Energized</option>
                  <option value="neutral" className="bg-[#05060f]">Neutral</option>
                  <option value="tired" className="bg-[#05060f]">Tired</option>
                  <option value="stressed" className="bg-[#05060f]">Stressed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Productivity Rating</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setProductivityRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <svg className={`w-6 h-6 ${star <= productivityRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.25.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 10.11c-.773-.56-.374-1.81.588-1.81h4.908a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observations & Summaries</label>
              <textarea 
                rows={3}
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Formulas memoized? Flashcards done? Briefly list accomplishments..."
                className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer text-sm"
            >
              Log Session & Claim XP
            </button>
          </form>
        </div>
      ) : (
        /* Active Focus Timer */
        <div className="flex flex-col items-center justify-center space-y-8 py-6">
          {/* Metadata Display */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {isBreak ? '☕ Rest Period' : '⚡ Focus Period'}
            </span>
            
            {isCycleMode && (
              <div className="flex items-center gap-2 text-xs text-indigo-300 font-extrabold bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Pomodoro Cycle {currentCycle} / 4</span>
                <span className="opacity-40">•</span>
                <span className="uppercase tracking-wide text-[10px]">
                  {cycleState === 'focus' && 'Focus block'}
                  {cycleState === 'short_break' && 'Short Rest'}
                  {cycleState === 'long_break' && 'Long Rest'}
                </span>
              </div>
            )}

            <h2 className="text-2xl font-black tracking-tight text-white">{subject}</h2>
            {chapter && <p className="text-sm font-semibold text-slate-400">{chapter}</p>}
          </div>

          {/* SVG Countdown progress Ring */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
              {/* Background ring */}
              <circle 
                cx="110" 
                cy="110" 
                r={radius} 
                className="stroke-white/5 fill-transparent" 
                strokeWidth="10" 
              />
              {/* Foreground matching progress */}
              <circle 
                cx="110" 
                cy="110" 
                r={radius} 
                className="stroke-indigo-500 fill-transparent transition-all duration-300" 
                strokeWidth="10" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center digital time counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5">
              <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Remaining
              </span>
            </div>
          </div>

          {/* Guided Breathing box when enabled */}
          {showBreathing && (
            <div className="w-full max-w-md bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3.5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Guided Box Breathing</span>
              </div>
              
              {/* Pulsing Breathing Circle */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div 
                  className="absolute rounded-full bg-indigo-500/20 border border-indigo-500/40 transition-all duration-[4000ms] ease-in-out"
                  style={{
                    width: breathingPhase === 'inhale' || breathingPhase === 'hold' ? '100px' : '55px',
                    height: breathingPhase === 'inhale' || breathingPhase === 'hold' ? '100px' : '55px',
                  }}
                />
                <div 
                  className="absolute rounded-full bg-indigo-400/15 border border-indigo-400/30 transition-all duration-[4000ms] ease-in-out"
                  style={{
                    width: breathingPhase === 'inhale' ? '85px' : breathingPhase === 'hold' ? '95px' : breathingPhase === 'exhale' ? '65px' : '45px',
                    height: breathingPhase === 'inhale' ? '85px' : breathingPhase === 'hold' ? '95px' : breathingPhase === 'exhale' ? '65px' : '45px',
                  }}
                />
                <span className="text-xs font-black uppercase text-indigo-200 z-10 text-center select-none">
                  {breathingPhase === 'inhale' && 'Inhale'}
                  {breathingPhase === 'hold' && 'Hold'}
                  {breathingPhase === 'exhale' && 'Exhale'}
                  {breathingPhase === 'hold_out' && 'Rest'}
                  <span className="block text-[10px] font-bold text-indigo-400 mt-1">{breathingPhaseTime}s</span>
                </span>
              </div>
              
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                {breathingPhase === 'inhale' && 'Breathe in deeply through your nose, expanding your chest.'}
                {breathingPhase === 'hold' && 'Retain the air in your lungs calmly, keeping your shoulders relaxed.'}
                {breathingPhase === 'exhale' && 'Release the breath slowly through your mouth, letting go of tension.'}
                {breathingPhase === 'hold_out' && 'Wait empty-lunged, enjoying the quiet moment of complete stillness.'}
              </p>
            </div>
          )}

          {/* Interactive Ambient soundscapes control panel */}
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Music className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Focus Audio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="p-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={ambientVolume}
                  onChange={e => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAmbientSound('none')}
                className={`py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  ambientSound === 'none' 
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' 
                    : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                No Audio
              </button>
              {AMBIENT_TRACKS.map(track => (
                <button
                  key={track.id}
                  onClick={() => {
                    setAmbientSound(track.id);
                    setIsMuted(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                    ambientSound === track.id 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' 
                      : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {track.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cyclical study quote */}
          <div className="text-center max-w-md px-6 text-slate-400 italic text-xs leading-relaxed">
            "{MOTIVATIONAL_QUOTES[currentQuoteIdx].text}"
            <span className="block not-italic font-bold text-[10px] uppercase tracking-wider text-slate-500 mt-1">
              — {MOTIVATIONAL_QUOTES[currentQuoteIdx].author}
            </span>
          </div>

          {/* Study Core Interactive action controls */}
          <div className="flex items-center gap-4">
            {isPaused ? (
              <button
                onClick={handleResume}
                className="p-4 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:scale-105"
                title="Resume Timer"
              >
                <Play className="w-6 h-6 fill-white" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="p-4 rounded-full bg-yellow-600 text-white hover:bg-yellow-700 shadow-lg shadow-yellow-600/25 transition-all cursor-pointer hover:scale-105"
                title="Pause Timer"
              >
                <Pause className="w-6 h-6 fill-white" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all cursor-pointer hover:scale-105"
              title="Stop & Log Session"
            >
              <StopCircle className="w-6 h-6" />
            </button>

            <button
              onClick={handleReset}
              className="p-4 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer hover:scale-105"
              title="Reset Timer"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
