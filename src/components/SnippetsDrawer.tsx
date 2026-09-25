import React, { useState, useMemo } from 'react';
import { useSsh } from '../context/SshContext';
import { TermiusSnippet } from '../utils/commandSuggestions';
import {
  Sparkles,
  Play,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  Terminal,
  Activity,
  Layers,
  Container,
  RefreshCw,
  Network,
  Globe,
  ShieldAlert,
  GitPullRequest,
  Copy,
} from 'lucide-react';

interface SnippetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToPrompt: (cmd: string) => void;
}

export const SnippetsDrawer: React.FC<SnippetsDrawerProps> = ({ isOpen, onClose, onInsertToPrompt }) => {
  const { snippets, activeSession, runSnippet, saveSnippet, deleteSnippet, showToast, themeMode } = useSsh();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<TermiusSnippet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [command, setCommand] = useState('');
  const [category, setCategory] = useState('Custom');
  const [description, setDescription] = useState('');

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const categories = useMemo(() => {
    const set = new Set<string>();
    snippets.forEach(s => set.add(s.category));
    return Array.from(set);
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.command.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [snippets, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingSnippet(null);
    setTitle('');
    setCommand('');
    setCategory('Custom');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: TermiusSnippet) => {
    setEditingSnippet(s);
    setTitle(s.title);
    setCommand(s.command);
    setCategory(s.category);
    setDescription(s.description);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !command.trim()) {
      showToast('Title and Command are required', 'error');
      return;
    }

    saveSnippet({
      id: editingSnippet?.id || 'snip_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      command: command.trim(),
      category: category.trim() || 'Custom',
      description: description.trim(),
      icon: editingSnippet?.icon || 'Terminal',
    });

    setIsModalOpen(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'system': return Activity;
      case 'docker': return Container;
      case 'node.js': return RefreshCw;
      case 'network': return Network;
      case 'web': return Globe;
      case 'security': return ShieldAlert;
      case 'deployment': return GitPullRequest;
      default: return Terminal;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l animate-in slide-in-from-right-5 duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Snippets & Automation</h2>
              <p className="text-[11px] text-slate-400">1-Click DevOps & Linux Scripts</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenAdd}
              className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Snippet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 border-b border-slate-800/80 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search scripts and commands..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === null
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Snippets List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No snippets matched your search.
            </div>
          ) : (
            filteredSnippets.map(snippet => {
              const Icon = getCategoryIcon(snippet.category);
              return (
                <div
                  key={snippet.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold truncate">{snippet.title}</h4>
                        <span className="text-[10px] text-sky-400 font-mono">#{snippet.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(snippet)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteSnippet(snippet.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">{snippet.description}</p>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto break-all mb-2.5 max-h-20 select-text">
                    {snippet.command}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        onInsertToPrompt(snippet.command);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded text-[11px] text-slate-300 hover:text-slate-100 hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Insert snippet text into command bar"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Insert</span>
                    </button>
                    <button
                      onClick={() => {
                        if (activeSession) {
                          runSnippet(activeSession.id, snippet);
                          onClose();
                        } else {
                          showToast('Connect to a terminal session first', 'error');
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Execute</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Snippet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold mb-3">
              {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Snippet Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Restart Docker Swarm"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="System, Docker, Web, Security..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Command / Script</label>
                <textarea
                  rows={3}
                  required
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  placeholder="uptime && free -m && pm2 status"
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What this automation does"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium"
                >
                  Save Snippet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
