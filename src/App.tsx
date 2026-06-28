/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  StudySession, PlannerTask, StudyNote, UserProfile, StudySettings 
} from './types';
import { DEFAULT_ACHIEVEMENTS } from './utils';
import { auth, db } from './firebase';
import { 
  collection, doc, setDoc, addDoc, getDocs, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';

// Components
import Dashboard from './components/Dashboard';
import LiveTimer from './components/LiveTimer';
import ManualTimer from './components/ManualTimer';
import StudyPlanner from './components/StudyPlanner';
import NotesEditor from './components/NotesEditor';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import AiInsights from './components/AiInsights';
import Auth from './components/Auth';

// Icons
import { 
  LayoutGrid, Timer, Edit, Calendar, BookOpen, 
  Brain, BarChart3, Settings as SettingsIcon, User, Flame, LogIn, ChevronRight, Menu, X, Trophy
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Core Data States
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<StudySettings>({
    theme: 'dark',
    alarmSound: 'digital',
    alarmVolume: 50,
    notificationEnabled: true,
    timeFormat: '12h',
    dateFormat: 'YYYY-MM-DD'
  });

  // 1. Initial Load from LocalStorage (Fallback)
  useEffect(() => {
    const cachedSessions = localStorage.getItem('study_sessions');
    if (cachedSessions) setSessions(JSON.parse(cachedSessions));

    const cachedTasks = localStorage.getItem('study_tasks');
    if (cachedTasks) setTasks(JSON.parse(cachedTasks));

    const cachedNotes = localStorage.getItem('study_notes');
    if (cachedNotes) setNotes(JSON.parse(cachedNotes));

    const cachedSettings = localStorage.getItem('study_settings');
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      setSettings(parsed);
      // Set correct dark mode on load
      if (parsed.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } else {
      // default is dark mode
      document.documentElement.classList.add('dark');
    }

    const cachedProfile = localStorage.getItem('guest_profile');
    if (cachedProfile) {
      setUserProfile(JSON.parse(cachedProfile));
    } else {
      // default Guest profile
      const guest: UserProfile = {
        name: 'Scholar Guest',
        email: 'guest@academy.com',
        bio: 'Offline study space. Join a cloud account to synchronize progress across devices!',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=scholar-guest',
        level: 1,
        xp: 0,
        coins: 10,
        targetDailyHours: 2,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0]
      };
      setUserProfile(guest);
      localStorage.setItem('guest_profile', JSON.stringify(guest));
    }
  }, []);

  // Sync to local storage whenever core states change
  useEffect(() => {
    localStorage.setItem('study_settings', JSON.stringify(settings));
  }, [settings]);

  // 2. Fetch User Data from Firestore if Logged In
  useEffect(() => {
    const syncCloudData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch sessions
        const sessionsQuery = query(collection(db, 'studySessions'), where('userId', '==', user.uid));
        const sessionsSnap = await getDocs(sessionsQuery);
        const cloudSessions: StudySession[] = [];
        sessionsSnap.forEach(docSnap => {
          cloudSessions.push({ id: docSnap.id, ...docSnap.data() } as StudySession);
        });
        if (cloudSessions.length > 0) {
          setSessions(cloudSessions);
          localStorage.setItem('study_sessions', JSON.stringify(cloudSessions));
        }

        // Fetch tasks
        const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        const tasksSnap = await getDocs(tasksQuery);
        const cloudTasks: PlannerTask[] = [];
        tasksSnap.forEach(docSnap => {
          cloudTasks.push({ id: docSnap.id, ...docSnap.data() } as PlannerTask);
        });
        if (cloudTasks.length > 0) {
          setTasks(cloudTasks);
          localStorage.setItem('study_tasks', JSON.stringify(cloudTasks));
        }

        // Fetch notes
        const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid));
        const notesSnap = await getDocs(notesQuery);
        const cloudNotes: StudyNote[] = [];
        notesSnap.forEach(docSnap => {
          cloudNotes.push({ id: docSnap.id, ...docSnap.data() } as StudyNote);
        });
        if (cloudNotes.length > 0) {
          setNotes(cloudNotes);
          localStorage.setItem('study_notes', JSON.stringify(cloudNotes));
        }
      } catch (err) {
        console.warn("Could not synchronize cloud data:", err);
      }
    };

    auth.onAuthStateChanged(user => {
      if (user) {
        syncCloudData();
      }
    });
  }, []);

  // 3. Save / Log Study Session
  const handleSaveSession = async (session: StudySession) => {
    const user = auth.currentUser;
    const updatedSessions = [...sessions, session];
    setSessions(updatedSessions);
    localStorage.setItem('study_sessions', JSON.stringify(updatedSessions));

    // Experience calculation: 1 XP per 2 seconds studied + difficulty modifiers
    const secondsStudied = session.actualTime;
    let xpGain = Math.round(secondsStudied / 2);
    if (session.difficulty === 'hard') xpGain = Math.round(xpGain * 1.5);
    else if (session.difficulty === 'easy') xpGain = Math.round(xpGain * 0.8);

    // Coins: 1 Coin per 5 minutes studied
    const coinsGain = Math.floor((secondsStudied / 60) / 5);

    if (userProfile) {
      // Calculate Streaks
      const todayStr = new Date().toISOString().split('T')[0];
      let newStreak = userProfile.currentStreak;
      let newLongest = userProfile.longestStreak;

      if (!userProfile.lastActiveDate) {
        newStreak = 1;
      } else {
        const lastDate = new Date(userProfile.lastActiveDate);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // broken streak reset
        }
      }
      if (newStreak > newLongest) {
        newLongest = newStreak;
      }

      // Handle XP Levels
      let nextLevelXp = userProfile.level * 500;
      let totalXp = userProfile.xp + xpGain;
      let currentLevel = userProfile.level;

      while (totalXp >= nextLevelXp) {
        totalXp -= nextLevelXp;
        currentLevel += 1;
        nextLevelXp = currentLevel * 500;
      }

      const updatedProfile: UserProfile = {
        ...userProfile,
        xp: totalXp,
        level: currentLevel,
        coins: userProfile.coins + coinsGain,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: todayStr
      };

      setUserProfile(updatedProfile);

      if (user) {
        // Sync to Firestore
        try {
          await addDoc(collection(db, 'studySessions'), {
            ...session,
            userId: user.uid
          });
          await setDoc(doc(db, 'users', user.uid), updatedProfile);
        } catch (e) {
          console.error("Firestore logging error:", e);
        }
      } else {
        localStorage.setItem('guest_profile', JSON.stringify(updatedProfile));
      }

      // Achievement unlock conditions evaluation
      checkAchievementsUnlock(updatedSessions, tasks);
    }
  };

  const handleDeleteSession = async (id: string) => {
    const user = auth.currentUser;
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('study_sessions', JSON.stringify(updated));

    if (user) {
      try {
        await deleteDoc(doc(db, 'studySessions', id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 4. Tasks Agenda triggers
  const handleAddTask = async (taskData: Omit<PlannerTask, 'id'>) => {
    const user = auth.currentUser;
    const newId = Math.random().toString();
    const newTask: PlannerTask = { id: newId, ...taskData };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem('study_tasks', JSON.stringify(updated));

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'tasks'), {
          ...taskData,
          userId: user.uid
        });
        // Update local id to match cloud docId
        setTasks(prev => prev.map(t => t.id === newId ? { ...t, id: docRef.id } : t));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleTask = async (id: string) => {
    const user = auth.currentUser;
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem('study_tasks', JSON.stringify(updated));

    const updatedTask = updated.find(t => t.id === id);
    if (user && updatedTask) {
      try {
        await updateDoc(doc(db, 'tasks', id), {
          completed: updatedTask.completed
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    const user = auth.currentUser;
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('study_tasks', JSON.stringify(updated));

    if (user) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 5. Notes triggers
  const handleAddNote = async (noteData: Omit<StudyNote, 'id' | 'updatedAt'>) => {
    const user = auth.currentUser;
    const newId = Math.random().toString();
    const newNote: StudyNote = { 
      id: newId, 
      ...noteData, 
      updatedAt: new Date().toISOString() 
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('study_notes', JSON.stringify(updated));

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'notes'), {
          ...noteData,
          updatedAt: newNote.updatedAt,
          userId: user.uid
        });
        setNotes(prev => prev.map(n => n.id === newId ? { ...n, id: docRef.id } : n));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateNote = async (updatedNote: StudyNote) => {
    const user = auth.currentUser;
    const updated = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotes(updated);
    localStorage.setItem('study_notes', JSON.stringify(updated));

    if (user) {
      try {
        await updateDoc(doc(db, 'notes', updatedNote.id), {
          title: updatedNote.title,
          subject: updatedNote.subject,
          content: updatedNote.content,
          checklist: updatedNote.checklist,
          updatedAt: updatedNote.updatedAt
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    const user = auth.currentUser;
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('study_notes', JSON.stringify(updated));

    if (user) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Clear data function
  const handleClearData = async () => {
    const user = auth.currentUser;
    setSessions([]);
    setTasks([]);
    setNotes([]);
    localStorage.removeItem('study_sessions');
    localStorage.removeItem('study_tasks');
    localStorage.removeItem('study_notes');

    if (user) {
      try {
        // We delete docs sequentially from firestore query snapshots
        const sessionsQuery = query(collection(db, 'studySessions'), where('userId', '==', user.uid));
        const sessionsSnap = await getDocs(sessionsQuery);
        sessionsSnap.forEach(async docSnap => {
          await deleteDoc(doc(db, 'studySessions', docSnap.id));
        });

        const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        const tasksSnap = await getDocs(tasksQuery);
        tasksSnap.forEach(async docSnap => {
          await deleteDoc(doc(db, 'tasks', docSnap.id));
        });

        const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid));
        const notesSnap = await getDocs(notesQuery);
        notesSnap.forEach(async docSnap => {
          await deleteDoc(doc(db, 'notes', docSnap.id));
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Achievement Unlocker check
  const checkAchievementsUnlock = (allSessions: StudySession[], allTasks: PlannerTask[]) => {
    const totalMin = allSessions.reduce((acc, s) => acc + (s.actualTime / 60), 0);
    const completedTasks = allTasks.filter(t => t.completed).length;

    // First check: First Step
    if (allSessions.length >= 1 && !localStorage.getItem('ach_first_step')) {
      triggerUnlock('first_step', 'First Step');
    }
    // Check: Pomodoro Master (25 mins)
    const hasPomodoro = allSessions.some(s => s.actualTime >= 25 * 60);
    if (hasPomodoro && !localStorage.getItem('ach_pomodoro_master')) {
      triggerUnlock('pomodoro_master', 'Pomodoro Novice');
    }
    // Check: Deep work (50 min)
    const hasDeep = allSessions.some(s => s.actualTime >= 50 * 60);
    if (hasDeep && !localStorage.getItem('ach_deep_diver')) {
      triggerUnlock('deep_diver', 'Deep Diver');
    }
    // Check: Consistency
    if (userProfile && userProfile.currentStreak >= 3 && !localStorage.getItem('ach_consistency_king')) {
      triggerUnlock('consistency_king', 'Consistency Builder');
    }
    // Check: Goal slayer
    if (completedTasks >= 5 && !localStorage.getItem('ach_goal_slayer')) {
      triggerUnlock('goal_slayer', 'Goal Slayer');
    }
    // Check: Scholar (5 hours total)
    if (totalMin >= 300 && !localStorage.getItem('ach_scholar')) {
      triggerUnlock('scholar', 'Golden Scholar');
    }
  };

  const triggerUnlock = (id: string, name: string) => {
    localStorage.setItem(`ach_${id}`, 'unlocked');
    setUnlockedAchievement(name);
    setTimeout(() => {
      setUnlockedAchievement(null);
    }, 5000);
  };

  // Subject autocomplete help
  const recentSubjects: string[] = Array.from(new Set(sessions.map(s => s.subject))) as string[];

  // Navigation Links definition
  const navigationLinks = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid },
    { id: 'timer', name: 'Focus Timer', icon: Timer },
    { id: 'manual', name: 'Manual Log', icon: Edit },
    { id: 'planner', name: 'Study Planner', icon: Calendar },
    { id: 'notes', name: 'Notebook', icon: BookOpen },
    { id: 'ai', name: 'AI Coach', icon: Brain },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
    { id: 'account', name: 'Account Profile', icon: User }
  ];

  const getMeshColors = () => {
    switch (settings.theme) {
      case 'light':
        return ['bg-rose-200/35', 'bg-indigo-100/35'];
      case 'emerald':
        return ['bg-emerald-900/35', 'bg-teal-900/25'];
      case 'amber':
        return ['bg-amber-950/35', 'bg-red-950/25'];
      case 'cyberpunk':
        return ['bg-pink-950/30', 'bg-cyan-950/30'];
      case 'dark':
      default:
        return ['bg-indigo-900/20', 'bg-violet-900/20'];
    }
  };

  const [mesh1, mesh2] = getMeshColors();

  return (
    <div className={`min-h-screen bg-[#05060f] text-slate-100 font-sans flex flex-col md:flex-row antialiased relative overflow-x-hidden pb-12 select-none theme-${settings.theme}`}>
      
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${mesh1} blur-[130px] rounded-full`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${mesh2} blur-[130px] rounded-full`}></div>
      </div>

      {/* Achievement Unlocked visual notification overlay */}
      {unlockedAchievement && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3.5 border border-indigo-400/30 backdrop-blur-xl animate-bounce">
          <div className="p-2 bg-white/20 rounded-xl">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-indigo-200">Milestone Unlocked!</span>
            <p className="text-sm font-black">{unlockedAchievement}</p>
          </div>
        </div>
      )}

      {/* 1. Mobile Topbar Header */}
      <header className="md:hidden w-full bg-white/5 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/25">
            <Timer className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-wider text-white">AuraFocus</h1>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* 2. Responsive Side Navigation Rail */}
      <nav className={`w-full md:w-64 bg-white/5 backdrop-blur-2xl border-r border-white/5 flex flex-col fixed md:sticky top-[69px] md:top-0 h-[calc(100vh-69px)] md:h-screen z-30 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="hidden md:flex p-6 border-b border-white/5 items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-black tracking-tight text-white">AuraFocus</h1>
            <span className="text-[9px] font-bold text-indigo-400 block uppercase tracking-widest">Study Space</span>
          </div>
        </div>

        {/* Tab links navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navigationLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold shadow-md' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {link.name}
              </button>
            );
          })}
        </div>

        {/* Upgrade Banner matching AuraFocus mock */}
        <div className="p-4 mb-4 mx-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-600/10 border border-white/5">
          <p className="text-[10px] text-indigo-100 uppercase tracking-wider font-bold mb-0.5">Premium Booster</p>
          <p className="text-xs text-white/95 font-medium mb-3">Unlock AI schedules & specialized focus soundscapes.</p>
          <button 
            onClick={() => setActiveTab('ai')}
            className="w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-[10px] shadow-md transition-transform hover:scale-[1.02] cursor-pointer"
          >
            LAUNCH AI COACH
          </button>
        </div>

        {/* User Quick Indicator bottom bar */}
        {userProfile && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/10">
            <div className="flex items-center gap-2">
              <img src={userProfile.avatarUrl} alt="Avatar profile" className="w-8 h-8 rounded-full border border-white/10 bg-white/5" />
              <div className="max-w-[120px]">
                <p className="text-[10px] font-bold text-white truncate">{userProfile.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Level {userProfile.level}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              <Flame className="w-3 h-3 fill-orange-400" /> {userProfile.currentStreak}d
            </div>
          </div>
        )}
      </nav>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full z-10 relative">
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              sessions={sessions} 
              tasks={tasks} 
              userProfile={userProfile} 
              onDeleteSession={handleDeleteSession}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'timer' && (
            <LiveTimer 
              onSaveSession={handleSaveSession} 
              settings={settings}
              recentSubjects={recentSubjects}
            />
          )}

          {activeTab === 'manual' && (
            <ManualTimer 
              onSaveSession={handleSaveSession} 
              recentSubjects={recentSubjects}
            />
          )}

          {activeTab === 'planner' && (
            <StudyPlanner 
              tasks={tasks} 
              onAddTask={handleAddTask} 
              onToggleTask={handleToggleTask} 
              onDeleteTask={handleDeleteTask}
              recentSubjects={recentSubjects}
            />
          )}

          {activeTab === 'notes' && (
            <NotesEditor 
              notes={notes} 
              onAddNote={handleAddNote} 
              onUpdateNote={handleUpdateNote} 
              onDeleteNote={handleDeleteNote}
              recentSubjects={recentSubjects}
            />
          )}

          {activeTab === 'ai' && (
            <AiInsights 
              sessions={sessions}
              recentSubjects={recentSubjects}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics sessions={sessions} />
          )}

          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              setSettings={setSettings} 
              sessions={sessions}
              onClearData={handleClearData}
            />
          )}

          {activeTab === 'account' && (
            <Auth 
              userProfile={userProfile} 
              setUserProfile={setUserProfile}
              onLoginSuccess={() => setActiveTab('dashboard')}
            />
          )}
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#05060f]/60 backdrop-blur-md flex items-center justify-between px-6 border-t border-white/5 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-medium">Cloud Sync Active</span>
          </div>
          <span className="text-[10px] text-slate-600">|</span>
          <span className="text-[10px] text-slate-400 font-medium">4,128 scholars studying right now</span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium tracking-wider font-mono">VERSION 2.4.0 • PRODUCTION READY</div>
      </footer>

    </div>
  );
}
