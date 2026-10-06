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
import { Activity, ShieldCheck, GitCommit, AlertTriangle, ArrowRight } from 'lucide-react';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ToastProvider, useToast } from './context/ToastContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuditLogProvider, useAuditLog } from './context/AuditLogContext';

const data = [
  { time: '0s', cpu: 20, memory: 40 },
  { time: '5s', cpu: 35, memory: 45 },
  { time: '10s', cpu: 25, memory: 42 },
  { time: '15s', cpu: 50, memory: 60 },
  { time: '20s', cpu: 60, memory: 80 },
];

const resourceData = [
  { name: 'Containers', cpu: 60, memory: 80 },
];

function DeploymentHistory() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'status' | 'uptime'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const { addToast } = useToast();
  const { addLog } = useAuditLog();
  const navigate = useNavigate();

  const deployments = [
    { id: 'd1', name: 'GitHub MCP', timestamp: '2026-10-05 21:00', status: 'Success', uptime: '12h 30m', health: 'Passing' },
    { id: 'd2', name: 'Postgres MCP', timestamp: '2026-10-05 20:45', status: 'Failed', uptime: '0m', health: 'Failing' },
    { id: 'd3', name: 'Google Drive MCP', timestamp: '2026-10-05 19:30', status: 'Success', uptime: '2d 4h', health: 'Passing' },
  ];

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
    } else if (action === 'Logs') {
      navigate('/logs');
    }
  };

  const handleBulkAction = (action: string) => {
    addToast({
      type: action === 'Delete' ? 'error' : 'info',
      title: `Bulk ${action}`,
      message: `Executed "${action}" operation on ${selectedIds.length} container(s).`,
    });
    addLog({
      category: 'Container Management',
      action: `BULK_${action.toUpperCase()}`,
      description: `Executed bulk ${action} operation on ${selectedIds.length} container instance(s)`,
      actor: 'angus@fairhaven.za.net',
      status: action === 'Delete' ? 'Warning' : 'Success',
    });
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
    <div className="relative p-6 bg-white border border-slate-200 rounded-xl shadow-sm mt-8">
      {selectedIds.length > 0 && (
        <div className="absolute -top-12 left-0 right-0 bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between shadow-lg">
          <span className="text-xs font-medium">{selectedIds.length} container(s) selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('Stop')}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors"
            >
              Stop
            </button>
            <button
              onClick={() => handleBulkAction('Restart')}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors"
            >
              Restart
            </button>
            <button
              onClick={() => handleBulkAction('Delete')}
              className="text-xs px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Deployments</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filter Status:</span>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="All">All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-200 text-left">
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
            <tr key={d.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3"><input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggleSelection(d.id)} /></td>
              <td className="py-3 text-slate-900 font-medium">{d.name}</td>
              <td className="py-3 text-slate-500">{d.timestamp}</td>
              <td className={`py-3 font-medium ${d.status === 'Success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {d.status}
              </td>
              <td className="py-3 text-slate-500">{d.uptime}</td>
              <td className={`py-3 font-medium ${d.health === 'Passing' ? 'text-emerald-600' : 'text-red-600'}`}>
                {d.health}
              </td>
              <td className="py-3">
                <div className="flex gap-3 text-xs font-medium">
                  <button onClick={() => handleContainerAction('Restart', d.name)} className="text-slate-600 hover:text-slate-900 transition-colors">Restart</button>
                  <button onClick={() => handleContainerAction('Stop', d.name)} className="text-red-600 hover:text-red-800 transition-colors">Stop</button>
                  <button onClick={() => handleContainerAction('Logs', d.name)} className="text-slate-600 hover:text-slate-900 transition-colors">Logs</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Peak current usage in metrics
  const currentCpuPeak = 60;
  const currentMemoryPeak = 80;

  const isCpuExceeded = currentCpuPeak > settings.cpuThreshold;
  const isMemoryExceeded = currentMemoryPeak > settings.memoryThreshold;
  const hasThresholdAlert = settings.alertOnExceed && (isCpuExceeded || isMemoryExceeded);

  const stats = [
    { title: 'Active Containers', value: '12', icon: Activity, status: 'online' },
    { title: 'System Health', value: hasThresholdAlert ? 'Warning' : 'Healthy', icon: ShieldCheck, status: hasThresholdAlert ? 'warning' : 'online' },
    { title: 'Recent Deployments', value: '3', icon: GitCommit, status: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time container metrics, resource monitoring, and deployment activity.
          </p>
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
          <div key={stat.title} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-500">{stat.title}</span>
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
            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>
      
      {/* Resource Usage Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Resource Usage (Area)</h2>
            {isCpuExceeded && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-md border border-red-200 uppercase">
                CPU Alert (&gt;{settings.cpuThreshold}%)
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" name="CPU %" />
                <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Resource Utilization (Aggregate)</h2>
            {isMemoryExceeded && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-md border border-red-200 uppercase">
                Memory Alert (&gt;{settings.memoryThreshold}%)
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cpu" fill="#8884d8" name="CPU %" />
                <Bar dataKey="memory" fill={isMemoryExceeded ? '#ef4444' : '#82ca9d'} name="Memory %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DeploymentHistory />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuditLogProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="flex min-h-screen bg-slate-50">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="p-8 flex-1">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/catalog" element={<ServerCatalog />} />
                    <Route path="/config" element={<ConfigurationEditor />} />
                    <Route path="/logs" element={<Logs />} />
                    <Route path="/audit-log" element={<AuditLog />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuditLogProvider>
    </SettingsProvider>
  );
}
