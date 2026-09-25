import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSsh } from '../context/SshContext';
import { Server } from '../types/ssh';
import { parseAnsiToSpans, TERMINAL_THEMES } from '../utils/ansi';
import { getSuggestions, CommandSuggestion } from '../utils/commandSuggestions';
import { SnippetsDrawer } from './SnippetsDrawer';
import { TermiusAccessoryBar } from './TermiusAccessoryBar';
import {
  Terminal as TerminalIcon,
  Search,
  Sparkles,
  Plus,
  X,
  ChevronRight,
  Download,
  Sliders,
  ChevronDown,
  Check,
  Copy,
  Trash2,
  Power,
  RefreshCw,
} from 'lucide-react';

export const TerminalView: React.FC = () => {
  const {
    servers,
    activeServer,
    setActiveServer,
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    closeSession,
    switchSession,
    sendSessionData,
    sendSessionCommand,
    clearSession,
    reconnectSession,
    terminalSettings,
    updateTerminalSettings,
    showToast,
  } = useSsh();

  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number>(0);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  // Sticky modifier keys
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTheme = TERMINAL_THEMES[terminalSettings.themeId] || TERMINAL_THEMES['termius-dark'];

  // Seed default session with quantura-bot output matching user screenshot if empty
  useEffect(() => {
    if (sessions.length === 0 && activeServer) {
      createSession(activeServer).then(sessId => {
        // If it's the bot server, seed initial buffer lines matching screenshot
        if (activeServer.id === 'demo-bot-srv') {
          setTimeout(() => {
            sendSessionData(sessId, 'pm2 logs quantura-bot\r');
          }, 300);
        }
      });
    }
  }, [sessions.length, activeServer]);

  // Auto-scroll to bottom on incoming terminal lines
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.lines, inputVal]);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId, activeSession?.isConnected]);

  // Dynamic suggestions for current input
  const suggestions = useMemo(() => {
    if (!terminalSettings.enableAutosuggestions || !inputVal.trim()) return [];
    return getSuggestions(inputVal, activeSession?.history || []);
  }, [inputVal, activeSession?.history, terminalSettings.enableAutosuggestions]);

  useEffect(() => {
    setSelectedSuggestionIdx(0);
  }, [inputVal]);

  // Ghost autocomplete text (top match continuation)
  const ghostText = useMemo(() => {
    if (!terminalSettings.enableAutosuggestions || suggestions.length === 0 || !inputVal) return '';
    const topMatch = suggestions[0].text;
    if (topMatch.toLowerCase().startsWith(inputVal.toLowerCase())) {
      return topMatch.slice(inputVal.length);
    }
    return '';
  }, [suggestions, inputVal, terminalSettings.enableAutosuggestions]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSession) return;

    if (inputVal) {
      sendSessionCommand(activeSession.id, inputVal);
      setInputVal('');
      setSelectedSuggestionIdx(0);
    } else {
      // Empty enter -> send newline
      sendSessionData(activeSession.id, '\r');
    }
    inputRef.current?.focus();
  };

  const applySuggestion = (s: CommandSuggestion) => {
    setInputVal(s.text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Autocomplete navigation
    if (suggestions.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[selectedSuggestionIdx]) {
          applySuggestion(suggestions[selectedSuggestionIdx]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setInputVal('');
        return;
      }
    }

    // Direct Ctrl shortcuts
    if (e.ctrlKey) {
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (activeSession) sendSessionData(activeSession.id, '\x03');
        setInputVal('');
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (activeSession) clearSession(activeSession.id);
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (activeSession) sendSessionData(activeSession.id, '\x04');
        return;
      }
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (activeSession) sendSessionData(activeSession.id, '\x1a');
        return;
      }
    }

    // Normal command history navigation
    if (e.key === 'ArrowUp' && (!suggestions.length || e.altKey)) {
      e.preventDefault();
      const history = activeSession?.history || [];
      if (history.length > 0) {
        setInputVal(history[0]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (activeSession) {
        sendSessionData(activeSession.id, '\t');
      }
    }
  };

  const handleSendKey = (keySeq: string) => {
    if (!activeSession) return;
    let data = keySeq;

    if (ctrlActive) {
      if (keySeq.length === 1) {
        const code = keySeq.toUpperCase().charCodeAt(0) - 64;
        if (code > 0 && code <= 26) {
          data = String.fromCharCode(code);
        }
      }
      setCtrlActive(false);
    }

    if (altActive) {
      data = '\x1b' + keySeq;
      setAltActive(false);
    }

    sendSessionData(activeSession.id, data);
    inputRef.current?.focus();
  };

  const handleInsertText = (text: string) => {
    setInputVal(prev => prev + text);
    inputRef.current?.focus();
  };

  const handleCopyBuffer = () => {
    if (!activeSession) return;
    const fullText = activeSession.lines.join('');
    const clean = fullText.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    navigator.clipboard.writeText(clean);
    setCopied(true);
    showToast('Terminal output copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLog = () => {
    if (!activeSession) return;
    const clean = activeSession.lines.join('').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    const blob = new Blob([clean], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${activeSession.serverName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Session log exported', 'success');
  };

  const handleNewSession = (server: Server) => {
    createSession(server);
    setIsServerDropdownOpen(false);
  };

  // Derive prompt string
  const currentPrompt = useMemo(() => {
    if (!activeSession) return 'root@server:~# ';
    const user = activeSession.username || 'root';
    const host = activeSession.host?.split('.')[0] || activeSession.serverName || 'server';
    return `${user}@${host}:~/bot# `;
  }, [activeSession]);

  if (sessions.length === 0 && !activeServer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-100">
        <TerminalIcon className="w-12 h-12 text-slate-500 mb-3" />
        <h3 className="text-base font-semibold mb-1">No SSH Host Selected</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Select an SSH server from your hosts list or create a new session.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
      className="flex-1 flex flex-col h-full overflow-hidden font-mono select-text transition-colors duration-150 relative"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground,
      }}
    >
      {/* 1. Top Session Tab Bar */}
      <div
        className="h-10 border-b flex items-center justify-between px-2 shrink-0 select-none z-20"
        style={{
          backgroundColor: `${currentTheme.background}fa`,
          borderColor: `${currentTheme.brightBlack}30`,
        }}
      >
        {/* Session Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 pr-2">
          {sessions.map(sess => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => switchSession(sess.id)}
                className={`group flex items-center gap-2 px-2.5 py-1 rounded-md text-xs cursor-pointer transition-all border shrink-0 max-w-[190px] ${
                  isActive ? 'font-semibold shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isActive ? `${currentTheme.selection}` : 'transparent',
                  borderColor: isActive ? currentTheme.cursor : 'transparent',
                  color: isActive ? currentTheme.foreground : currentTheme.brightBlack,
                }}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    sess.isConnected
                      ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                      : sess.isConnecting
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="truncate text-[11px] font-sans">{sess.title}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    closeSession(sess.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-opacity"
                  title="Close session"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* New Session Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
              className="p-1 rounded-md border text-xs flex items-center gap-1 opacity-80 hover:opacity-100 hover:bg-slate-800 transition-colors"
              style={{ borderColor: `${currentTheme.brightBlack}50` }}
              title="New session"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] hidden sm:inline font-sans">New Tab</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isServerDropdownOpen && (
              <div
                className="absolute left-0 top-8 w-56 rounded-xl border shadow-2xl p-1.5 z-50 text-xs font-sans"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.brightBlack,
                }}
              >
                <div className="px-2 py-1 text-[10px] text-slate-400 uppercase font-semibold">
                  Launch Host Session
                </div>
                {servers.map(srv => (
                  <button
                    key={srv.id}
                    onClick={() => handleNewSession(srv)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500/15 hover:text-sky-400 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate">
                      <p className="font-semibold truncate">{srv.name}</p>
                      <p className="text-[10px] opacity-70 font-mono">{srv.username}@{srv.host}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: Snippets, Search, Theme, Clear */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsSnippetsOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-sans font-medium transition-colors cursor-pointer"
            title="Termius Snippets"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden md:inline text-[11px]">Snippets</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-1 rounded text-slate-400 hover:text-slate-200 transition-colors ${
              isSearchOpen ? 'bg-sky-500 text-white' : 'hover:bg-slate-800'
            }`}
            title="Search buffer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Theme settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {isThemeDropdownOpen && (
              <div
                className="absolute right-0 top-8 w-56 rounded-xl border shadow-2xl p-2 z-50 text-xs font-sans"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.brightBlack,
                }}
              >
                <div className="px-2 py-1 text-[10px] text-slate-400 uppercase font-semibold">
                  Theme Palette
                </div>
                {Object.values(TERMINAL_THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      updateTerminalSettings({ themeId: t.id });
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      terminalSettings.themeId === t.id ? 'bg-sky-500 text-white font-semibold' : 'hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.cursor }} />
                      {t.name.split(' ')[0]}
                    </span>
                    {terminalSettings.themeId === t.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCopyBuffer}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Copy buffer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => activeSession && clearSession(activeSession.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {activeSession?.isConnected ? (
            <button
              onClick={() => closeSession(activeSession.id)}
              className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Disconnect"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => activeSession && reconnectSession(activeSession.id)}
              className="p-1 rounded text-sky-400 hover:bg-sky-500/20 transition-colors"
              title="Reconnect"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activeSession?.isConnecting ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Bar */}
      {isSearchOpen && (
        <div
          className="px-3 py-1.5 border-b flex items-center gap-2 select-none z-20 shrink-0"
          style={{
            backgroundColor: `${currentTheme.background}fa`,
            borderColor: `${currentTheme.brightBlack}40`,
          }}
        >
          <Search className="w-3.5 h-3.5 text-sky-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search terminal logs..."
            className="flex-1 bg-transparent text-xs outline-none font-mono"
            style={{ color: currentTheme.foreground }}
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Fullscreen Terminal Canvas (Exact Termius Android View) */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 text-xs leading-relaxed space-y-0.5 cursor-text select-text relative"
        style={{
          fontSize: `${terminalSettings.fontSize}px`,
          lineHeight: terminalSettings.lineHeight,
        }}
      >
        {activeSession?.lines.map((chunk, idx) => (
          <span key={idx} className="whitespace-pre-wrap break-all">
            {parseAnsiToSpans(chunk, terminalSettings.themeId, searchQuery)}
          </span>
        ))}

        {/* Live Interactive Prompt Line (Matching Screenshot) */}
        <div className="flex items-center flex-wrap pt-0.5 relative">
          {/* Cyan Prompt Text: root@vmi3603177:~/bot# */}
          <span className="text-[#22d3ee] font-mono font-semibold select-none mr-1.5">
            {currentPrompt}
          </span>

          {/* User Typed Text + Ghost Suggestion + Block Cursor */}
          <div className="inline-flex items-center relative font-mono">
            <span className="text-[#f1f5f9] whitespace-pre">{inputVal}</span>

            {/* Ghost Autocomplete Text (Fish / Zsh / Termius style) */}
            {ghostText && inputVal && (
              <span className="text-slate-500 whitespace-pre pointer-events-none select-none">
                {ghostText}
              </span>
            )}

            {/* Termius Solid Emerald Block Cursor (Matching Screenshot) */}
            <span
              className="inline-block w-2.5 h-4 ml-0.5 align-middle animate-pulse"
              style={{
                backgroundColor: currentTheme.green || '#22c55e',
              }}
            />
          </div>
        </div>

        <div ref={terminalEndRef} />
      </div>

      {/* Hidden real input for keyboard focus */}
      <input
        ref={inputRef}
        type="text"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute pointer-events-none w-0 h-0"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* 4. Termius Intelligent Autocomplete & Suggestions Box (Floating above keyboard bar) */}
      {suggestions.length > 0 && (
        <div
          className="mx-2 mb-1.5 rounded-xl border shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none"
          style={{
            backgroundColor: `${currentTheme.background}fa`,
            borderColor: `${currentTheme.cursor}60`,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            className="px-3 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider flex items-center justify-between border-b"
            style={{
              backgroundColor: `${currentTheme.selection}`,
              borderColor: `${currentTheme.brightBlack}40`,
              color: currentTheme.cursor,
            }}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Termius Suggestions ({suggestions.length})</span>
            </span>
            <span className="text-[9px] opacity-70 font-mono">
              [Tab] Accept · [↑↓] Navigate
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/40">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedSuggestionIdx;
              return (
                <div
                  key={`${item.text}-${idx}`}
                  onClick={() => applySuggestion(item)}
                  onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                  className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'shadow-inner' : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${currentTheme.cursor}25` : 'transparent',
                    borderLeft: isSelected ? `3px solid ${currentTheme.cursor}` : '3px solid transparent',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#22d3ee]">
                        {item.text}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded font-sans uppercase font-medium"
                        style={{
                          backgroundColor: `${currentTheme.selection}`,
                          color: item.category === 'history' ? currentTheme.yellow : currentTheme.green,
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans opacity-70 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-60 text-[10px] font-mono shrink-0">
                    <span>Tab ⇥</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Exact Termius Mobile Accessory Bar (From User Screenshot) */}
      <TermiusAccessoryBar
        onOpenSnippets={() => setIsSnippetsOpen(true)}
        onSendKey={handleSendKey}
        onInsertText={handleInsertText}
        ctrlActive={ctrlActive}
        setCtrlActive={setCtrlActive}
        altActive={altActive}
        setAltActive={setAltActive}
      />

      {/* Termius Snippets Drawer */}
      <SnippetsDrawer
        isOpen={isSnippetsOpen}
        onClose={() => setIsSnippetsOpen(false)}
        onInsertToPrompt={cmd => {
          setInputVal(cmd);
          inputRef.current?.focus();
        }}
      />
    </div>
  );
};
