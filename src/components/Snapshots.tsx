import React, { useState } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Trash2, 
  Download, 
  Search, 
  FileCode, 
  Clock, 
  HardDrive, 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  X, 
  Copy, 
  Check, 
  Layers, 
  Info,
  Calendar,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useSnapshots } from '../context/SnapshotsContext';
import { ContainerSnapshot } from '../types/snapshots';
import { useToast } from '../context/ToastContext';

export default function Snapshots() {
  const { snapshots, deleteSnapshot, restoreSnapshot, exportSnapshot, createSnapshot } = useSnapshots();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContainerFilter, setSelectedContainerFilter] = useState('All');
  const [viewingSnapshot, setViewingSnapshot] = useState<ContainerSnapshot | null>(null);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick manual snapshot modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetContainer, setTargetContainer] = useState('GitHub MCP');
  const [customSnapshotName, setCustomSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');

  const { addToast } = useToast();

  const containerOptions = Array.from(new Set(snapshots.map((s) => s.containerName)));

  const filteredSnapshots = snapshots.filter((snap) => {
    const matchesSearch =
      snap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snap.containerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snap.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (snap.notes && snap.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesContainer =
      selectedContainerFilter === 'All' || snap.containerName === selectedContainerFilter;

    return matchesSearch && matchesContainer;
  });

  const handleRestore = async (snap: ContainerSnapshot) => {
    if (!window.confirm(`Are you sure you want to restore "${snap.name}" to container ${snap.containerName}? This will roll back its configuration.`)) {
      return;
    }
    setIsRestoringId(snap.id);
    await restoreSnapshot(snap.id);
    setIsRestoringId(null);
  };

  const handleCopyConfig = (config: any) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedKey('full');
    setTimeout(() => setCopiedKey(null), 2000);
    addToast({
      type: 'info',
      title: 'Copied',
      message: 'Snapshot JSON configuration copied to clipboard.',
    });
  };

  const handleManualCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSnapshot(targetContainer, customSnapshotName, snapshotNotes);
    setIsCreateModalOpen(false);
    setCustomSnapshotName('');
    setSnapshotNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Container Snapshots</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full">
              {snapshots.length} Available
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Point-in-time configuration backups of MCP containers. Inspect variables, restore previous configurations, or export JSON backups.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white text-white text-xs font-medium rounded-xl shadow-sm transition-colors"
        >
          <Camera className="w-4 h-4 text-purple-400 dark:text-purple-600" />
          <span>Take New Snapshot</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Snapshots</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{snapshots.length}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800/60">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Protected Containers</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{containerOptions.length}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/60">
            <Server className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage Utilized</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {(snapshots.reduce((acc, s) => acc + parseFloat(s.size || '12'), 0)).toFixed(1)} KB
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search snapshots by name, container, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Filter Container:</span>
          <select
            value={selectedContainerFilter}
            onChange={(e) => setSelectedContainerFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
          >
            <option value="All">All Containers ({snapshots.length})</option>
            {containerOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Snapshots Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        {filteredSnapshots.length === 0 ? (
          <div className="p-12 text-center">
            <Camera className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No Snapshots Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedContainerFilter !== 'All'
                ? 'Try adjusting your search criteria or container filter.'
                : 'Click "Create Snapshot" in the Dashboard container action menu or use the button above to capture a container state.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Snapshot Name & ID</th>
                  <th className="py-3 px-4">Target Container</th>
                  <th className="py-3 px-4">Image & Port</th>
                  <th className="py-3 px-4">Captured At</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredSnapshots.map((snap) => {
                  const isRestoring = isRestoringId === snap.id || snap.status === 'Restoring';

                  return (
                    <tr key={snap.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{snap.name}</div>
                            <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{snap.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-md text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                          <Server className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          {snap.containerName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div>{snap.config.port ? `Port :${snap.config.port}` : 'Standard'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{snap.imageTag}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{snap.createdAt}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{snap.creator}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{snap.size}</td>
                      <td className="py-3.5 px-4">
                        {isRestoring ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            Restoring...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingSnapshot(snap)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Inspect Snapshot Configuration"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRestore(snap)}
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/60 text-purple-700 border border-purple-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Restore container to this snapshot"
                          >
                            <RotateCcw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => exportSnapshot(snap.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Export JSON Configuration"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete snapshot "${snap.name}"?`)) {
                                deleteSnapshot(snap.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                            title="Delete Snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Details & Configuration Modal */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{viewingSnapshot.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {viewingSnapshot.id} · Container: {viewingSnapshot.containerName} · Created: {viewingSnapshot.createdAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSnapshot(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Snapshot Info summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-sans">Port Binding</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSnapshot.config.port}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-sans">Runtime</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSnapshot.config.runtime || 'Node.js'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-sans">Memory Limit</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSnapshot.config.resourceLimits?.memoryLimit || '1024 MB'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-sans">Backup Size</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSnapshot.size}</span>
                </div>
              </div>

              {viewingSnapshot.notes && (
                <div className="p-3 bg-purple-50/70 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 rounded-xl text-purple-900 dark:text-purple-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[11px]">Snapshot Notes:</span>
                    <span className="text-xs text-purple-800 dark:text-purple-300">{viewingSnapshot.notes}</span>
                  </div>
                </div>
              )}

              {/* Environment Variables Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-between">
                  <span>Environment Variables ({Object.keys(viewingSnapshot.config.environmentVariables || {}).length})</span>
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 dark:bg-slate-950 text-slate-200 font-mono p-3 text-[11px] max-h-48 overflow-y-auto space-y-1.5">
                  {Object.entries(viewingSnapshot.config.environmentVariables || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between border-b border-slate-800 pb-1 last:border-0 last:pb-0">
                      <span className="text-emerald-400">{key}:</span>
                      <span className="text-slate-300 font-mono">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON Config View */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Raw Configuration Manifest</h4>
                  <button
                    onClick={() => handleCopyConfig(viewingSnapshot.config)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                  >
                    {copiedKey === 'full' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'full' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                  {JSON.stringify(viewingSnapshot.config, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => exportSnapshot(viewingSnapshot.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Export JSON</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingSnapshot(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const snap = viewingSnapshot;
                    setViewingSnapshot(null);
                    handleRestore(snap);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore This Snapshot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Snapshot Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create Container Snapshot</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualCreateSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Target Container</label>
                <select
                  value={targetContainer}
                  onChange={(e) => setTargetContainer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="GitHub MCP">GitHub MCP</option>
                  <option value="Postgres MCP">Postgres MCP</option>
                  <option value="Google Drive MCP">Google Drive MCP</option>
                  <option value="Slack MCP">Slack MCP</option>
                  <option value="Brave Search MCP">Brave Search MCP</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Snapshot Name (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g. ${targetContainer} - Pre-update Backup`}
                  value={customSnapshotName}
                  onChange={(e) => setCustomSnapshotName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Reason for snapshot, pending changes, or staging tag..."
                  value={snapshotNotes}
                  onChange={(e) => setSnapshotNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-sm transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
