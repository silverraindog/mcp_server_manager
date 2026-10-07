import { useState } from 'react';
import { ClipboardList, Search, Download, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Shield } from 'lucide-react';
import { useAuditLog } from '../context/AuditLogContext';

export default function AuditLog() {
  const { logs, clearLogs, exportLogs } = useAuditLog();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Deployment', 'Configuration', 'Container Management', 'System Settings', 'Auto-Scaling', 'Diagnostic Audit'];

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = selectedCategory === 'All' || log.category === selectedCategory;
    const matchesSearch =
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            Administrative Audit Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable timeline of administrative events, configuration updates, and container operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Export Audit Log
          </button>
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Action & Description</th>
              <th className="py-3 px-4">Performed By</th>
              <th className="py-3 px-4 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-[11px]">
                      {log.action}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                      {log.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {log.actor}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {log.status === 'Success' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Success
                      </span>
                    )}
                    {log.status === 'Warning' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Warning
                      </span>
                    )}
                    {log.status === 'Failed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No audit log entries matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] flex items-center justify-between px-4">
          <span>Showing {filteredLogs.length} of {logs.length} administrative events</span>
          <span className="flex items-center gap-1 font-mono">
            <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Audit Logging Active
          </span>
        </div>
      </div>
    </div>
  );
}
