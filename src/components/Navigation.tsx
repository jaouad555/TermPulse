import React from 'react';
import { useSsh } from '../context/SshContext';
import { Server, Terminal, Folder, Settings, Code } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, deviceMode, sessions, themeMode } = useSsh();
  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const hasActiveSession = sessions.some(s => s.isConnected);

  const navItems = [
    { id: 'servers' as const, label: 'Servers', icon: Server },
    {
      id: 'terminal' as const,
      label: 'Terminal',
      icon: Terminal,
      badge: hasActiveSession ? 'ACTIVE' : undefined,
    },
    { id: 'sftp' as const, label: 'SFTP', icon: Folder },
    { id: 'codebase' as const, label: 'Android Code', icon: Code },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  // Mobile Bottom Navigation
  if (deviceMode === 'PHONE') {
    return (
      <nav className={`h-14 border-t flex items-center justify-around px-2 select-none z-30 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive
                  ? 'text-sky-400 font-medium'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.7]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-sky-400" />
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  // Tablet & Fullscreen Navigation Rail
  return (
    <aside className={`w-16 md:w-20 border-r flex flex-col items-center py-4 select-none z-30 shrink-0 ${isDark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex-1 flex flex-col gap-3 w-full px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 font-medium shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight text-center leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
