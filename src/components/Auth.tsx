/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { LogIn, UserPlus, LogOut, Key, Shield, Trophy, Star, Award, Zap, Sparkles } from 'lucide-react';

interface AuthProps {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onLoginSuccess: () => void;
}

export default function Auth({ userProfile, setUserProfile, onLoginSuccess }: AuthProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Initialize new user profile in Firestore
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || name || 'Scholar',
              email: user.email || '',
              bio: 'Passionate student on a deep focus journey.',
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
              level: 1,
              xp: 0,
              coins: 10,
              targetDailyHours: 2,
              currentStreak: 0,
              longestStreak: 0,
              lastActiveDate: new Date().toISOString().split('T')[0]
            };
            await setDoc(docRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, [name, setUserProfile]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (forgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Please check your inbox.');
        setForgotPassword(false);
      } else if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const newProfile: UserProfile = {
          uid: userCred.user.uid,
          name: name || 'Scholar',
          email: email,
          bio: 'Passionate student on a deep focus journey.',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userCred.user.uid}`,
          level: 1,
          xp: 0,
          coins: 10,
          targetDailyHours: 2,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: new Date().toISOString().split('T')[0]
        };
        await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
        setUserProfile(newProfile);
        onLoginSuccess();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
      setMessage('Signed out successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  // XP progression calculation
  const nextLevelXp = userProfile ? userProfile.level * 500 : 500;
  const progressPercent = userProfile ? Math.min(100, (userProfile.xp / nextLevelXp) * 100) : 0;

  if (currentUser && userProfile) {
    return (
      <div id="auth-panel" className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-40 h-40 text-yellow-500" />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <img 
              src={userProfile.avatarUrl} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full border-4 border-emerald-500/20 bg-zinc-100 dark:bg-zinc-800"
            />
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{userProfile.name}</h2>
                <span className="inline-flex items-center gap-1 self-center md:self-start px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  <Sparkles className="w-3.5 h-3.5" /> Level {userProfile.level} Scholar
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{userProfile.email}</p>
              <p className="text-sm italic text-zinc-600 dark:text-zinc-300">"{userProfile.bio}"</p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="mt-4 md:mt-0 px-4 py-2 flex items-center gap-2 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-all cursor-pointer text-zinc-700 dark:text-zinc-300"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          {/* XP progress bar */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Level Progress</span>
              <span>{userProfile.xp} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Level Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Coins</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{userProfile.coins}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Daily Target</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{userProfile.targetDailyHours}h</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Current Streak</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{userProfile.currentStreak} Days</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Longest Streak</p>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{userProfile.longestStreak} Days</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-2">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {forgotPassword ? 'Reset Password' : isSignUp ? 'Create Study Account' : 'Connect Study Account'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {forgotPassword 
            ? 'We will send you an email reset instructions.'
            : isSignUp 
              ? 'Join scholars worldwide to back up and sync statistics.' 
              : 'Log in to unlock your persistent stats on all devices.'
          }
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {message}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && !forgotPassword && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Your Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Marie Curie" 
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-50"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            placeholder="student@academy.com" 
            required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {!forgotPassword && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-50"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/60 text-white font-medium py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : forgotPassword ? (
            <>
              <Key className="w-4 h-4" /> Send Reset Link
            </>
          ) : isSignUp ? (
            <>
              <UserPlus className="w-4 h-4" /> Sign Up & Register
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Sign In to Cloud
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col gap-2.5 text-center text-xs font-medium pt-2 border-t border-zinc-100 dark:border-zinc-800">
        {!forgotPassword && (
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-emerald-600 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
          </button>
        )}
        
        <button 
          onClick={() => {
            setForgotPassword(!forgotPassword);
            setError(null);
          }}
          className="text-zinc-500 hover:underline cursor-pointer"
        >
          {forgotPassword ? 'Back to Login' : 'Forgot Password?'}
        </button>
      </div>
    </div>
  );
}
