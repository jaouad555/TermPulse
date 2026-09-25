export type AuthType = 'PASSWORD' | 'PRIVATE_KEY';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTING' | 'ERROR';

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  // Encrypted credentials stored in secure vault
  secretEncrypted?: string;
  passphraseEncrypted?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastConnectedAt?: number;
  status: ConnectionStatus;
  osInfo?: string;
  lastLatencyMs?: number;
}

export interface SftpFile {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modifyTime: number;
  permissions: string;
  owner: string;
}

export type ThemeMode = 'SYSTEM' | 'DARK' | 'LIGHT';
export type DeviceViewMode = 'PHONE' | 'TABLET' | 'FULLSCREEN';

export type TerminalThemeId =
  | 'termius-dark'
  | 'tokyo-night'
  | 'dracula'
  | 'catppuccin'
  | 'matrix'
  | 'nord'
  | 'solarized'
  | 'termius-light';

export interface TerminalSettings {
  fontSize: number;
  lineHeight: number;
  scrollbackLines: number;
  cursorStyle: 'block' | 'beam' | 'underline' | 'glow';
  fontFamily: string;
  themeId: TerminalThemeId;
  enableAutosuggestions: boolean;
  soundBell: boolean;
  copyOnSelect: boolean;
}

export interface SecuritySettings {
  biometricLock: boolean;
  autoLockMinutes: number;
  clearClipboardOnExit: boolean;
}

export interface TerminalSession {
  id: string;
  serverId: string;
  title: string;
  serverName: string;
  username: string;
  host: string;
  port: number;
  lines: string[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  history: string[];
  createdAt: number;
  lastActiveAt: number;
}
