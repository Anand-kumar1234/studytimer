/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlannerTask } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, AlertTriangle, Calendar, Star, Sparkles } from 'lucide-react';

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
      colorTag
    });

    setTitle('');
    setNotes('');
  };

  // Stats
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
    <div id="study-planner-panel" className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Col 1: Add Task Form */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-3xl p-6 rounded-[24px] shadow-2xl space-y-4 self-start">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> Add Task
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Solve Kirchhoff practice sheet"
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
                {recentSubjects.slice(0, 3).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color Tag</label>
            <div className="flex gap-2">
              {colorTagsList.map(tag => (
                <button
                  key={tag.class}
                  type="button"
                  onClick={() => setColorTag(tag.class)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${tag.class} ${
                    colorTag === tag.class ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-115'
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
              placeholder="Formulas, chapters, or details..."
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

      {/* Col 2 & 3: Task Lists and completion metrics */}
      <div className="lg:col-span-2 space-y-6">
        {/* Completion Milestone Card */}
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
              <p className="text-[10px] text-indigo-200 uppercase tracking-wider">{totalCount - completedCount} tasks remaining</p>
            </div>
          </div>
        </div>

        {/* List Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-base font-bold text-white">Task Agenda</h4>
            <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
              {tasks.length} total
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500 space-y-2">
              <Calendar className="w-12 h-12 mx-auto stroke-[1.5]" />
              <p className="text-sm">No tasks planned yet. Add a task to start organizing your study!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tasks.map(task => {
                const isOverdue = new Date(task.deadline) < new Date() && !task.completed;
                return (
                  <div 
                    key={task.id} 
                    className={`py-4 flex gap-4 items-start group transition-all ${
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
