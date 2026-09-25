import React, { useState, useEffect } from 'react';
import { useSsh } from '../context/SshContext';
import { Smartphone, Tablet, Monitor, Sun, Moon, Shield, Lock, Download, Terminal, Folder, Server as ServerIcon, Code, Settings } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const { deviceMode, setDeviceMode, themeMode, setThemeMode, activeTab, setActiveTab, isLocked, lockApp } = useSsh();
  const [time, setTime] = useState<string>('12:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} transition-colors duration-200`}>
      {/* Top Universal Controls Bar */}
      <header className={`h-12 border-b flex items-center justify-between px-4 z-40 select-none ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-md sticky top-0`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
              TermPulse <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono">SSH</span>
            </span>
          </div>
          <span className="text-slate-500 text-xs hidden sm:inline">· Android Native Clean Architecture</span>
        </div>

        {/* Center: Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/40 p-0.5 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setDeviceMode('PHONE')}
            title="Android Phone Preview (Pixel 9 Pro)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              deviceMode === 'PHONE'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Phone</span>
          </button>
          <button
            onClick={() => setDeviceMode('TABLET')}
            title="Android Tablet Preview (Pixel Tablet)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              deviceMode === 'TABLET'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDeviceMode('FULLSCREEN')}
            title="Fullscreen Responsive View"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              deviceMode === 'FULLSCREEN'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
        </div>

        {/* Right: Quick Settings & Theme */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('codebase')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'codebase'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 border border-slate-700/50'
            }`}
            title="Inspect & Export Native Kotlin Android Code"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android Code</span>
          </button>

          <button
            onClick={() => setThemeMode(isDark ? 'LIGHT' : 'DARK')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
        {deviceMode === 'PHONE' && (
          <div className="relative w-full max-w-[390px] h-[844px] max-h-[calc(100vh-60px)] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col ring-1 ring-white/10">
            {/* Phone Bezel Top: Speaker & Camera */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 mr-2" />
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>

            {/* Inner Phone Screen */}
            <div className={`flex-1 rounded-[34px] overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
              {/* Android Status Bar */}
              <div className={`h-8 px-6 pt-1 flex items-center justify-between text-[11px] font-mono select-none z-40 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>{time}</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* App Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {children}
              </div>

              {/* Android 3-Button Navigation Bar (Matching user's phone screenshot) */}
              <div className="h-7 w-full flex items-center justify-around px-12 bg-slate-950/80 border-t border-slate-900 z-40 select-none">
                <button
                  onClick={() => setActiveTab('servers')}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                  title="Android Back"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <polygon points="19,4 5,12 19,20" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                  title="Android Home"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-500 hover:bg-slate-300" />
                </button>
                <button
                  onClick={() => setActiveTab('codebase')}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                  title="Android Overview"
                >
                  <div className="w-3.5 h-3.5 rounded-xs bg-slate-500 hover:bg-slate-300" />
                </button>
              </div>
            </div>
          </div>
        )}

        {deviceMode === 'TABLET' && (
          <div className="relative w-full max-w-[960px] h-[640px] max-h-[calc(100vh-60px)] bg-slate-900 rounded-[32px] p-3.5 shadow-2xl border-4 border-slate-800 flex flex-col ring-1 ring-white/10">
            {/* Tablet Camera */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-950 border border-slate-800 z-50" />

            <div className={`flex-1 rounded-[22px] overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
              {/* Tablet Status Bar */}
              <div className={`h-6 px-6 flex items-center justify-between text-[11px] font-mono select-none z-40 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="font-semibold">TermPulse OS • Android 15 Tablet</span>
                <div className="flex items-center gap-2">
                  <span>Wi-Fi 6E</span>
                  <span>{time}</span>
                </div>
              </div>

              {/* Tablet Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {children}
              </div>

              {/* Tablet Home Bar */}
              <div className="h-3 w-full flex items-center justify-center z-40">
                <div className="w-48 h-1 rounded-full bg-slate-500/40" />
              </div>
            </div>
          </div>
        )}

        {deviceMode === 'FULLSCREEN' && (
          <div className={`w-full h-full max-w-7xl mx-auto flex-1 flex flex-col overflow-hidden rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800/80 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'}`}>
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
