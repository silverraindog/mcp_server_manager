import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: 'Configuration' | 'Container Management' | 'System Settings' | 'Deployment';
  action: string;
  description: string;
  actor: string;
  status: 'Success' | 'Warning' | 'Failed';
}

interface AuditLogContextType {
  logs: AuditLogEntry[];
  addLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  exportLogs: () => void;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-05 22:10:05',
    category: 'Deployment',
    action: 'CONTAINER_LAUNCH',
    description: 'Launched GitHub MCP container (v1.2.0-stable) on port 8080',
    actor: 'angus@fairhaven.za.net',
    status: 'Success',
  },
  {
    id: 'log-2',
    timestamp: '2026-10-05 21:55:12',
    category: 'Configuration',
    action: 'SAVE_CONFIG',
    description: 'Updated server environment configuration (MCP_LOG_LEVEL=info)',
    actor: 'angus@fairhaven.za.net',
    status: 'Success',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-05 21:40:00',
    category: 'System Settings',
    action: 'UPDATE_THRESHOLDS',
    description: 'Set CPU alert threshold to 75% and Memory threshold to 75%',
    actor: 'angus@fairhaven.za.net',
    status: 'Success',
  },
  {
    id: 'log-4',
    timestamp: '2026-10-05 20:45:33',
    category: 'Container Management',
    action: 'CONTAINER_STOP',
    description: 'Stopped execution for container Postgres MCP due to health check timeout',
    actor: 'angus@fairhaven.za.net',
    status: 'Warning',
  },
  {
    id: 'log-5',
    timestamp: '2026-10-05 19:30:15',
    category: 'Deployment',
    action: 'CONTAINER_LAUNCH',
    description: 'Launched Google Drive MCP container (v2.1.0) on port 8082',
    actor: 'angus@fairhaven.za.net',
    status: 'Success',
  },
];

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export const AuditLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('mcp_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_AUDIT_LOGS;
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('mcp_audit_logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AuditLogContext.Provider value={{ logs, addLog, clearLogs, exportLogs }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};
