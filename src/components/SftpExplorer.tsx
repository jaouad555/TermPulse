import React, { useState, useEffect } from 'react';
import { useSsh } from '../context/SshContext';
import { SftpFile } from '../types/ssh';
import {
  Folder,
  FileText,
  FileCode,
  File,
  ChevronRight,
  FolderPlus,
  FilePlus,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit2,
  X,
  Save,
  Check,
  AlertCircle,
  MoreVertical,
  CornerLeftUp,
} from 'lucide-react';

export const SftpExplorer: React.FC = () => {
  const {
    activeServer,
    sftpPath,
    sftpFiles,
    sftpLoading,
    sftpError,
    loadSftpDirectory,
    readSftpFile,
    writeSftpFile,
    sftpOperation,
    themeMode,
    showToast,
  } = useSsh();

  const [activeFile, setActiveFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [fileEditorOpen, setFileEditorOpen] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);

  // New folder / file modal state
  const [promptModal, setPromptModal] = useState<{
    type: 'folder' | 'file' | 'rename';
    currentVal: string;
    targetPath?: string;
  } | null>(null);
  const [promptInput, setPromptInput] = useState('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<SftpFile | null>(null);

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (activeServer && sftpFiles.length === 0 && !sftpLoading) {
      loadSftpDirectory(activeServer, sftpPath || '/root');
    }
  }, [activeServer]);

  const handleNavigate = (path: string) => {
    if (!activeServer) return;
    loadSftpDirectory(activeServer, path);
  };

  const handleNavigateUp = () => {
    if (!activeServer || sftpPath === '/' || !sftpPath) return;
    const parts = sftpPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    loadSftpDirectory(activeServer, parentPath || '/');
  };

  const handleOpenFile = async (file: SftpFile) => {
    if (!activeServer) return;
    try {
      const fullPath = sftpPath === '/' ? `/${file.name}` : `${sftpPath}/${file.name}`;
      const content = await readSftpFile(activeServer, fullPath);
      setActiveFile({ path: fullPath, name: file.name, content });
      setFileEditorOpen(true);
    } catch (err: any) {
      showToast(`Failed to open file: ${err.message}`, 'error');
    }
  };

  const handleSaveFile = async () => {
    if (!activeServer || !activeFile) return;
    setIsSavingFile(true);
    try {
      await writeSftpFile(activeServer, activeFile.path, activeFile.content);
      setFileEditorOpen(false);
      loadSftpDirectory(activeServer, sftpPath);
    } catch (err: any) {
      showToast(`Failed to write file: ${err.message}`, 'error');
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleCreateConfirm = async () => {
    if (!activeServer || !promptModal || !promptInput.trim()) return;
    const name = promptInput.trim();
    const targetPath = sftpPath === '/' ? `/${name}` : `${sftpPath}/${name}`;

    try {
      if (promptModal.type === 'folder') {
        await sftpOperation(activeServer, 'mkdir', targetPath);
      } else if (promptModal.type === 'file') {
        await writeSftpFile(activeServer, targetPath, `# ${name}\nCreated via TermPulse SFTP\n`);
      } else if (promptModal.type === 'rename' && promptModal.targetPath) {
        const newPath = sftpPath === '/' ? `/${name}` : `${sftpPath}/${name}`;
        await sftpOperation(activeServer, 'rename', promptModal.targetPath, newPath);
      }
      setPromptModal(null);
      setPromptInput('');
      loadSftpDirectory(activeServer, sftpPath);
    } catch (err: any) {
      showToast(`Operation failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeServer || !deleteConfirm) return;
    try {
      const fullPath = sftpPath === '/' ? `/${deleteConfirm.name}` : `${sftpPath}/${deleteConfirm.name}`;
      await sftpOperation(activeServer, 'delete', fullPath);
      setDeleteConfirm(null);
      loadSftpDirectory(activeServer, sftpPath);
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeServer || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const content = reader.result as string;
      const targetPath = sftpPath === '/' ? `/${file.name}` : `${sftpPath}/${file.name}`;
      try {
        await writeSftpFile(activeServer, targetPath, content);
        loadSftpDirectory(activeServer, sftpPath);
      } catch (err: any) {
        showToast(`Upload failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = async (file: SftpFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeServer) return;
    try {
      const fullPath = sftpPath === '/' ? `/${file.name}` : `${sftpPath}/${file.name}`;
      const content = await readSftpFile(activeServer, fullPath);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${file.name}`, 'success');
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`, 'error');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timeMs: number): string => {
    if (!timeMs) return '-';
    return new Date(timeMs).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pathParts = sftpPath.split('/').filter(Boolean);

  if (!activeServer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Folder className="w-12 h-12 text-slate-500 mb-3" />
        <h3 className="text-base font-semibold mb-1">No Server Selected</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Select an SSH host from the Servers tab to browse remote directories and edit files via SFTP.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* SFTP Top Path Bar */}
      <div className={`p-3 border-b shrink-0 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono py-1 no-scrollbar flex-1 min-w-0">
            <button
              onClick={() => handleNavigate('/')}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 shrink-0"
              title="Root directory"
            >
              /
            </button>
            {pathParts.map((part, idx) => {
              const subPath = '/' + pathParts.slice(0, idx + 1).join('/');
              const isLast = idx === pathParts.length - 1;
              return (
                <React.Fragment key={subPath}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <button
                    onClick={() => handleNavigate(subPath)}
                    className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${
                      isLast
                        ? 'font-semibold text-sky-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick SFTP Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer"
              title="Upload File"
            >
              <Upload className="w-3.5 h-3.5" />
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => {
                setPromptModal({ type: 'file', currentVal: '' });
                setPromptInput('');
              }}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
              title="Create New File"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setPromptModal({ type: 'folder', currentVal: '' });
                setPromptInput('');
              }}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
              title="Create New Directory"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => loadSftpDirectory(activeServer, sftpPath)}
              disabled={sftpLoading}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sftpLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Directory File List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3">
        {sftpLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs">Reading remote directory...</span>
          </div>
        ) : sftpError ? (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2 m-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>SFTP Error: {sftpError}</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Go Up Parent Row */}
            {sftpPath !== '/' && sftpPath !== '' && (
              <div
                onClick={handleNavigateUp}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  isDark ? 'hover:bg-slate-900 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <CornerLeftUp className="w-4 h-4 text-sky-400" />
                <span className="font-semibold">.. (parent directory)</span>
              </div>
            )}

            {sftpFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Directory is empty.
              </div>
            ) : (
              sftpFiles.map(file => {
                const isDir = file.isDirectory;
                const isCode = file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.json') || file.name.endsWith('.yml') || file.name.endsWith('.yaml') || file.name.endsWith('.sh');

                return (
                  <div
                    key={file.name}
                    onClick={() => {
                      if (isDir) {
                        const newPath = sftpPath === '/' ? `/${file.name}` : `${sftpPath}/${file.name}`;
                        handleNavigate(newPath);
                      } else {
                        handleOpenFile(file);
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs border border-transparent transition-colors group ${
                      isDark
                        ? 'hover:bg-slate-900/80 hover:border-slate-800'
                        : 'hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isDir ? (
                        <Folder className="w-4 h-4 text-sky-400 shrink-0 fill-sky-400/20" />
                      ) : isCode ? (
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}

                      <div className="min-w-0 flex-1 truncate">
                        <span className={`font-medium ${isDir ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>
                          {file.name}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px] shrink-0">
                      <span className="hidden sm:inline w-20 text-right">{file.permissions}</span>
                      <span className="w-16 text-right">{isDir ? '-' : formatSize(file.size)}</span>
                      <span className="hidden md:inline w-28 text-right">{formatDate(file.modifyTime)}</span>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {!isDir && (
                          <button
                            onClick={e => handleDownload(file, e)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const fullPath = sftpPath === '/' ? `/${file.name}` : `${sftpPath}/${file.name}`;
                            setPromptModal({ type: 'rename', currentVal: file.name, targetPath: fullPath });
                            setPromptInput(file.name);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteConfirm(file);
                          }}
                          className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* File Editor Modal */}
      {fileEditorOpen && activeFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-semibold text-slate-200">{activeFile.path}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFile}
                  disabled={isSavingFile}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingFile ? 'Saving...' : 'Save Remote'}</span>
                </button>
                <button
                  onClick={() => setFileEditorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={activeFile.content}
              onChange={e => setActiveFile({ ...activeFile, content: e.target.value })}
              className="flex-1 w-full p-4 bg-slate-950 text-slate-200 font-mono text-xs outline-none resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* New Folder / File / Rename Prompt Modal */}
      {promptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold mb-2">
              {promptModal.type === 'folder' && 'Create New Directory'}
              {promptModal.type === 'file' && 'Create New File'}
              {promptModal.type === 'rename' && 'Rename'}
            </h3>
            <input
              type="text"
              autoFocus
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              placeholder="Enter name..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-sky-500 font-mono mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPromptModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConfirm}
                disabled={!promptInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-rose-400 mb-2">Confirm Delete</h3>
            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to permanently remove <span className="font-mono font-semibold">{deleteConfirm.name}</span> from the remote host?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
