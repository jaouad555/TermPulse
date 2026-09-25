import React from 'react';
import { TerminalThemeId } from '../types/ssh';

export interface TerminalThemeColors {
  id: TerminalThemeId;
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export const TERMINAL_THEMES: Record<TerminalThemeId, TerminalThemeColors> = {
  'termius-dark': {
    id: 'termius-dark',
    name: 'Termius Midnight Obsidian',
    background: '#090d16',
    foreground: '#f1f5f9',
    cursor: '#38bdf8',
    selection: '#1e293b',
    black: '#090d16',
    red: '#f43f5e',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#38bdf8',
    magenta: '#c084fc',
    cyan: '#06b6d4',
    white: '#f1f5f9',
    brightBlack: '#475569',
    brightRed: '#fb7185',
    brightGreen: '#34d399',
    brightYellow: '#fbbf24',
    brightBlue: '#60a5fa',
    brightMagenta: '#d8b4fe',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    background: '#1a1b26',
    foreground: '#c0caf5',
    cursor: '#7aa2f7',
    selection: '#283457',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula Pro',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#ff79c6',
    selection: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  'catppuccin': {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selection: '#45475a',
    black: '#11111b',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#cba6f7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#cba6f7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  },
  'matrix': {
    id: 'matrix',
    name: 'Matrix Cyberpunk',
    background: '#040d06',
    foreground: '#22c55e',
    cursor: '#4ade80',
    selection: '#0f3818',
    black: '#000000',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#84cc16',
    blue: '#10b981',
    magenta: '#14b8a6',
    cyan: '#4ade80',
    white: '#dcfce7',
    brightBlack: '#14532d',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#a3e635',
    brightBlue: '#34d399',
    brightMagenta: '#2dd4bf',
    brightCyan: '#86efac',
    brightWhite: '#ffffff',
  },
  'nord': {
    id: 'nord',
    name: 'Nordic Frost',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#88c0d0',
    selection: '#434c5e',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
  'solarized': {
    id: 'solarized',
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#268bd2',
    selection: '#073642',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#586e75',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  'termius-light': {
    id: 'termius-light',
    name: 'Termius Light Crisp',
    background: '#f8fafc',
    foreground: '#0f172a',
    cursor: '#0284c7',
    selection: '#e2e8f0',
    black: '#0f172a',
    red: '#e11d48',
    green: '#059669',
    yellow: '#d97706',
    blue: '#0284c7',
    magenta: '#7c3aed',
    cyan: '#0891b2',
    white: '#475569',
    brightBlack: '#94a3b8',
    brightRed: '#f43f5e',
    brightGreen: '#10b981',
    brightYellow: '#f59e0b',
    brightBlue: '#38bdf8',
    brightMagenta: '#a855f7',
    brightCyan: '#06b6d4',
    brightWhite: '#0f172a',
  },
};

// 256-color palette lookup generator
function get256Color(n: number, theme: TerminalThemeColors): string {
  if (n === 0) return theme.black;
  if (n === 1) return theme.red;
  if (n === 2) return theme.green;
  if (n === 3) return theme.yellow;
  if (n === 4) return theme.blue;
  if (n === 5) return theme.magenta;
  if (n === 6) return theme.cyan;
  if (n === 7) return theme.white;
  if (n === 8) return theme.brightBlack;
  if (n === 9) return theme.brightRed;
  if (n === 10) return theme.brightGreen;
  if (n === 11) return theme.brightYellow;
  if (n === 12) return theme.brightBlue;
  if (n === 13) return theme.brightMagenta;
  if (n === 14) return theme.brightCyan;
  if (n === 15) return theme.brightWhite;

  // 16..231: 6x6x6 color cube
  if (n >= 16 && n <= 231) {
    const i = n - 16;
    const r = Math.floor(i / 36);
    const g = Math.floor((i % 36) / 6);
    const b = i % 6;
    const toHex = (v: number) => (v === 0 ? '00' : (v * 40 + 55).toString(16).padStart(2, '0'));
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // 232..255: grayscale ramp
  if (n >= 232 && n <= 255) {
    const gray = (n - 232) * 10 + 8;
    const hex = gray.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }

  return theme.foreground;
}

export function parseAnsiToSpans(
  text: string,
  themeId: TerminalThemeId = 'termius-dark',
  searchQuery: string = ''
): React.ReactNode[] {
  const theme = TERMINAL_THEMES[themeId] || TERMINAL_THEMES['termius-dark'];
  const parts = text.split(/(\x1b\[[0-9;]*[a-zA-Z])/g);
  const elements: React.ReactNode[] = [];

  let currentFg: string | undefined;
  let currentBg: string | undefined;
  let isBold = false;
  let isDim = false;
  let isItalic = false;
  let isUnderline = false;

  const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/g;

  parts.forEach((part, index) => {
    if (!part) return;

    if (part.startsWith('\x1b[')) {
      const codeStr = part.slice(2, -1);
      const codes = codeStr ? codeStr.split(';').map(c => parseInt(c, 10)) : [0];

      let i = 0;
      while (i < codes.length) {
        const code = codes[i];

        if (isNaN(code) || code === 0) {
          currentFg = undefined;
          currentBg = undefined;
          isBold = false;
          isDim = false;
          isItalic = false;
          isUnderline = false;
        } else if (code === 1) {
          isBold = true;
        } else if (code === 2) {
          isDim = true;
        } else if (code === 3) {
          isItalic = true;
        } else if (code === 4) {
          isUnderline = true;
        } else if (code === 22) {
          isBold = false;
          isDim = false;
        } else if (code === 23) {
          isItalic = false;
        } else if (code === 24) {
          isUnderline = false;
        } else if (code >= 30 && code <= 37) {
          currentFg = get256Color(code - 30, theme);
        } else if (code === 38) {
          // 256 colors or 24-bit TrueColor
          if (codes[i + 1] === 5 && codes[i + 2] !== undefined) {
            currentFg = get256Color(codes[i + 2], theme);
            i += 2;
          } else if (codes[i + 1] === 2 && codes[i + 4] !== undefined) {
            currentFg = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`;
            i += 4;
          }
        } else if (code === 39) {
          currentFg = undefined;
        } else if (code >= 40 && code <= 47) {
          currentBg = get256Color(code - 40, theme);
        } else if (code === 48) {
          if (codes[i + 1] === 5 && codes[i + 2] !== undefined) {
            currentBg = get256Color(codes[i + 2], theme);
            i += 2;
          } else if (codes[i + 1] === 2 && codes[i + 4] !== undefined) {
            currentBg = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`;
            i += 4;
          }
        } else if (code === 49) {
          currentBg = undefined;
        } else if (code >= 90 && code <= 97) {
          currentFg = get256Color(code - 90 + 8, theme);
        } else if (code >= 100 && code <= 107) {
          currentBg = get256Color(code - 100 + 8, theme);
        }
        i++;
      }
      return;
    }

    const cleanText = part.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    if (!cleanText) return;

    // Search query highlighting if active
    if (searchQuery && cleanText.toLowerCase().includes(searchQuery.toLowerCase())) {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const searchSplits = cleanText.split(regex);

      elements.push(
        <span
          key={`span-${index}`}
          style={{
            color: currentFg || theme.foreground,
            backgroundColor: currentBg,
            fontWeight: isBold ? 600 : 400,
            opacity: isDim ? 0.7 : 1,
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
          }}
        >
          {searchSplits.map((sub, sIdx) =>
            sub.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark
                key={`mark-${index}-${sIdx}`}
                className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded-xs"
              >
                {sub}
              </mark>
            ) : (
              sub
            )
          )}
        </span>
      );
      return;
    }

    // Normal text rendering
    elements.push(
      <span
        key={`span-${index}`}
        style={{
          color: currentFg || theme.foreground,
          backgroundColor: currentBg,
          fontWeight: isBold ? 600 : 400,
          opacity: isDim ? 0.7 : 1,
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecoration: isUnderline ? 'underline' : 'none',
        }}
      >
        {cleanText}
      </span>
    );
  });

  return elements;
}
