import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Server, FileText, Settings as SettingsIcon, LayoutDashboard, ArrowRight, ShieldCheck, Cpu, Rocket, Sun, Moon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'container' | 'page' | 'config' | 'log';
  path: string;
}

interface HeaderProps {
  onQuickDeploy?: () => void;
}

const SEARCH_ITEMS: SearchResult[] = [
  { id: '1', title: 'GitHub MCP Container', subtitle: 'Active container · v1.2.0 · Port 8080', type: 'container', path: '/catalog' },
  { id: '2', title: 'Postgres MCP Container', subtitle: 'Failing container · SQL Query executor', type: 'container', path: '/catalog' },
  { id: '3', title: 'Google Drive MCP', subtitle: 'Active container · Document indexer', type: 'container', path: '/catalog' },
  { id: '4', title: 'Slack MCP', subtitle: 'Available catalog item · Alerts stream', type: 'container', path: '/catalog' },
  { id: '5', title: 'Brave Search MCP', subtitle: 'Available catalog item · Web search grounding', type: 'container', path: '/catalog' },
  { id: '6', title: 'Dashboard Overview', subtitle: 'Metrics, resource utilization, and deployment history', type: 'page', path: '/' },
  { id: '7', title: 'Server Catalog', subtitle: 'Deploy & configure MCP server images', type: 'page', path: '/catalog' },
  { id: '8', title: 'Configuration Editor', subtitle: 'JSON editor for env variables & parameters', type: 'page', path: '/config' },
  { id: '9', title: 'Container Logs Stream', subtitle: 'Real-time stdout/stderr log viewer', type: 'page', path: '/logs' },
  { id: '10', title: 'Threshold & System Settings', subtitle: 'Custom CPU & Memory alert thresholds', type: 'page', path: '/settings' },
  { id: '11', title: 'Container Snapshots & Backups', subtitle: 'Configuration backups, restore points, & manifests', type: 'page', path: '/snapshots' },
  { id: '12', title: 'PORT Config (8080)', subtitle: 'Internal container port binding parameter', type: 'config', path: '/config' },
  { id: '13', title: 'MCP_LOG_LEVEL', subtitle: 'Environment variable flag in config', type: 'config', path: '/config' },
];

export default function Header({ onQuickDeploy }: HeaderProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = query.trim()
    ? SEARCH_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'container':
        return <Server className="w-4 h-4 text-purple-600" />;
      case 'page':
        return <LayoutDashboard className="w-4 h-4 text-blue-600" />;
      case 'config':
        return <SettingsIcon className="w-4 h-4 text-amber-600" />;
      case 'log':
        return <FileText className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-3 flex items-center justify-between gap-4 transition-colors">
      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Global search across containers, configurations, logs, or pages..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Modal Dropdown */}
        {isOpen && query.trim() !== '' && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
              Search Results ({results.length})
            </div>

            {results.length > 0 ? (
              <div className="p-1.5 space-y-1">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching containers or settings found for "{query}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Status Indicators & Header Controls */}
      <div className="flex items-center gap-3 text-xs">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>12 Containers Running</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px] hidden sm:flex">
          <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>CPU Limit: {settings.cpuThreshold}%</span>
        </div>

        {onQuickDeploy && (
          <button
            onClick={onQuickDeploy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white rounded-lg transition-colors shadow-sm"
            title="Launch container with Deploy Wizard"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span className="hidden sm:inline">Quick Deploy</span>
          </button>
        )}

        {/* Global Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border transition-colors flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white shadow-xs"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode (monitoring environment)'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
          )}
        </button>
      </div>
    </header>
  );
}
