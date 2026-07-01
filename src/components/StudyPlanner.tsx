/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PlannerTask } from '../types';
import { 
  Plus, Trash2, CheckCircle2, Circle, AlertTriangle, 
  Calendar, Sparkles, Clock, BookOpen, Layers 
} from 'lucide-react';

interface StudyPlannerProps {
  tasks: PlannerTask[];
  onAddTask: (task: Omit<PlannerTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  recentSubjects: string[];
}

export default function StudyPlanner({ tasks, onAddTask, onToggleTask, onDeleteTask, recentSubjects }: StudyPlannerProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState(() => new Date().toISOString().split('T')[0]);
  const [colorTag, setColorTag] = useState('bg-indigo-500');
  const [notes, setNotes] = useState('');
  const [taskType, setTaskType] = useState<'target' | 'standard'>('target');
  const [targetHours, setTargetHours] = useState<number>(2);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    onAddTask({
      title,
      subject,
      priority,
      deadline,
      completed: false,
      notes,
      colorTag,
      targetHours: taskType === 'target' ? targetHours : undefined
    });

    setTitle('');
    setNotes('');
  };

  // Split tasks into targets (with targetHours) and standard checklist items
  const studyTargets = useMemo(() => {
    return tasks.filter(t => t.targetHours !== undefined);
  }, [tasks]);

  const agendaTasks = useMemo(() => {
    return tasks.filter(t => t.targetHours === undefined);
  }, [tasks]);

  // Stats (Total Progress)
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const colorTagsList = [
    { class: 'bg-indigo-500', name: 'Royal Indigo' },
    { class: 'bg-emerald-500', name: 'Forest Emerald' },
    { class: 'bg-amber-500', name: 'Sun Amber' },
    { class: 'bg-rose-500', name: 'Cherry Rose' },
    { class: 'bg-sky-500', name: 'Sky Cerulean' }
  ];

  return (
    <div id="study-planner-panel" className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Col 1: Add Task / Target Form */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-6 rounded-[24px] shadow-2xl space-y-4 self-start">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> Configure Objective
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Target type switcher */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planning Mode</label>
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setTaskType('target')}
                className={`py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  taskType === 'target' 
                    ? 'bg-indigo-500 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎯 Study Target Grid
              </button>
              <button
                type="button"
                onClick={() => setTaskType('standard')}
                className={`py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  taskType === 'standard' 
                    ? 'bg-indigo-500 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Standard Task
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title / Topic Name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={taskType === 'target' ? "e.g. Mechanics or Organic Chem" : "e.g. Solve homework practice sheets"}
              required
              className="w-full bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              required
              className="w-full bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
            {recentSubjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {recentSubjects.slice(0, 4).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 cursor-pointer"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic hours slider for study targets */}
          {taskType === 'target' && (
            <div className="space-y-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
              <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex justify-between">
                <span>Target Study Time</span>
                <span className="text-white font-extrabold">{targetHours} {targetHours === 1 ? 'Hour' : 'Hours'}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={targetHours}
                onChange={e => setTargetHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                <span>30 min</span>
                <span>2 hrs</span>
                <span>4 hrs</span>
                <span>8 hrs</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal mt-1 italic">
                * Ticking this card in the grid logs a completed {targetHours}-hour study session instantly!
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-sm focus:outline-none text-white font-semibold"
              >
                <option value="low" className="bg-[#05060f]">🟢 Low</option>
                <option value="medium" className="bg-[#05060f]">🟡 Medium</option>
                <option value="high" className="bg-[#05060f]">🔴 High</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs focus:outline-none text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accent Theme</label>
            <div className="flex gap-2">
              {colorTagsList.map(tag => (
                <button
                  key={tag.class}
                  type="button"
                  onClick={() => setColorTag(tag.class)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${tag.class} ${
                    colorTag === tag.class ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  title={tag.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Formula guidelines or focus goals..."
              className="w-full bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Add to Planner
          </button>
        </form>
      </div>

      {/* Col 2 & 3: Interactive Grids and Lists */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress header bar */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-800 text-white border border-white/10 rounded-[24px] p-5 shadow-2xl flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-lg font-extrabold tracking-tight">Your Goal Progression</h4>
            <p className="text-xs text-indigo-100 font-medium">Clear study objectives systematically to gain bonus experience points.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-white/10 fill-transparent" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-indigo-400 fill-transparent transition-all duration-300" 
                  strokeWidth="8" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (completionRate / 100) * 251.2}
                />
              </svg>
              <span className="absolute text-xs font-black text-indigo-200">{completionRate}%</span>
            </div>
            <div className="text-xs font-semibold">
              <p>{completedCount} of {totalCount} completed</p>
              <p className="text-[10px] text-indigo-200 uppercase tracking-wider">{totalCount - completedCount} targets remaining</p>
            </div>
          </div>
        </div>

        {/* 1. Dynamic Study Blocks Grid (User's request) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                🎯
              </span>
              Study Target Grid
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-1 rounded">
              {studyTargets.length} Blocks
            </span>
          </div>

          {studyTargets.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-[24px] p-8 text-center text-slate-500 space-y-2">
              <Layers className="w-10 h-10 mx-auto stroke-[1.5] text-indigo-400/40" />
              <p className="text-xs font-bold text-slate-300">No active Study Target Grids created yet.</p>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-md mx-auto">
                Select <span className="text-indigo-300 font-bold">"Study Target Grid"</span> on the left to add block goals like <span className="text-indigo-300 font-bold">Physics 2 hours</span>. Checking them logs full sessions instantly!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyTargets.map(target => {
                const isOverdue = new Date(target.deadline) < new Date() && !target.completed;
                return (
                  <div 
                    key={target.id}
                    className={`relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-white/20 group ${
                      target.completed ? 'opacity-65 border-indigo-500/30 bg-indigo-500/[0.02]' : ''
                    }`}
                  >
                    {/* Glowing Accent strip based on color tag */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${target.colorTag}`} />

                    <div className="flex justify-between items-start pt-1.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {target.subject}
                          </span>
                          {target.priority === 'high' && (
                            <span className="text-[8px] font-black uppercase text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                              High
                            </span>
                          )}
                        </div>
                        <h5 className={`text-sm font-black text-white ${target.completed ? 'line-through text-slate-500' : ''}`}>
                          {target.title}
                        </h5>
                        {target.notes && (
                          <p className="text-xs text-slate-400 leading-snug">{target.notes}</p>
                        )}
                      </div>

                      {/* Tick Checkbox Trigger */}
                      <button
                        onClick={() => onToggleTask(target.id)}
                        className="p-1.5 rounded-full hover:bg-white/5 transition-all text-slate-400 hover:text-indigo-400 cursor-pointer flex-shrink-0"
                        title={target.completed ? "Mark incomplete" : "Tick as Completed!"}
                      >
                        {target.completed ? (
                          <CheckCircle2 className="w-8 h-8 text-indigo-400 fill-indigo-500/10 scale-110" />
                        ) : (
                          <Circle className="w-8 h-8 stroke-[1.2] text-slate-400 hover:scale-105" />
                        )}
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-xl text-[10px]">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>⏱️ {target.targetHours} {target.targetHours === 1 ? 'Hour' : 'Hours'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                          Due {target.deadline}
                        </span>
                        
                        <button
                          onClick={() => onDeleteTask(target.id)}
                          className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                          title="Delete target block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {target.completed && (
                      <div className="absolute top-2 right-12 text-[9px] font-black uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wider">
                        Saved in History! ✨
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Standard Checklist agenda */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                📝
              </span>
              Task Checklist Agenda
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-1 rounded">
              {agendaTasks.length} Active Items
            </span>
          </div>

          {agendaTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <Calendar className="w-10 h-10 mx-auto stroke-[1.5] text-slate-400/40" />
              <p className="text-xs">No regular tasks planned yet. Add standard checklist items to organize homework/readings.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {agendaTasks.map(task => {
                const isOverdue = new Date(task.deadline) < new Date() && !task.completed;
                return (
                  <div 
                    key={task.id} 
                    className={`py-3.5 flex gap-4 items-start group transition-all ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Circle icon trigger */}
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-400 fill-indigo-500/10" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2.5 h-2.5 rounded-full ${task.colorTag}`} />
                        <h5 className={`text-sm font-bold text-white ${task.completed ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h5>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
                          {task.subject}
                        </span>
                        
                        {task.priority === 'high' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.2 rounded">
                            <AlertTriangle className="w-3 h-3" /> High
                          </span>
                        )}
                      </div>

                      {task.notes && <p className="text-xs text-slate-400">{task.notes}</p>}

                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {task.deadline}
                        </span>
                        {isOverdue && (
                          <span className="text-red-400 uppercase tracking-wide">⚠️ Overdue</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
