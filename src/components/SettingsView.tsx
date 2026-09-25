import React from 'react';
import { useSsh } from '../context/SshContext';
import { ThemeMode, TerminalThemeId } from '../types/ssh';
import { TERMINAL_THEMES } from '../utils/ansi';
import {
  Sun,
  Moon,
  Monitor,
  Terminal,
  Shield,
  Network,
  Info,
  RefreshCw,
  Key,
  Check,
  Sparkles,
  Sliders,
  Volume2,
  Copy,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    terminalSettings,
    updateTerminalSettings,
    securitySettings,
    updateSecuritySettings,
    showToast,
  } = useSsh();

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleClearVault = () => {
    if (confirm('Are you sure you want to wipe all encrypted credentials and saved servers?')) {
      localStorage.removeItem('termpulse_servers');
      localStorage.removeItem('termpulse_vault_master_key_v1');
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold tracking-tight mb-1">Settings</h1>
        <p className="text-xs text-slate-500">
          Configure client preferences, Termius shell themes, intelligent auto-suggestions, and security.
        </p>
      </div>

      {/* 1. App Appearance */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-2">
          <Sun className="w-3.5 h-3.5" />
          <span>App Appearance</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-2">Theme Mode</label>
            <div className="flex gap-2">
              {[
                { id: 'DARK' as ThemeMode, label: 'Dark Midnight', icon: Moon },
                { id: 'LIGHT' as ThemeMode, label: 'Light Technical', icon: Sun },
                { id: 'SYSTEM' as ThemeMode, label: 'System Default', icon: Monitor },
              ].map(theme => {
                const Icon = theme.icon;
                const isSelected = themeMode === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setThemeMode(theme.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                        : isDark
                        ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Termius Terminal & Autocomplete Engine */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>Termius Terminal & Shell</span>
        </h2>

        <div className="space-y-4 text-xs">
          {/* Autocomplete Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Intelligent Auto-Suggestions</p>
                <p className="text-[11px] text-slate-400">Context-aware Linux command autocomplete, flags, and ghost text</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={terminalSettings.enableAutosuggestions}
              onChange={e => updateTerminalSettings({ enableAutosuggestions: e.target.checked })}
              className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 bg-slate-900 border-slate-700"
            />
          </div>

          {/* Terminal Color Theme */}
          <div>
            <label className="block text-slate-400 mb-2">Terminal Color Palette</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(TERMINAL_THEMES).map(t => {
                const isSelected = terminalSettings.themeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateTerminalSettings({ themeId: t.id as TerminalThemeId })}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-400 shadow-md ring-1 ring-sky-400/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    style={{ backgroundColor: t.background }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold truncate" style={{ color: t.foreground }}>
                        {t.name.split(' ')[0]}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.red }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.green }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.yellow }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.blue }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-400">Terminal Font Size</label>
              <span className="font-mono text-slate-300">{terminalSettings.fontSize}px</span>
            </div>
            <div className="flex gap-2">
              {[11, 12, 13, 14, 15, 17].map(size => (
                <button
                  key={size}
                  onClick={() => updateTerminalSettings({ fontSize: size })}
                  className={`flex-1 py-1.5 rounded border text-xs font-mono font-medium transition-colors cursor-pointer ${
                    terminalSettings.fontSize === size
                      ? 'bg-sky-500 text-white border-sky-400'
                      : isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Cursor Style */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-400">Cursor Style</label>
              <span className="capitalize text-slate-300 font-mono">{terminalSettings.cursorStyle}</span>
            </div>
            <div className="flex gap-2">
              {(['block', 'beam', 'underline', 'glow'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => updateTerminalSettings({ cursorStyle: style })}
                  className={`flex-1 py-1.5 rounded border text-xs capitalize font-medium transition-colors cursor-pointer ${
                    terminalSettings.cursorStyle === style
                      ? 'bg-sky-500 text-white border-sky-400'
                      : isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollback buffer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-400">Scrollback Buffer Size</label>
              <span className="font-mono text-slate-300">{terminalSettings.scrollbackLines} lines</span>
            </div>
            <div className="flex gap-2">
              {[1000, 5000, 10000, 20000].map(lines => (
                <button
                  key={lines}
                  onClick={() => updateTerminalSettings({ scrollbackLines: lines })}
                  className={`flex-1 py-1.5 rounded border text-xs font-mono font-medium transition-colors cursor-pointer ${
                    terminalSettings.scrollbackLines === lines
                      ? 'bg-sky-500 text-white border-sky-400'
                      : isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {lines.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Security & Keystore */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Security & Keystore</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-200">Biometric Authentication Protection</p>
              <p className="text-[11px] text-slate-500">Require fingerprint or PIN before decrypting SSH keys</p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.biometricLock}
              onChange={e => updateSecuritySettings({ biometricLock: e.target.checked })}
              className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 bg-slate-950 border-slate-700"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-200">Wipe Local Vault</p>
              <p className="text-[11px] text-slate-500">Clear all stored encrypted passwords and private keys</p>
            </div>
            <button
              onClick={handleClearVault}
              className="px-2.5 py-1 rounded text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
            >
              Reset Vault
            </button>
          </div>
        </div>
      </div>

      {/* 4. About */}
      <div className={`p-4 rounded-xl border text-xs space-y-2 ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-sky-400" />
          <span>TermPulse Termius-Grade SSH & SFTP Manager</span>
        </div>
        <p>
          Full-featured SSH client with multi-session tabs, intelligent auto-suggestions engine, Termius snippets automation vault, and truecolor PTY terminal execution.
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
          <span>Target SDK: 35</span>
          <span>·</span>
          <span>Kotlin 2.1.0</span>
          <span>·</span>
          <span>Jetpack Compose BOM 2025</span>
        </div>
      </div>
    </div>
  );
};
