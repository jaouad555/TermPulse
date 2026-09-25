import React, { useState } from 'react';
import { useSsh } from '../context/SshContext';
import {
  Wand2,
  Paperclip,
  Keyboard,
  Key,
  Code2,
  Lock,
  Sparkles,
  Check,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Terminal,
} from 'lucide-react';

interface TermiusAccessoryBarProps {
  onOpenSnippets: () => void;
  onSendKey: (key: string, ctrl?: boolean, alt?: boolean) => void;
  onInsertText: (text: string) => void;
  ctrlActive: boolean;
  setCtrlActive: (active: boolean) => void;
  altActive: boolean;
  setAltActive: (active: boolean) => void;
}

export const TermiusAccessoryBar: React.FC<TermiusAccessoryBarProps> = ({
  onOpenSnippets,
  onSendKey,
  onInsertText,
  ctrlActive,
  setCtrlActive,
  altActive,
  setAltActive,
}) => {
  const { activeServer, activeSession, sendSessionData, showToast } = useSsh();
  const [isSymbolsOpen, setIsSymbolsOpen] = useState(false);
  const [isKeyboardDrawerOpen, setIsKeyboardDrawerOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Termius Special Symbols Grid
  const symbols = [
    { label: '|', text: '|' },
    { label: '&', text: '&' },
    { label: '&&', text: ' && ' },
    { label: '||', text: ' || ' },
    { label: '~', text: '~' },
    { label: '/', text: '/' },
    { label: '\\', text: '\\' },
    { label: '$', text: '$' },
    { label: ';', text: ';' },
    { label: '*', text: '*' },
    { label: '<', text: '<' },
    { label: '>', text: '>' },
    { label: '>>', text: ' >> ' },
    { label: '"', text: '""' },
    { label: "'", text: "''" },
    { label: '(', text: '()' },
    { label: '[', text: '[]' },
    { label: '{', text: '{}' },
    { label: '`', text: '``' },
    { label: 'sudo', text: 'sudo ' },
    { label: 'grep', text: 'grep ' },
    { label: 'tail', text: 'tail -f ' },
    { label: 'cat', text: 'cat ' },
    { label: 'cd', text: 'cd ' },
  ];

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onInsertText(text);
        showToast('Pasted from clipboard', 'info');
      } else {
        showToast('Clipboard is empty', 'error');
      }
    } catch {
      showToast('Click clipboard icon or grant permission to paste', 'error');
    }
  };

  const handleAutofillPassword = () => {
    if (activeServer) {
      setIsVaultOpen(true);
    }
  };

  return (
    <div className="relative select-none shrink-0 z-30">
      {/* 1. Extended Symbols Drawer */}
      {isSymbolsOpen && (
        <div className="p-2.5 bg-slate-900/95 border-t border-slate-700/80 backdrop-blur-md grid grid-cols-6 sm:grid-cols-8 gap-1.5 shadow-2xl animate-in slide-in-from-bottom-2 duration-150 text-xs font-mono">
          {symbols.map(s => (
            <button
              key={s.label}
              onClick={() => {
                onInsertText(s.text);
                setIsSymbolsOpen(false);
              }}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700/60 transition-colors text-center cursor-pointer active:scale-95"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* 2. Extended Navigation Keys Drawer (F-Keys, Arrows, PageUp/Down) */}
      {isKeyboardDrawerOpen && (
        <div className="p-2.5 bg-slate-900/95 border-t border-slate-700/80 backdrop-blur-md flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-150 text-xs font-mono">
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map(f => (
              <button
                key={f}
                onClick={() => onSendKey(`\x1b[${f}`)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono border border-slate-700 cursor-pointer"
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => onSendKey('\x1b[H')}
              className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-mono cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => onSendKey('\x1b[F')}
              className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-mono cursor-pointer"
            >
              End
            </button>
            <button
              onClick={() => onSendKey('\x1b[5~')}
              className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-mono cursor-pointer"
            >
              PgUp
            </button>
            <button
              onClick={() => onSendKey('\x1b[6~')}
              className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-mono cursor-pointer"
            >
              PgDn
            </button>
            <button
              onClick={() => onSendKey('\x1b[D')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="Left Arrow"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSendKey('\x1b[A')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="Up Arrow"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSendKey('\x1b[B')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="Down Arrow"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSendKey('\x1b[C')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              title="Right Arrow"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Password Vault Autofill Sheet */}
      {isVaultOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Autofill Host Credentials</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeSession) {
                  onSendKey('\r');
                  showToast('Sent Enter', 'info');
                }
                setIsVaultOpen(false);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Send Enter
            </button>
            <button
              onClick={() => {
                if (activeSession) {
                  onSendKey('root\r');
                  showToast('Autofilled root username', 'success');
                }
                setIsVaultOpen(false);
              }}
              className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-white font-medium"
            >
              Insert Username
            </button>
            <button
              onClick={() => setIsVaultOpen(false)}
              className="px-2 py-1 text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Termius Bottom Accessory Bar (Exact layout from user screenshot) */}
      <div className="h-12 bg-white text-slate-800 border-t border-slate-200 flex items-center justify-between px-1 shadow-md">
        {/* 1. Magic Wand / AI Snippets */}
        <button
          type="button"
          onClick={onOpenSnippets}
          className="flex-1 h-full flex items-center justify-center text-slate-700 hover:text-sky-600 active:bg-slate-100 transition-colors cursor-pointer"
          title="Termius AI & Snippets"
        >
          <Wand2 className="w-4 h-4 stroke-[2]" />
        </button>

        {/* 2. Password Autofill '***' */}
        <button
          type="button"
          onClick={handleAutofillPassword}
          className="flex-1 h-full flex items-center justify-center font-bold text-sm tracking-wider text-slate-700 hover:text-sky-600 active:bg-slate-100 transition-colors cursor-pointer"
          title="Autofill Password / Sudo"
        >
          ***
        </button>

        {/* 3. Special Characters '{}' */}
        <button
          type="button"
          onClick={() => {
            setIsSymbolsOpen(!isSymbolsOpen);
            setIsKeyboardDrawerOpen(false);
          }}
          className={`flex-1 h-full flex items-center justify-center font-mono font-bold text-base transition-colors cursor-pointer ${
            isSymbolsOpen ? 'text-sky-600 bg-sky-50 font-extrabold' : 'text-slate-700 hover:text-sky-600 active:bg-slate-100'
          }`}
          title="Symbols & Operators"
        >
          {'{ }'}
        </button>

        {/* 4. Clipboard Paste '📎' */}
        <button
          type="button"
          onClick={handlePasteClipboard}
          className="flex-1 h-full flex items-center justify-center text-slate-700 hover:text-sky-600 active:bg-slate-100 transition-colors cursor-pointer"
          title="Paste Clipboard"
        >
          <Paperclip className="w-4 h-4 stroke-[2]" />
        </button>

        {/* 5. Shift / Tab (Stacked label) */}
        <button
          type="button"
          onClick={() => onSendKey('\t')}
          className="flex-1 h-full flex flex-col items-center justify-center leading-tight text-slate-700 hover:text-sky-600 active:bg-slate-100 transition-colors cursor-pointer"
          title="Tab / Auto-complete"
        >
          <span className="text-[9px] font-sans font-medium text-slate-500">shift</span>
          <span className="text-xs font-sans font-semibold -mt-0.5">tab</span>
        </button>

        {/* 6. Ctrl (With active underline indicator from screenshot!) */}
        <button
          type="button"
          onClick={() => setCtrlActive(!ctrlActive)}
          className={`flex-1 h-full flex flex-col items-center justify-center font-sans font-semibold text-xs transition-colors relative cursor-pointer ${
            ctrlActive ? 'text-sky-600 bg-sky-50' : 'text-slate-800 hover:text-sky-600 active:bg-slate-100'
          }`}
          title="Toggle Sticky Ctrl"
        >
          <span>Ctrl</span>
          <div
            className={`w-6 h-0.5 rounded-full mt-0.5 transition-all ${
              ctrlActive ? 'bg-sky-600' : 'bg-slate-700'
            }`}
          />
        </button>

        {/* 7. Esc Key */}
        <button
          type="button"
          onClick={() => onSendKey('\x1b')}
          className="flex-1 h-full flex items-center justify-center font-sans font-semibold text-xs text-slate-800 hover:text-sky-600 active:bg-slate-100 transition-colors cursor-pointer"
          title="Escape Key"
        >
          Esc
        </button>

        {/* 8. Virtual Keyboard / Extra Keys Toggle Icon (Far Right with subtle separator) */}
        <div className="h-full pl-1 flex items-center">
          <button
            type="button"
            onClick={() => {
              setIsKeyboardDrawerOpen(!isKeyboardDrawerOpen);
              setIsSymbolsOpen(false);
            }}
            className={`h-9 px-3 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
              isKeyboardDrawerOpen
                ? 'bg-sky-500 text-white border-sky-400'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Navigation Keys & Functions"
          >
            <Keyboard className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
