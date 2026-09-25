import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Server,
  SftpFile,
  ThemeMode,
  DeviceViewMode,
  TerminalSettings,
  SecuritySettings,
  TerminalSession,
} from '../types/ssh';
import { encryptSecret, decryptSecret } from '../utils/crypto';
import { TERMIUS_DEFAULT_SNIPPETS, TermiusSnippet } from '../utils/commandSuggestions';

interface SshContextType {
  servers: Server[];
  activeServer: Server | null;
  activeTab: 'servers' | 'terminal' | 'sftp' | 'settings' | 'codebase';
  themeMode: ThemeMode;
  deviceMode: DeviceViewMode;
  terminalSettings: TerminalSettings;
  securitySettings: SecuritySettings;
  isLocked: boolean;

  // Multi-session Terminal State (Termius-grade)
  sessions: TerminalSession[];
  activeSessionId: string | null;
  activeSession: TerminalSession | null;
  snippets: TermiusSnippet[];

  // SFTP state
  sftpPath: string;
  sftpFiles: SftpFile[];
  sftpLoading: boolean;
  sftpError: string | null;

  // Actions
  setActiveServer: (server: Server | null) => void;
  setActiveTab: (tab: 'servers' | 'terminal' | 'sftp' | 'settings' | 'codebase') => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDeviceMode: (mode: DeviceViewMode) => void;
  updateTerminalSettings: (settings: Partial<TerminalSettings>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  unlockApp: () => void;
  lockApp: () => void;

  saveServer: (serverData: Omit<Server, 'createdAt' | 'updatedAt' | 'status'>, secret: string, passphrase?: string) => Promise<Server>;
  deleteServer: (id: string) => void;
  testServerConnection: (server: Server, secret: string, passphrase?: string) => Promise<{ success: boolean; latencyMs?: number; error?: string }>;

  // Termius Multi-Session Operations
  createSession: (server: Server) => Promise<string>;
  closeSession: (sessionId: string) => void;
  switchSession: (sessionId: string) => void;
  sendSessionData: (sessionId: string, data: string) => void;
  sendSessionCommand: (sessionId: string, command: string) => void;
  clearSession: (sessionId: string) => void;
  reconnectSession: (sessionId: string) => Promise<void>;

  // Snippets
  saveSnippet: (snippet: TermiusSnippet) => void;
  deleteSnippet: (id: string) => void;
  runSnippet: (sessionId: string, snippet: TermiusSnippet) => void;

  // SFTP operations
  loadSftpDirectory: (server: Server, dirPath?: string) => Promise<void>;
  readSftpFile: (server: Server, filePath: string) => Promise<string>;
  writeSftpFile: (server: Server, filePath: string, content: string) => Promise<void>;
  sftpOperation: (server: Server, operation: 'mkdir' | 'delete' | 'rename', targetPath: string, newPath?: string) => Promise<void>;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SshContext = createContext<SshContextType | null>(null);

const DEFAULT_SERVERS: Server[] = [
  {
    id: 'demo-bot-srv',
    name: 'vmi3603177 (Quantura Trading Bot)',
    host: 'vmi3603177.contaboserver.net',
    port: 22,
    username: 'root',
    authType: 'PASSWORD',
    secretEncrypted: '',
    tags: ['Production', 'TradingBot', 'NodeJS', 'PM2'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    status: 'CONNECTED',
    osInfo: 'Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0 x86_64)',
    lastLatencyMs: 14,
  },
  {
    id: 'demo-prod-srv',
    name: 'Production Web Gateway',
    host: 'demo.termpulse.internal',
    port: 22,
    username: 'root',
    authType: 'PASSWORD',
    secretEncrypted: '',
    tags: ['Production', 'Ubuntu', 'Docker', 'PM2'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    status: 'DISCONNECTED',
    osInfo: 'Ubuntu 24.04.1 LTS (x86_64)',
    lastLatencyMs: 24,
  },
  {
    id: 'demo-db-srv',
    name: 'Staging PostgreSQL Node',
    host: 'staging-db.termpulse.internal',
    port: 2222,
    username: 'deploy',
    authType: 'PRIVATE_KEY',
    secretEncrypted: '',
    tags: ['Staging', 'Database', 'PostgreSQL'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 7200000,
    status: 'DISCONNECTED',
    osInfo: 'Debian GNU/Linux 12 (bookworm)',
    lastLatencyMs: 38,
  },
];

export const SshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [servers, setServers] = useState<Server[]>(() => {
    try {
      const saved = localStorage.getItem('termpulse_servers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SERVERS;
  });

  const [activeServer, setActiveServer] = useState<Server | null>(DEFAULT_SERVERS[0]);
  const [activeTab, setActiveTab] = useState<'servers' | 'terminal' | 'sftp' | 'settings' | 'codebase'>('servers');
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('termpulse_theme') as ThemeMode) || 'DARK';
  });
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode>('FULLSCREEN');

  const [terminalSettings, setTerminalSettings] = useState<TerminalSettings>(() => {
    try {
      const saved = localStorage.getItem('termpulse_terminal_settings_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fontSize: 13,
      lineHeight: 1.45,
      scrollbackLines: 10000,
      cursorStyle: 'block',
      fontFamily: 'JetBrains Mono, monospace',
      themeId: 'termius-dark',
      enableAutosuggestions: true,
      soundBell: false,
      copyOnSelect: true,
    };
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    try {
      const saved = localStorage.getItem('termpulse_security_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      biometricLock: false,
      autoLockMinutes: 10,
      clearClipboardOnExit: true,
    };
  });

  const [snippets, setSnippets] = useState<TermiusSnippet[]>(() => {
    try {
      const saved = localStorage.getItem('termpulse_snippets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return TERMIUS_DEFAULT_SNIPPETS;
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Termius Multi-Session WebSocket map
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionSocketsRef = useRef<Map<string, WebSocket>>(new Map());

  // SFTP state
  const [sftpPath, setSftpPath] = useState<string>('/root');
  const [sftpFiles, setSftpFiles] = useState<SftpFile[]>([]);
  const [sftpLoading, setSftpLoading] = useState<boolean>(false);
  const [sftpError, setSftpError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Sync servers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('termpulse_servers', JSON.stringify(servers));
    } catch (e) {
      console.error('Failed to persist servers:', e);
    }
  }, [servers]);

  // Sync snippets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('termpulse_snippets', JSON.stringify(snippets));
    } catch (e) {
      console.error('Failed to persist snippets:', e);
    }
  }, [snippets]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('termpulse_theme', mode);
  }, []);

  const updateTerminalSettings = useCallback((newSettings: Partial<TerminalSettings>) => {
    setTerminalSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('termpulse_terminal_settings_v2', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSecuritySettings = useCallback((newSettings: Partial<SecuritySettings>) => {
    setSecuritySettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('termpulse_security_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unlockApp = useCallback(() => setIsLocked(false), []);
  const lockApp = useCallback(() => setIsLocked(true), []);

  const saveSnippet = useCallback((snippet: TermiusSnippet) => {
    setSnippets(prev => {
      const idx = prev.findIndex(s => s.id === snippet.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = snippet;
        return next;
      }
      return [snippet, ...prev];
    });
    showToast(`Snippet "${snippet.title}" saved`, 'success');
  }, [showToast]);

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
    showToast('Snippet deleted', 'info');
  }, [showToast]);

  // Save server with AES-GCM encrypted secret
  const saveServer = useCallback(async (
    serverData: Omit<Server, 'createdAt' | 'updatedAt' | 'status'>,
    secret: string,
    passphrase?: string
  ): Promise<Server> => {
    const secretEncrypted = secret ? await encryptSecret(secret) : serverData.secretEncrypted;
    const passphraseEncrypted = passphrase ? await encryptSecret(passphrase) : serverData.passphraseEncrypted;

    const existingIndex = servers.findIndex(s => s.id === serverData.id);
    const now = Date.now();

    let updatedServer: Server;
    if (existingIndex >= 0) {
      updatedServer = {
        ...servers[existingIndex],
        ...serverData,
        secretEncrypted,
        passphraseEncrypted,
        updatedAt: now,
      };
      setServers(prev => prev.map((s, idx) => (idx === existingIndex ? updatedServer : s)));
      showToast(`Server "${updatedServer.name}" updated`, 'success');
    } else {
      updatedServer = {
        ...serverData,
        secretEncrypted,
        passphraseEncrypted,
        createdAt: now,
        updatedAt: now,
        status: 'DISCONNECTED',
      };
      setServers(prev => [updatedServer, ...prev]);
      showToast(`Server "${updatedServer.name}" added to vault`, 'success');
    }

    if (activeServer?.id === updatedServer.id) {
      setActiveServer(updatedServer);
    }

    return updatedServer;
  }, [servers, activeServer, showToast]);

  const deleteServer = useCallback((id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
    if (activeServer?.id === id) {
      setActiveServer(servers.find(s => s.id !== id) || null);
    }
    showToast('Server deleted from vault', 'info');
  }, [activeServer, servers, showToast]);

  const testServerConnection = useCallback(async (
    server: Server,
    secret: string,
    passphrase?: string
  ): Promise<{ success: boolean; latencyMs?: number; error?: string }> => {
    try {
      const res = await fetch('/api/ssh/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.authType === 'PASSWORD' ? secret : undefined,
          privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
          passphrase,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, latencyMs: data.latencyMs };
      }
      return { success: false, error: data.error || 'Connection failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network request failed' };
    }
  }, []);

  const resolveCredentials = async (server: Server): Promise<{ secret: string; passphrase?: string }> => {
    let secret = '';
    let passphrase = '';
    if (server.secretEncrypted) {
      secret = await decryptSecret(server.secretEncrypted);
    }
    if (server.passphraseEncrypted) {
      passphrase = await decryptSecret(server.passphraseEncrypted);
    }
    return { secret, passphrase };
  };

  // Termius Multi-Session WebSocket Engine
  const createSession = useCallback(async (server: Server): Promise<string> => {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSession: TerminalSession = {
      id: sessionId,
      serverId: server.id,
      title: `${server.username}@${server.name}`,
      serverName: server.name,
      username: server.username,
      host: server.host,
      port: server.port,
      lines: [`\x1b[90mConnecting to ${server.username}@${server.host}:${server.port}...\x1b[0m\r\n`],
      isConnected: false,
      isConnecting: true,
      error: null,
      history: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);
    setActiveServer(server);
    setActiveTab('terminal');

    // Connect WebSocket
    const { secret, passphrase } = await resolveCredentials(server);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ssh`;

    try {
      const ws = new WebSocket(wsUrl);
      sessionSocketsRef.current.set(sessionId, ws);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connect',
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.authType === 'PASSWORD' ? secret : undefined,
          privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
          passphrase,
          cols: 100,
          rows: 35,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status') {
            if (msg.status === 'connected') {
              setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s,
                isConnected: true,
                isConnecting: false,
                lines: [...s.lines, `\x1b[32m✔ SSH2 Tunnel Established.\x1b[0m\r\n`],
              } : s));
              setServers(prev => prev.map(s => s.id === server.id ? { ...s, lastConnectedAt: Date.now(), status: 'CONNECTED' } : s));
            } else if (msg.status === 'disconnected') {
              setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s,
                isConnected: false,
                isConnecting: false,
                lines: [...s.lines, `\r\n\x1b[33m[Connection closed by remote]\x1b[0m\r\n`],
              } : s));
            }
          } else if (msg.type === 'data') {
            setSessions(prev => prev.map(s => s.id === sessionId ? {
              ...s,
              isConnected: true,
              isConnecting: false,
              lines: [...s.lines, msg.data],
              lastActiveAt: Date.now(),
            } : s));
          } else if (msg.type === 'error') {
            setSessions(prev => prev.map(s => s.id === sessionId ? {
              ...s,
              isConnected: false,
              isConnecting: false,
              error: msg.error,
              lines: [...s.lines, `\r\n\x1b[31m[SSH Error]: ${msg.error}\x1b[0m\r\n`],
            } : s));
          }
        } catch {
          setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            lines: [...s.lines, event.data],
          } : s));
        }
      };

      ws.onerror = () => {
        setSessions(prev => prev.map(s => s.id === sessionId ? {
          ...s,
          isConnected: false,
          isConnecting: false,
          error: 'WebSocket connection failed',
        } : s));
      };

      ws.onclose = () => {
        setSessions(prev => prev.map(s => s.id === sessionId ? {
          ...s,
          isConnected: false,
          isConnecting: false,
        } : s));
      };
    } catch (err: any) {
      setSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        isConnected: false,
        isConnecting: false,
        error: err.message,
      } : s));
    }

    return sessionId;
  }, [servers, showToast]);

  const closeSession = useCallback((sessionId: string) => {
    const ws = sessionSocketsRef.current.get(sessionId);
    if (ws) {
      try { ws.close(); } catch {}
      sessionSocketsRef.current.delete(sessionId);
    }

    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });
  }, [activeSessionId]);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      const matchingServer = servers.find(srv => srv.id === sess.serverId);
      if (matchingServer) setActiveServer(matchingServer);
    }
  }, [sessions, servers]);

  const sendSessionData = useCallback((sessionId: string, data: string) => {
    const ws = sessionSocketsRef.current.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'data', data }));
    }
  }, []);

  const sendSessionCommand = useCallback((sessionId: string, command: string) => {
    sendSessionData(sessionId, command + '\r');
    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      history: [command, ...s.history.filter(h => h !== command).slice(0, 49)],
    } : s));
  }, [sendSessionData]);

  const clearSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, lines: [] } : s));
  }, []);

  const reconnectSession = useCallback(async (sessionId: string) => {
    const sess = sessions.find(s => s.id === sessionId);
    if (!sess) return;
    const server = servers.find(srv => srv.id === sess.serverId) || activeServer;
    if (!server) return;

    // Close existing socket
    const existingWs = sessionSocketsRef.current.get(sessionId);
    if (existingWs) {
      try { existingWs.close(); } catch {}
      sessionSocketsRef.current.delete(sessionId);
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      isConnecting: true,
      isConnected: false,
      error: null,
      lines: [...s.lines, `\r\n\x1b[90mReconnecting to ${server.username}@${server.host}...\x1b[0m\r\n`],
    } : s));

    const { secret, passphrase } = await resolveCredentials(server);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ssh`;

    try {
      const ws = new WebSocket(wsUrl);
      sessionSocketsRef.current.set(sessionId, ws);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connect',
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.authType === 'PASSWORD' ? secret : undefined,
          privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
          passphrase,
          cols: 100,
          rows: 35,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status') {
            if (msg.status === 'connected') {
              setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s,
                isConnected: true,
                isConnecting: false,
                lines: [...s.lines, `\x1b[32m✔ SSH2 Tunnel Re-established.\x1b[0m\r\n`],
              } : s));
            } else if (msg.status === 'disconnected') {
              setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s,
                isConnected: false,
                isConnecting: false,
              } : s));
            }
          } else if (msg.type === 'data') {
            setSessions(prev => prev.map(s => s.id === sessionId ? {
              ...s,
              isConnected: true,
              isConnecting: false,
              lines: [...s.lines, msg.data],
            } : s));
          } else if (msg.type === 'error') {
            setSessions(prev => prev.map(s => s.id === sessionId ? {
              ...s,
              isConnected: false,
              isConnecting: false,
              error: msg.error,
              lines: [...s.lines, `\r\n\x1b[31m[SSH Error]: ${msg.error}\x1b[0m\r\n`],
            } : s));
          }
        } catch {
          setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            lines: [...s.lines, event.data],
          } : s));
        }
      };

      ws.onclose = () => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isConnected: false, isConnecting: false } : s));
      };
    } catch (err: any) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isConnected: false, isConnecting: false, error: err.message } : s));
    }
  }, [sessions, servers, activeServer]);

  const runSnippet = useCallback((sessionId: string, snippet: TermiusSnippet) => {
    sendSessionCommand(sessionId, snippet.command);
    showToast(`Executed snippet: ${snippet.title}`, 'info');
  }, [sendSessionCommand, showToast]);

  // SFTP Operations
  const loadSftpDirectory = useCallback(async (server: Server, dirPath: string = '/root') => {
    setSftpLoading(true);
    setSftpError(null);
    setSftpPath(dirPath);

    const { secret, passphrase } = await resolveCredentials(server);

    try {
      const res = await fetch('/api/sftp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.authType === 'PASSWORD' ? secret : undefined,
          privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
          passphrase,
          remotePath: dirPath,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSftpFiles(data.files || []);
        setSftpPath(data.currentPath || dirPath);
      } else {
        setSftpError(data.error || 'Failed to list directory');
        showToast(data.error || 'SFTP listing failed', 'error');
      }
    } catch (e: any) {
      setSftpError(e.message || 'Network request failed');
      showToast(e.message || 'Network error', 'error');
    } finally {
      setSftpLoading(false);
    }
  }, [showToast]);

  const readSftpFile = useCallback(async (server: Server, filePath: string): Promise<string> => {
    const { secret, passphrase } = await resolveCredentials(server);
    const res = await fetch('/api/sftp/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.authType === 'PASSWORD' ? secret : undefined,
        privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
        passphrase,
        filePath,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data.content || '';
    }
    throw new Error(data.error || 'Failed to read file');
  }, []);

  const writeSftpFile = useCallback(async (server: Server, filePath: string, content: string): Promise<void> => {
    const { secret, passphrase } = await resolveCredentials(server);
    const res = await fetch('/api/sftp/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.authType === 'PASSWORD' ? secret : undefined,
        privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
        passphrase,
        filePath,
        content,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save file');
    }
    showToast('File saved successfully via SFTP', 'success');
  }, [showToast]);

  const sftpOperation = useCallback(async (
    server: Server,
    operation: 'mkdir' | 'delete' | 'rename',
    targetPath: string,
    newPath?: string
  ): Promise<void> => {
    const { secret, passphrase } = await resolveCredentials(server);
    const res = await fetch('/api/sftp/operation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.authType === 'PASSWORD' ? secret : undefined,
        privateKey: server.authType === 'PRIVATE_KEY' ? secret : undefined,
        passphrase,
        operation,
        targetPath,
        newPath,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Operation ${operation} failed`);
    }
    showToast(`SFTP ${operation} succeeded`, 'success');
  }, [showToast]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return (
    <SshContext.Provider
      value={{
        servers,
        activeServer,
        activeTab,
        themeMode,
        deviceMode,
        terminalSettings,
        securitySettings,
        isLocked,
        sessions,
        activeSessionId,
        activeSession,
        snippets,
        sftpPath,
        sftpFiles,
        sftpLoading,
        sftpError,
        setActiveServer,
        setActiveTab,
        setThemeMode,
        setDeviceMode,
        updateTerminalSettings,
        updateSecuritySettings,
        unlockApp,
        lockApp,
        saveServer,
        deleteServer,
        testServerConnection,
        createSession,
        closeSession,
        switchSession,
        sendSessionData,
        sendSessionCommand,
        clearSession,
        reconnectSession,
        saveSnippet,
        deleteSnippet,
        runSnippet,
        loadSftpDirectory,
        readSftpFile,
        writeSftpFile,
        sftpOperation,
        toast,
        showToast,
      }}
    >
      {children}
    </SshContext.Provider>
  );
};

export const useSsh = () => {
  const context = useContext(SshContext);
  if (!context) throw new Error('useSsh must be used within SshProvider');
  return context;
};
