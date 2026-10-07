/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ServerCatalog from './components/ServerCatalog';
import ConfigurationEditor from './components/ConfigurationEditor';
import Logs from './components/Logs';
import Settings from './components/Settings';
import AuditLog from './components/AuditLog';
import ContainerTerminal from './components/ContainerTerminal';
import Snapshots from './components/Snapshots';
import HealthReportModal from './components/HealthReportModal';
import { Activity, ShieldCheck, GitCommit, AlertTriangle, ArrowRight, RefreshCw, Zap, Rocket, Terminal as TerminalIcon, Camera, Sparkles } from 'lucide-react';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ToastProvider, useToast } from './context/ToastContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuditLogProvider, useAuditLog } from './context/AuditLogContext';
import { SnapshotsProvider, useSnapshots } from './context/SnapshotsContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import DeployWizard, { DeploymentConfig, PREDEFINED_TEMPLATES, ServerCatalogItem } from './components/DeployWizard';

export interface DeploymentItem {
  id: string;
  name: string;
  timestamp: string;
  status: string;
  uptime: string;
  health: string;
}

interface DeploymentHistoryProps {
  deployments: DeploymentItem[];
  onContainerAction: (action: string, containerName: string) => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

function DeploymentHistory({ deployments, onContainerAction, onBulkAction }: DeploymentHistoryProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'status' | 'uptime'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSort = (field: 'name' | 'status' | 'uptime') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkSubmit = (action: string) => {
    onBulkAction(action, selectedIds);
    setSelectedIds([]);
  };

  const filteredDeployments = deployments.filter(d => {
    if (filterStatus === 'All') return true;
    return d.status === filterStatus;
  });

  const sortedDeployments = [...filteredDeployments].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mt-8 transition-colors">
      {selectedIds.length > 0 && (
        <div className="absolute -top-12 left-0 right-0 bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between shadow-lg border border-slate-700">
          <span className="text-xs font-medium">{selectedIds.length} container(s) selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkSubmit('Stop')}
              className="text-xs px-2.5 py-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded text-white transition-colors"
            >
              Stop
            </button>
            <button
              onClick={() => handleBulkSubmit('Restart')}
              className="text-xs px-2.5 py-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded text-white transition-colors"
            >
              Restart
            </button>
            <button
              onClick={() => handleBulkSubmit('Delete')}
              className="text-xs px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Deployments</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Filter Status:</span>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
          >
            <option value="All">All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-left">
            <th className="pb-2 font-medium w-8">
              <input 
                type="checkbox" 
                onChange={() => setSelectedIds(selectedIds.length === sortedDeployments.length ? [] : sortedDeployments.map(d => d.id))} 
                checked={selectedIds.length === sortedDeployments.length && sortedDeployments.length > 0} 
              />
            </th>
            <th className="pb-2 font-medium cursor-pointer" onClick={() => handleSort('name')}>
              Server {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="pb-2 font-medium">Timestamp</th>
            <th className="pb-2 font-medium cursor-pointer" onClick={() => handleSort('status')}>
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="pb-2 font-medium cursor-pointer" onClick={() => handleSort('uptime')}>
              Uptime {sortField === 'uptime' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="pb-2 font-medium">Last Health Check</th>
            <th className="pb-2 font-medium">Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedDeployments.map((d) => (
            <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors last:border-0">
              <td className="py-3"><input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggleSelection(d.id)} /></td>
              <td className="py-3 text-slate-900 dark:text-slate-100 font-medium">{d.name}</td>
              <td className="py-3 text-slate-500 dark:text-slate-400">{d.timestamp}</td>
              <td className={`py-3 font-medium ${d.status === 'Success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {d.status}
              </td>
              <td className="py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{d.uptime}</td>
              <td className={`py-3 font-medium ${d.health === 'Passing' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {d.health}
              </td>
              <td className="py-3">
                <div className="flex gap-2.5 items-center text-xs font-medium">
                  <button 
                    onClick={() => onContainerAction('Terminal', d.name)} 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors font-mono text-[11px]"
                    title={`Open Terminal for ${d.name}`}
                  >
                    <TerminalIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Terminal</span>
                  </button>
                  <button onClick={() => onContainerAction('Restart', d.name)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">Restart</button>
                  <button onClick={() => onContainerAction('Stop', d.name)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors">Stop</button>
                  <button onClick={() => onContainerAction('Logs', d.name)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">Logs</button>
                  <button 
                    onClick={() => onContainerAction('Create Snapshot', d.name)} 
                    className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors font-medium"
                    title={`Create Snapshot backup for ${d.name}`}
                  >
                    <Camera className="w-3 h-3" />
                    <span>Create Snapshot</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DashboardProps {
  onOpenQuickDeploy?: () => void;
}

function Dashboard({ onOpenQuickDeploy }: DashboardProps) {
  const { settings } = useSettings();
  const { addToast, notifyDeployment } = useToast();
  const { addLog } = useAuditLog();
  const { createSnapshot } = useSnapshots();
  const navigate = useNavigate();

  // Polling & refresh state
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const secondsCounterRef = useRef<number>(20);
  const [scaledHeadroomActive, setScaledHeadroomActive] = useState<boolean>(false);
  const lastAutoScaleTimeRef = useRef<number>(0);

  // Quick Deploy Wizard state
  const [isDeployWizardOpen, setIsDeployWizardOpen] = useState<boolean>(false);
  const [selectedWizardTemplate, setSelectedWizardTemplate] = useState<ServerCatalogItem | null>(null);

  // Container Terminal overlay state
  const [activeTerminalContainer, setActiveTerminalContainer] = useState<DeploymentItem | null>(null);

  // Gemini AI Health Report state
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [isGeneratingHealthReport, setIsGeneratingHealthReport] = useState<boolean>(false);
  const [healthReportMarkdown, setHealthReportMarkdown] = useState<string>('');
  const [healthReportTimestamp, setHealthReportTimestamp] = useState<string>('');
  const [healthReportModel, setHealthReportModel] = useState<string>('gemini-3.8-flash');
  const [healthReportSummary, setHealthReportSummary] = useState<any>(null);

  // Decoupled refs for safe asynchronous telemetry execution
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const scaledHeadroomActiveRef = useRef(scaledHeadroomActive);
  useEffect(() => {
    scaledHeadroomActiveRef.current = scaledHeadroomActive;
  }, [scaledHeadroomActive]);

  // Dynamic resource chart data
  const [chartData, setChartData] = useState([
    { time: '0s', cpu: 22, memory: 44 },
    { time: '5s', cpu: 32, memory: 48 },
    { time: '10s', cpu: 28, memory: 42 },
    { time: '15s', cpu: 48, memory: 62 },
    { time: '20s', cpu: 60, memory: 80 },
  ]);

  const [aggregateData, setAggregateData] = useState([
    { name: 'Containers', cpu: 60, memory: 80 },
  ]);

  // Dynamic deployments list with live uptimes & health statuses
  const [deployments, setDeployments] = useState<DeploymentItem[]>([
    { id: 'd1', name: 'GitHub MCP', timestamp: '2026-10-06 10:45', status: 'Success', uptime: '12h 30m', health: 'Passing' },
    { id: 'd2', name: 'Postgres MCP', timestamp: '2026-10-06 10:30', status: 'Failed', uptime: '0m', health: 'Failing' },
    { id: 'd3', name: 'Google Drive MCP', timestamp: '2026-10-06 09:15', status: 'Success', uptime: '2d 4h', health: 'Passing' },
    { id: 'd4', name: 'Slack MCP', timestamp: '2026-10-06 08:00', status: 'Success', uptime: '4h 12m', health: 'Passing' },
  ]);

  // Current peak usage (last data point in chart)
  const currentCpuPeak = chartData[chartData.length - 1]?.cpu || 60;
  const currentMemoryPeak = chartData[chartData.length - 1]?.memory || 80;

  const isCpuExceeded = currentCpuPeak > settings.cpuThreshold;
  const isMemoryExceeded = currentMemoryPeak > settings.memoryThreshold;
  const hasThresholdAlert = settings.alertOnExceed && (isCpuExceeded || isMemoryExceeded);

  // Generate new resource telemetry sample with stable callback
  const pollMetrics = useCallback(() => {
    secondsCounterRef.current += 5;
    const timeLabel = `${secondsCounterRef.current}s`;

    // Fluctuate CPU (25% - 70%) and Memory (38% - 85%)
    let newCpu = Math.floor(25 + Math.random() * 45);
    let newMemory = Math.floor(40 + Math.random() * 44);

    const currentSettings = settingsRef.current;
    if (scaledHeadroomActiveRef.current) {
      newMemory = Math.min(newMemory, currentSettings.memoryThreshold - 15);
      newCpu = Math.min(newCpu, currentSettings.cpuThreshold - 10);
    }

    setChartData((prev) => [...prev.slice(1), { time: timeLabel, cpu: newCpu, memory: newMemory }]);
    setAggregateData([{ name: 'Containers', cpu: newCpu, memory: newMemory }]);
    setLastUpdated(new Date());

    // Check auto-scaling condition
    if (currentSettings.autoScaleEnabled && (newMemory > currentSettings.memoryThreshold || newCpu > currentSettings.cpuThreshold)) {
      const now = Date.now();
      const cooldownMs = (currentSettings.autoScaleCooldownSeconds || 15) * 1000;
      if (now - lastAutoScaleTimeRef.current > cooldownMs) {
        lastAutoScaleTimeRef.current = now;
        setScaledHeadroomActive(true);

        addLog({
          category: 'Auto-Scaling',
          action: 'AUTO_SCALE_DISPATCHED',
          description: `Autonomous auto-scaler dynamically expanded container memory & CPU headroom (+${currentSettings.autoScaleMaxMemoryBoost}%) following metric breach (Memory: ${newMemory}%, Limit: ${currentSettings.memoryThreshold}%)`,
          actor: 'System Auto-Scaler Engine',
          status: 'Success',
        });

        addToast({
          type: 'success',
          title: 'Auto-Scaling Executed',
          message: `Allocated +${currentSettings.autoScaleMaxMemoryBoost}% dynamic resource headroom to running MCP containers.`,
        });

        // Reset headroom buffer after 12 seconds
        setTimeout(() => {
          setScaledHeadroomActive(false);
        }, 12000);
      }
    }

    // Update deployment health statuses to show live sync
    setDeployments((prev) =>
      prev.map((item) => (item.status === 'Success' ? { ...item, health: 'Passing' } : item))
    );
  }, [addLog, addToast]);

  // Real-time polling interval
  useEffect(() => {
    if (!isLivePolling) return;

    const interval = setInterval(() => {
      pollMetrics();
    }, 3500);

    return () => clearInterval(interval);
  }, [isLivePolling, pollMetrics]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    pollMetrics();
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        type: 'info',
        title: 'Dashboard Refreshed',
        message: 'Resource charts, container health, and deployment statuses updated.',
      });
    }, 400);
  };

  const handleGenerateHealthReport = async () => {
    setIsHealthModalOpen(true);
    setIsGeneratingHealthReport(true);
    try {
      const response = await fetch('/api/health-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployments,
          metrics: {
            cpuCurrent: currentCpuPeak,
            memoryCurrent: currentMemoryPeak,
            cpuThreshold: settings.cpuThreshold,
            memoryThreshold: settings.memoryThreshold,
            autoScaleEnabled: settings.autoScaleEnabled,
            autoScaleBoost: settings.autoScaleMaxMemoryBoost,
            history: chartData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setHealthReportMarkdown(data.report);
      setHealthReportTimestamp(data.timestamp || new Date().toISOString());
      setHealthReportModel(data.model || 'gemini-3.8-flash');
      setHealthReportSummary(data.metricsSummary);

      addLog({
        category: 'Diagnostic Audit',
        action: 'GEMINI_HEALTH_REPORT_GENERATED',
        description: `Triggered Gemini API (gemini-3.8-flash) health & optimization report across ${deployments.length} containers (Peak CPU: ${currentCpuPeak}%, Memory: ${currentMemoryPeak}%)`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });

      addToast({
        type: 'success',
        title: 'Health Report Generated',
        message: 'Gemini analyzed cluster metrics and generated system performance recommendations.',
      });
    } catch (err: any) {
      console.error('Failed to generate health report:', err);
      addToast({
        type: 'error',
        title: 'Report Generation Failed',
        message: err.message || 'Unable to connect to Gemini API endpoint.',
      });
    } finally {
      setIsGeneratingHealthReport(false);
    }
  };

  const handleContainerAction = (action: string, containerName: string) => {
    if (action === 'Restart') {
      addToast({
        type: 'info',
        title: 'Restarting Container',
        message: `Triggered container restart signal for ${containerName}.`,
      });
      addLog({
        category: 'Container Management',
        action: 'CONTAINER_RESTART',
        description: `Restarted container instance ${containerName}`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
      setDeployments((prev) =>
        prev.map((d) => (d.name === containerName ? { ...d, status: 'Success', health: 'Passing', uptime: '1m' } : d))
      );
    } else if (action === 'Stop') {
      addToast({
        type: 'error',
        title: 'Container Stopped',
        message: `Stopped execution for container ${containerName}.`,
      });
      addLog({
        category: 'Container Management',
        action: 'CONTAINER_STOP',
        description: `Stopped execution for container instance ${containerName}`,
        actor: 'angus@fairhaven.za.net',
        status: 'Warning',
      });
      setDeployments((prev) =>
        prev.map((d) => (d.name === containerName ? { ...d, status: 'Failed', health: 'Failing', uptime: '0m' } : d))
      );
    } else if (action === 'Logs') {
      navigate('/logs');
    } else if (action === 'Terminal') {
      const target = deployments.find((d) => d.name === containerName);
      if (target) {
        setActiveTerminalContainer(target);
      }
    } else if (action === 'Create Snapshot') {
      const snap = createSnapshot(containerName);
      navigate('/snapshots');
    }
  };

  const handleConfirmDeploy = async (config: DeploymentConfig) => {
    const success = await notifyDeployment(config.server.name);
    if (success) {
      const newDeployment: DeploymentItem = {
        id: 'd-' + Math.random().toString(36).substring(2, 7),
        name: config.server.name,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'Success',
        uptime: '1m',
        health: 'Passing',
      };
      setDeployments((prev) => [newDeployment, ...prev]);

      addLog({
        category: 'Deployment',
        action: 'CONTAINER_LAUNCH',
        description: `Successfully deployed ${config.server.name} container (${config.imageTag}) on port ${config.port} via Quick Deploy Wizard`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
    } else {
      const failedDeployment: DeploymentItem = {
        id: 'd-' + Math.random().toString(36).substring(2, 7),
        name: config.server.name,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'Failed',
        uptime: '0m',
        health: 'Failing',
      };
      setDeployments((prev) => [failedDeployment, ...prev]);

      addLog({
        category: 'Deployment',
        action: 'CONTAINER_LAUNCH_FAILED',
        description: `Quick deploy failed for ${config.server.name}: Docker build exited with code 1`,
        actor: 'angus@fairhaven.za.net',
        status: 'Failed',
      });
    }
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    addToast({
      type: action === 'Delete' ? 'error' : 'info',
      title: `Bulk ${action}`,
      message: `Executed "${action}" operation on ${ids.length} container(s).`,
    });
    addLog({
      category: 'Container Management',
      action: `BULK_${action.toUpperCase()}`,
      description: `Executed bulk ${action} operation on ${ids.length} container instance(s)`,
      actor: 'angus@fairhaven.za.net',
      status: action === 'Delete' ? 'Warning' : 'Success',
    });

    if (action === 'Delete') {
      setDeployments((prev) => prev.filter((d) => !ids.includes(d.id)));
    } else if (action === 'Stop') {
      setDeployments((prev) =>
        prev.map((d) => (ids.includes(d.id) ? { ...d, status: 'Failed', health: 'Failing' } : d))
      );
    } else if (action === 'Restart') {
      setDeployments((prev) =>
        prev.map((d) => (ids.includes(d.id) ? { ...d, status: 'Success', health: 'Passing', uptime: '1m' } : d))
      );
    }
  };

  const stats = [
    { title: 'Active Containers', value: `${deployments.filter(d => d.status === 'Success').length}`, icon: Activity, status: 'online' },
    { title: 'System Health', value: hasThresholdAlert ? 'Warning' : 'Healthy', icon: ShieldCheck, status: hasThresholdAlert ? 'warning' : 'online' },
    { title: 'Recent Deployments', value: `${deployments.length}`, icon: GitCommit, status: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time container metrics, live resource monitoring, and deployment activity.
          </p>
        </div>

        {/* Real-time Polling & Quick Deploy Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Generate Health Report Button (Gemini AI Diagnostics) */}
          <button
            onClick={handleGenerateHealthReport}
            disabled={isGeneratingHealthReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/80 rounded-lg transition-colors shadow-sm disabled:opacity-60"
            title="Trigger Gemini API to analyze current container metrics and generate a markdown summary report"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-400 ${isGeneratingHealthReport ? 'animate-spin' : ''}`} />
            {isGeneratingHealthReport ? 'Analyzing...' : 'Generate Health Report'}
          </button>

          {/* Quick Deploy Button */}
          <button
            onClick={() => {
              if (onOpenQuickDeploy) {
                onOpenQuickDeploy();
              } else {
                setSelectedWizardTemplate(PREDEFINED_TEMPLATES[0]);
                setIsDeployWizardOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white rounded-lg transition-colors shadow-sm"
            title="Rapidly start a new container from a predefined template"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            Quick Deploy
          </button>

          {/* Auto-Scale Status Indicator Badge */}
          <button
            onClick={() => navigate('/settings')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              settings.autoScaleEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/60'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
            }`}
            title="Configure Auto-Scale Policies in Settings"
          >
            <Zap className={`w-3.5 h-3.5 ${settings.autoScaleEnabled ? 'text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
            {settings.autoScaleEnabled ? `Auto-Scale: Active (+${settings.autoScaleMaxMemoryBoost}%)` : 'Auto-Scale: Off'}
          </button>

          {/* Live Polling Toggle */}
          <button
            onClick={() => setIsLivePolling((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-sm ${
              isLivePolling
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/60'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
            }`}
            title="Toggle background telemetry polling"
          >
            <span className={`w-2 h-2 rounded-full ${isLivePolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
            {isLivePolling ? 'Real-Time: Active' : 'Real-Time: Paused'}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors shadow-sm disabled:opacity-60"
            title="Refresh metrics immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`} />
            Refresh
          </button>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden md:inline">
            Synced: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Visual Resource Threshold Alert Banner */}
      {hasThresholdAlert && (
        <div className="p-4 bg-red-950 text-red-100 border border-red-800 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-900/80 rounded-xl text-red-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-300">
                Resource Utilization Warning
              </h3>
              <p className="text-xs text-red-200/90 mt-0.5 leading-relaxed">
                {isMemoryExceeded && `Container Memory utilization (${currentMemoryPeak}%) exceeds configured limit (${settings.memoryThreshold}%). `}
                {isCpuExceeded && `Container CPU utilization (${currentCpuPeak}%) exceeds configured limit (${settings.cpuThreshold}%). `}
                {settings.autoScaleEnabled && 'Auto-scaler is actively adjusting container buffers.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors shrink-0"
          >
            Adjust Thresholds
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</span>
              </div>
              {stat.status && (
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    stat.status === 'online'
                      ? 'bg-emerald-500'
                      : stat.status === 'warning'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                />
              )}
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
          </div>
        ))}
      </div>
      
      {/* Resource Usage Charts with Dynamic Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resource Usage (Area)</h2>
              {isLivePolling && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" title="Streaming telemetry" />
              )}
            </div>
            {isCpuExceeded && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-900 uppercase">
                CPU Alert (&gt;{settings.cpuThreshold}%)
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} name="CPU %" />
                <Area type="monotone" dataKey="memory" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.4} name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resource Utilization (Aggregate)</h2>
            {isMemoryExceeded && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-900 uppercase">
                Memory Alert (&gt;{settings.memoryThreshold}%)
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="cpu" fill="#a855f7" name="CPU %" />
                <Bar dataKey="memory" fill={isMemoryExceeded ? '#ef4444' : '#10b981'} name="Memory %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DeploymentHistory
        deployments={deployments}
        onContainerAction={handleContainerAction}
        onBulkAction={handleBulkAction}
      />

      {/* Quick Deploy Wizard Overlay */}
      {isDeployWizardOpen && (
        <DeployWizard
          server={selectedWizardTemplate}
          isOpen={isDeployWizardOpen}
          onClose={() => setIsDeployWizardOpen(false)}
          onConfirmDeploy={handleConfirmDeploy}
        />
      )}

      {/* Interactive Container Terminal Overlay */}
      {activeTerminalContainer && (
        <ContainerTerminal
          container={activeTerminalContainer}
          isOpen={!!activeTerminalContainer}
          onClose={() => setActiveTerminalContainer(null)}
        />
      )}

      {/* Gemini AI Health Report Modal */}
      <HealthReportModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        report={healthReportMarkdown}
        isLoading={isGeneratingHealthReport}
        onRegenerate={handleGenerateHealthReport}
        timestamp={healthReportTimestamp}
        model={healthReportModel}
        metricsSummary={healthReportSummary}
      />
    </div>
  );
}

function AppContent() {
  const [globalDeployWizardOpen, setGlobalDeployWizardOpen] = useState(false);
  const { notifyDeployment } = useToast();
  const { addLog } = useAuditLog();

  const handleGlobalConfirmDeploy = async (config: DeploymentConfig) => {
    const success = await notifyDeployment(config.server.name);
    if (success) {
      addLog({
        category: 'Deployment',
        action: 'CONTAINER_LAUNCH',
        description: `Successfully deployed ${config.server.name} container (${config.imageTag}) on port ${config.port} via Quick Deploy Wizard`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
    } else {
      addLog({
        category: 'Deployment',
        action: 'CONTAINER_LAUNCH_FAILED',
        description: `Quick deploy failed for ${config.server.name}: Docker build exited with code 1`,
        actor: 'angus@fairhaven.za.net',
        status: 'Failed',
      });
    }
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onQuickDeploy={() => setGlobalDeployWizardOpen(true)} />
          <main className="p-8 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard onOpenQuickDeploy={() => setGlobalDeployWizardOpen(true)} />} />
              <Route path="/catalog" element={<ServerCatalog />} />
              <Route path="/config" element={<ConfigurationEditor />} />
              <Route path="/snapshots" element={<Snapshots />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>

      {globalDeployWizardOpen && (
        <DeployWizard
          server={PREDEFINED_TEMPLATES[0]}
          isOpen={globalDeployWizardOpen}
          onClose={() => setGlobalDeployWizardOpen(false)}
          onConfirmDeploy={handleGlobalConfirmDeploy}
        />
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuditLogProvider>
          <ToastProvider>
            <SnapshotsProvider>
              <AppContent />
            </SnapshotsProvider>
          </ToastProvider>
        </AuditLogProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
