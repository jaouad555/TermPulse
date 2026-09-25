import React, { useState } from 'react';
import { useSsh } from '../context/SshContext';
import { Server, AuthType } from '../types/ssh';
import { X, Lock, Key, Activity, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';

interface AddEditServerModalProps {
  serverToEdit?: Server | null;
  onClose: () => void;
}

export const AddEditServerModal: React.FC<AddEditServerModalProps> = ({ serverToEdit, onClose }) => {
  const { saveServer, testServerConnection, themeMode, showToast } = useSsh();

  const [name, setName] = useState(serverToEdit?.name || '');
  const [host, setHost] = useState(serverToEdit?.host || '');
  const [port, setPort] = useState(serverToEdit?.port ? String(serverToEdit.port) : '22');
  const [username, setUsername] = useState(serverToEdit?.username || 'root');
  const [authType, setAuthType] = useState<AuthType>(serverToEdit?.authType || 'PASSWORD');
  const [secret, setSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [tagsInput, setTagsInput] = useState(serverToEdit?.tags?.join(', ') || '');
  const [showSecret, setShowSecret] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleTestConnection = async () => {
    if (!host || !username) {
      showToast('Please specify host and username first', 'error');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const tempServer: Server = {
      id: serverToEdit?.id || 'temp',
      name: name || 'Test Server',
      host: host.trim(),
      port: parseInt(port, 10) || 22,
      username: username.trim(),
      authType,
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      status: 'DISCONNECTED',
    };

    const res = await testServerConnection(tempServer, secret, passphrase);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      showToast(`Connection verified! Ping: ${res.latencyMs}ms`, 'success');
    } else {
      showToast(`Verification failed: ${res.error}`, 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !host.trim() || !username.trim()) {
      showToast('Name, Host, and Username are required', 'error');
      return;
    }

    if (!serverToEdit && !secret.trim()) {
      showToast('Password or Private Key is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await saveServer(
        {
          id: serverToEdit?.id || 'srv_' + Math.random().toString(36).substring(2, 9),
          name: name.trim(),
          host: host.trim(),
          port: parseInt(port, 10) || 22,
          username: username.trim(),
          authType,
          tags: parsedTags,
          osInfo: serverToEdit?.osInfo || (host.includes('ubuntu') ? 'Ubuntu 24.04 LTS' : 'Linux x86_64'),
        },
        secret,
        passphrase
      );

      onClose();
    } catch (err: any) {
      console.error('Failed to save server:', err);
      showToast(err.message || 'Failed to save server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 className="text-base font-semibold">
              {serverToEdit ? 'Edit SSH Server' : 'Add SSH Server'}
            </h2>
            <p className="text-xs text-slate-500">
              Credentials are encrypted client-side using Android Keystore / WebCrypto AES-GCM
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Friendly Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Server Friendly Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Production Web API"
              className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-400 mb-1">Host / IP Address</label>
              <input
                type="text"
                required
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="69.xxx.xxx.xxx or domain.com"
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Port</label>
              <input
                type="number"
                value={port}
                onChange={e => setPort(e.target.value)}
                placeholder="22"
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                }`}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">SSH Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. root or ubuntu"
              className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Authentication Type Switcher */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Authentication Method</label>
            <div className="flex rounded-lg p-1 bg-slate-800/60 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setAuthType('PASSWORD')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  authType === 'PASSWORD'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthType('PRIVATE_KEY')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  authType === 'PRIVATE_KEY'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Private Key</span>
              </button>
            </div>
          </div>

          {/* Secret: Password or Private Key */}
          {authType === 'PASSWORD' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {serverToEdit ? 'New Password (leave empty to keep current)' : 'SSH Password'}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder={serverToEdit ? '••••••••••••' : 'Enter SSH password'}
                  className={`w-full pl-3 pr-10 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {serverToEdit ? 'New SSH Private Key (leave empty to keep current)' : 'SSH Private Key (OpenSSH, PEM, RSA, Ed25519)'}
                </label>
                <textarea
                  rows={4}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;b3BlbnNzaC1rZXktdjEAAAA...&#10;-----END OPENSSH PRIVATE KEY-----"
                  className={`w-full p-2.5 text-[11px] rounded-lg border outline-none font-mono resize-y ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Key Passphrase (Optional)</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  placeholder="Leave empty if key is not encrypted"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Production, Docker, Ubuntu, AWS"
              className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {testResult.success ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Connection successful! Latency: {testResult.latencyMs}ms</span>
                </>
              ) : (
                <span>Error: {testResult.error}</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !host || !username}
              className="px-3 py-2 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-sky-400' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Server'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
