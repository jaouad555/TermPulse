import React, { useState, useMemo } from 'react';
import { useSsh } from '../context/SshContext';
import { Server } from '../types/ssh';
import { Search, Plus, Terminal, Folder, MoreVertical, Activity, Trash2, Edit2, Shield, Key, Lock, ChevronRight, Server as ServerIcon } from 'lucide-react';

interface ServerListProps {
  onAddServer: () => void;
  onEditServer: (server: Server) => void;
}

export const ServerList: React.FC<ServerListProps> = ({ onAddServer, onEditServer }) => {
  const {
    servers,
    activeServer,
    setActiveServer,
    sessions,
    createSession,
    switchSession,
    deleteServer,
    testServerConnection,
    loadSftpDirectory,
    setActiveTab,
    themeMode,
    showToast,
  } = useSsh();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    servers.forEach(s => s.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [servers]);

  // Filtered servers
  const filteredServers = useMemo(() => {
    return servers.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.host.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || s.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [servers, searchQuery, selectedTag]);

  const handleTestPing = async (server: Server, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestingId(server.id);
    const res = await testServerConnection(server, '');
    setTestingId(null);
    if (res.success) {
      showToast(`Ping OK: ${res.latencyMs}ms latency`, 'success');
    } else {
      showToast(`Connection error: ${res.error}`, 'error');
    }
  };

  const handleOpenTerminal = (server: Server, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveServer(server);
    const existing = sessions.find(s => s.serverId === server.id);
    if (existing) {
      switchSession(existing.id);
    } else {
      createSession(server);
    }
    setActiveTab('terminal');
  };

  const handleOpenSftp = (server: Server, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveServer(server);
    loadSftpDirectory(server, '/root');
    setActiveTab('sftp');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header & Search */}
      <div className={`p-4 border-b shrink-0 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SSH Servers</h1>
            <p className="text-xs text-slate-500 font-mono">
              {servers.length} configured {servers.length === 1 ? 'host' : 'hosts'}
            </p>
          </div>
          <button
            onClick={onAddServer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Host</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search servers by name, host, user, tags..."
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border outline-none transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
            }`}
          />
        </div>

        {/* Tag Filters (Segmented Filter Bar - compliant with zero-pill rule) */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedTag === null
                  ? isDark ? 'bg-slate-800 text-sky-400 shadow-sm' : 'bg-white text-sky-600 shadow-sm border border-slate-200'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              All Hosts
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === tag
                    ? isDark ? 'bg-slate-800 text-sky-400 shadow-sm' : 'bg-white text-sky-600 shadow-sm border border-slate-200'
                    : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Server List Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {filteredServers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-slate-700/60">
            <ServerIcon className="w-10 h-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-semibold mb-1">No SSH hosts found</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first host connection to establish interactive SSH shells and SFTP browsing.'}
            </p>
            <button
              onClick={onAddServer}
              className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium shadow-sm hover:bg-sky-400 transition-colors"
            >
              + Add Server Host
            </button>
          </div>
        ) : (
          filteredServers.map(server => {
            const isSelected = activeServer?.id === server.id;
            const isTesting = testingId === server.id;
            const isMenuOpen = openMenuId === server.id;

            return (
              <div
                key={server.id}
                onClick={() => setActiveServer(server)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-900/90 border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-white border-sky-500 shadow-md ring-1 ring-sky-400/30'
                    : isDark
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Connection status indicator */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          server.status === 'CONNECTED'
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse'
                            : server.status === 'CONNECTING'
                            ? 'bg-amber-400 ring-2 ring-amber-400/20'
                            : server.status === 'ERROR'
                            ? 'bg-rose-500'
                            : 'bg-slate-500'
                        }`}
                        title={`Status: ${server.status}`}
                      />
                      <h3 className="font-semibold text-sm truncate">{server.name}</h3>
                      {server.authType === 'PRIVATE_KEY' ? (
                        <span title="Key Authenticated"><Key className="w-3 h-3 text-slate-400 shrink-0" /></span>
                      ) : (
                        <span title="Password Authenticated"><Lock className="w-3 h-3 text-slate-400 shrink-0" /></span>
                      )}
                    </div>

                    {/* Subtitle: user@host:port */}
                    <div className="mt-1 font-mono text-xs text-slate-400 truncate">
                      {server.username}@{server.host}:{server.port}
                    </div>

                    {/* Metadata text without static pill badges */}
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{server.osInfo || 'Linux Host'}</span>
                      {server.lastLatencyMs && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-mono">{server.lastLatencyMs}ms</span>
                        </>
                      )}
                      {server.tags && server.tags.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-sky-400 font-mono">{server.tags.map(t => `#${t}`).join(' ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Context menu button */}
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : server.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className={`absolute right-0 top-6 w-36 rounded-lg border shadow-xl z-50 py-1 text-xs ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <button
                          onClick={e => {
                            setOpenMenuId(null);
                            handleTestPing(server, e);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-sky-500/10 hover:text-sky-400 flex items-center gap-2"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Test Ping</span>
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditServer(server);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-sky-500/10 hover:text-sky-400 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            deleteServer(server.id);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => handleTestPing(server, e)}
                      disabled={isTesting}
                      className="px-2 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 flex items-center gap-1 transition-colors"
                    >
                      <Activity className={`w-3 h-3 ${isTesting ? 'animate-spin text-sky-400' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Ping'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => handleOpenTerminal(server, e)}
                      className="flex items-center gap-1 px-3 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-medium border border-sky-500/30 transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>SSH Shell</span>
                    </button>
                    <button
                      onClick={e => handleOpenSftp(server, e)}
                      className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors"
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>SFTP Files</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
