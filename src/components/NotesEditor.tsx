/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyNote } from '../types';
import { Plus, Trash2, Search, Edit3, Eye, FileText, Check, ChevronRight, Save } from 'lucide-react';

interface NotesEditorProps {
  notes: StudyNote[];
  onAddNote: (note: Omit<StudyNote, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (note: StudyNote) => void;
  onDeleteNote: (id: string) => void;
  recentSubjects: string[];
}

export default function NotesEditor({ notes, onAddNote, onUpdateNote, onDeleteNote, recentSubjects }: NotesEditorProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState<'write' | 'preview'>('write');

  // New Note creation state
  const [showCreator, setShowCreator] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // Selected note extraction
  const activeNote = notes.find(n => n.id === selectedNoteId);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    onAddNote({
      title: newTitle,
      subject: newSubject,
      content: `# ${newTitle}\n\nWrite your concepts, formulas, and deep study summaries here. Supports basic text outline structure.`,
      checklist: []
    });

    setNewTitle('');
    setShowCreator(false);
  };

  const handleContentChange = (content: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      content,
      updatedAt: new Date().toISOString()
    });
  };

  const handleTitleChange = (title: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      title,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSubjectChange = (subject: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      subject,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddChecklistItem = () => {
    if (!activeNote) return;
    const newItem = { id: Math.random().toString(), text: 'New to-do formula', done: false };
    onUpdateNote({
      ...activeNote,
      checklist: [...activeNote.checklist, newItem],
      updatedAt: new Date().toISOString()
    });
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      checklist: activeNote.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      checklist: activeNote.checklist.filter(item => item.id !== itemId),
      updatedAt: new Date().toISOString()
    });
  };

  const handleChecklistTextChange = (itemId: string, text: string) => {
    if (!activeNote) return;
    onUpdateNote({
      ...activeNote,
      checklist: activeNote.checklist.map(item => item.id === itemId ? { ...item, text } : item),
      updatedAt: new Date().toISOString()
    });
  };

  // Simple Markdown Parser representation for visual outline renders
  const renderMarkdownText = (markdown: string) => {
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-2 mt-4 mb-2">{line.replace('# ', '')}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-1.5">{line.replace('## ', '')}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-3 mb-1">{line.replace('### ', '')}</h3>;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc text-sm text-zinc-700 dark:text-zinc-300 py-0.5">{line.substring(2)}</li>;
      } else if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed py-1">{line}</p>;
    });
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="notes-notebook-panel" className="max-w-6xl mx-auto bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[24px] shadow-2xl overflow-hidden h-[calc(100vh-220px)] min-h-[500px] flex">
      
      {/* 1. Left Sidebar: Notes Navigator List */}
      <div className="w-1/3 border-r border-white/5 flex flex-col h-full bg-white/5">
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Study Notebook</h3>
            <button
              onClick={() => setShowCreator(!showCreator)}
              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
              title="Create New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chapters or topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white pl-9 pr-3.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Note creator drawer/input */}
        {showCreator && (
          <form onSubmit={handleCreateNote} className="p-4 border-b border-indigo-500/10 bg-indigo-500/5 space-y-3">
            <input
              type="text"
              placeholder="Note Title (e.g. Current Density)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            />
            <input
              type="text"
              placeholder="Subject (e.g. Physics)"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => setShowCreator(false)}
                className="px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:underline cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Notes Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-slate-500 space-y-1">
              <FileText className="w-10 h-10 mx-auto stroke-[1.5]" />
              <p className="text-xs">No study notes found.</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setEditMode('write');
                }}
                className={`w-full text-left p-4 flex justify-between items-start transition-all cursor-pointer ${
                  selectedNoteId === note.id 
                    ? 'bg-white/10 border-l-4 border-indigo-500 shadow-md' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="space-y-1 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-white truncate">{note.title}</h4>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                    {note.subject}
                  </span>
                  <p className="text-[10px] text-slate-400 truncate mt-1">
                    {note.content.substring(0, 60).replace(/[#*`\n]/g, '')}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 self-center" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Right Workspace Panel: Editing & Previews */}
      <div className="flex-1 flex flex-col h-full bg-transparent">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Toolbar Header */}
            <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between bg-white/5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none truncate"
                  title="Rename Title"
                />
                <input
                  type="text"
                  value={activeNote.subject}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="text-xs font-semibold text-slate-400 bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none w-24 truncate"
                  title="Rename Subject"
                />
              </div>

              {/* Editing Mode Selectors & Destruct button */}
              <div className="flex items-center gap-2">
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setEditMode('write')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      editMode === 'write' ? 'bg-white/10 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editor
                  </button>
                  <button
                    onClick={() => setEditMode('preview')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      editMode === 'preview' ? 'bg-white/10 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this study note?')) {
                      onDeleteNote(activeNote.id);
                      setSelectedNoteId(notes.find(n => n.id !== activeNote.id)?.id || null);
                    }
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Grid for checklists and text body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Markdown content input/view */}
              <div className="md:col-span-2 h-full flex flex-col space-y-4">
                {editMode === 'write' ? (
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Markdown Content Editor</label>
                    <textarea
                      value={activeNote.content}
                      onChange={e => handleContentChange(e.target.value)}
                      className="flex-1 w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[300px] text-white"
                      placeholder="# Markdown Header 1&#10;## Section Title&#10;- Bullet points&#10;Type formulas and notes..."
                    />
                  </div>
                ) : (
                  <div className="flex-1 border border-white/10 p-6 rounded-xl bg-white/5 min-h-[300px] prose dark:prose-invert max-w-none">
                    <label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block border-b border-white/5 pb-1 mb-3">Live Rendered Document</label>
                    {renderMarkdownText(activeNote.content)}
                  </div>
                )}
              </div>

              {/* Right Column: Checklists & Meta */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl h-fit space-y-4 self-start">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Formulas / Checklists</h4>
                  <button
                    onClick={handleAddChecklistItem}
                    className="text-[10px] font-extrabold text-indigo-400 hover:underline cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeNote.checklist.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No checkbox items added yet.</p>
                  ) : (
                    activeNote.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <button
                          onClick={() => handleToggleChecklist(item.id)}
                          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-indigo-400"
                        >
                          {item.done ? (
                            <div className="w-3.5 h-3.5 rounded bg-indigo-500 flex items-center justify-center text-white text-[10px]">✓</div>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded border border-white/20" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => handleChecklistTextChange(item.id, e.target.value)}
                          className={`flex-1 text-xs bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none ${
                            item.done ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        />
                        <button
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-1.5 text-[10px] text-slate-500 font-bold">
                  <p>Last Sync: {new Date(activeNote.updatedAt).toLocaleString()}</p>
                  <p className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Cloud Autosaved
                  </p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-500 space-y-3">
            <FileText className="w-16 h-16 stroke-[1.2]" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-300">No Note Selected</h4>
              <p className="text-xs max-w-sm">Create a new study note on the sidebar to record formulas, ideas, and curriculum frameworks.</p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm shadow-indigo-500/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Start Notebook
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
