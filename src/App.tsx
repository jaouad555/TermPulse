import React, { useState } from 'react';
import { SshProvider, useSsh } from './context/SshContext';
import { DeviceFrame } from './components/DeviceFrame';
import { Navigation } from './components/Navigation';
import { ServerList } from './components/ServerList';
import { AddEditServerModal } from './components/AddEditServerModal';
import { TerminalView } from './components/TerminalView';
import { SftpExplorer } from './components/SftpExplorer';
import { SettingsView } from './components/SettingsView';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { BiometricLockModal } from './components/BiometricLockModal';
import { Server } from './types/ssh';
import { Check, AlertCircle, Info } from 'lucide-react';

function AppContent() {
  const { activeTab, toast, themeMode, deviceMode } = useSsh();
  const [showAddModal, setShowAddModal] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<Server | null>(null);

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleOpenAdd = () => {
    setServerToEdit(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (server: Server) => {
    setServerToEdit(server);
    setShowAddModal(true);
  };

  return (
    <DeviceFrame>
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        {/* Navigation Rail on Tablet / Desktop */}
        {deviceMode !== 'PHONE' && <Navigation />}

        {/* Tab Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeTab === 'servers' && (
            <ServerList onAddServer={handleOpenAdd} onEditServer={handleOpenEdit} />
          )}

          {activeTab === 'terminal' && <TerminalView />}

          {activeTab === 'sftp' && <SftpExplorer />}

          {activeTab === 'codebase' && <CodebaseExplorer />}

          {activeTab === 'settings' && <SettingsView />}
        </div>

        {/* Bottom Navigation on Phone */}
        {deviceMode === 'PHONE' && <Navigation />}

        {/* Add/Edit Server Modal */}
        {showAddModal && (
          <AddEditServerModal
            serverToEdit={serverToEdit}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* Biometric Lock Protection */}
        <BiometricLockModal />

        {/* Toast Notifications */}
        {toast && (
          <div className="fixed bottom-14 sm:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 border ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-300'
                  : 'bg-slate-900/90 border-slate-700 text-slate-200'
              } backdrop-blur-md`}
            >
              {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </DeviceFrame>
  );
}

export default function App() {
  return (
    <SshProvider>
      <AppContent />
    </SshProvider>
  );
}
