/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StudySession {
  id?: string;
  userId?: string;
  subject: string;
  chapter: string;
  topic: string;
  duration: number; // in minutes (target)
  actualTime: number; // in seconds
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  sessionType: 'pomodoro' | 'custom' | 'manual';
  notes: string;
  mood: 'focused' | 'tired' | 'stressed' | 'neutral' | 'energized';
  difficulty: 'easy' | 'medium' | 'hard';
  productivityRating: number; // 1 to 5 stars
  synced?: boolean;
}

export interface Goal {
  id?: string;
  userId?: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetHours: number;
  completedHours: number;
  dateStr: string; // YYYY-MM-DD for daily, YYYY-WW for weekly, YYYY-MM for monthly
  synced?: boolean;
}

export interface PlannerTask {
  id: string;
  userId?: string;
  title: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  colorTag: string; // hex or tailwind color class
  synced?: boolean;
}

export interface StudyNote {
  id: string;
  userId?: string;
  title: string;
  subject: string;
  content: string; // Markdown text
  checklist: { id: string; text: string; done: boolean }[];
  updatedAt: string; // ISO string
  synced?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string; // Lucide icon name
  xpReward: number;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  level: number;
  xp: number;
  coins: number;
  targetDailyHours: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string; // YYYY-MM-DD
}

export interface StudySettings {
  theme: 'light' | 'dark' | 'emerald' | 'amber' | 'cyberpunk';
  alarmSound: 'digital' | 'analog' | 'bell' | 'forest_bird' | 'gentle_piano';
  alarmVolume: number; // 0 to 100
  notificationEnabled: boolean;
  timeFormat: '12h' | '24h';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
}
