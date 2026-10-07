import React, { createContext, useContext, useState, useEffect } from 'react';
import { ContainerSnapshot, INITIAL_SNAPSHOTS } from '../types/snapshots';
import { useToast } from './ToastContext';
import { useAuditLog } from './AuditLogContext';

interface SnapshotsContextType {
  snapshots: ContainerSnapshot[];
  createSnapshot: (containerName: string, customName?: string, notes?: string) => ContainerSnapshot;
  deleteSnapshot: (snapshotId: string) => void;
  restoreSnapshot: (snapshotId: string) => Promise<boolean>;
  exportSnapshot: (snapshotId: string) => void;
}

const STORAGE_KEY = 'mcp_container_snapshots';

const SnapshotsContext = createContext<SnapshotsContextType | undefined>(undefined);

export function SnapshotsProvider({ children }: { children: React.ReactNode }) {
  const [snapshots, setSnapshots] = useState<ContainerSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse snapshots from localStorage:', e);
    }
    return INITIAL_SNAPSHOTS;
  });

  const { addToast } = useToast();
  const { addLog } = useAuditLog();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed to persist snapshots:', e);
    }
  }, [snapshots]);

  const createSnapshot = (containerName: string, customName?: string, notes?: string): ContainerSnapshot => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const dateTag = new Date().toISOString().slice(0, 10);
    const snapshotName = customName?.trim() || `${containerName} - Snapshot ${dateTag}`;
    const id = `snap-${Math.random().toString(36).substring(2, 9)}`;

    // Build dynamic realistic configuration based on the container name
    let port = 8080;
    let runtime = 'Node.js 20 (Slim)';
    let imageTag = `ghcr.io/modelcontextprotocol/servers/${containerName.toLowerCase().replace(/\s+/g, '-')}:latest`;
    let envVars: Record<string, string> = {
      NODE_ENV: 'production',
      MCP_LOG_LEVEL: 'info',
      PORT: '8080',
    };

    if (containerName.toLowerCase().includes('github')) {
      port = 8080;
      runtime = 'Node.js 20 (Slim)';
      imageTag = 'ghcr.io/modelcontextprotocol/servers/github:v1.2.0';
      envVars = {
        GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_••••••••••••••••••••••••••••',
        MCP_LOG_LEVEL: 'info',
        PORT: '8080',
        MAX_REQUESTS_PER_MINUTE: '120',
      };
    } else if (containerName.toLowerCase().includes('postgres')) {
      port = 8081;
      runtime = 'Python 3.11 (Minimal)';
      imageTag = 'ghcr.io/modelcontextprotocol/servers/postgres:v1.0.3';
      envVars = {
        DATABASE_URL: 'postgresql://postgres:••••••••@localhost:5432/mcp_db',
        MAX_POOL_SIZE: '10',
        PORT: '8081',
      };
    } else if (containerName.toLowerCase().includes('drive')) {
      port = 8082;
      runtime = 'Node.js 20 (Slim)';
      imageTag = 'ghcr.io/modelcontextprotocol/servers/gdrive:v1.1.4';
      envVars = {
        GOOGLE_APPLICATION_CREDENTIALS: '/secrets/credentials.json',
        PORT: '8082',
        SYNC_INTERVAL: '3600',
      };
    } else if (containerName.toLowerCase().includes('slack')) {
      port = 8083;
      runtime = 'Node.js 20 (Slim)';
      imageTag = 'ghcr.io/modelcontextprotocol/servers/slack:v1.0.0';
      envVars = {
        SLACK_BOT_TOKEN: 'xoxb-••••••••••••••••••••••••',
        SLACK_APP_TOKEN: 'xapp-••••••••••••••••••••••••',
        PORT: '8083',
      };
    }

    const newSnapshot: ContainerSnapshot = {
      id,
      name: snapshotName,
      containerName,
      createdAt: timestamp,
      creator: 'angus@fairhaven.za.net',
      imageTag,
      status: 'Ready',
      size: `${(Math.random() * 5 + 10).toFixed(1)} KB`,
      config: {
        containerName,
        port,
        runtime,
        logLevel: 'info',
        healthCheckIntervalSeconds: 15,
        environmentVariables: envVars,
        volumes: ['/var/data/mcp:/data'],
        resourceLimits: {
          cpuLimit: '1.5 cores',
          memoryLimit: '1024 MB',
        },
        network: 'mcp-bridge',
      },
      notes: notes || `Manual configuration backup created from Dashboard for ${containerName}`,
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);

    addToast({
      type: 'success',
      title: 'Snapshot Created',
      message: `Successfully captured configuration backup "${snapshotName}".`,
    });

    addLog({
      category: 'Configuration',
      action: 'SNAPSHOT_CREATE',
      description: `Created snapshot "${snapshotName}" (${newSnapshot.id}) for container ${containerName}`,
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });

    return newSnapshot;
  };

  const deleteSnapshot = (snapshotId: string) => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));

    addToast({
      type: 'info',
      title: 'Snapshot Deleted',
      message: snap ? `Removed snapshot "${snap.name}".` : 'Snapshot deleted.',
    });

    if (snap) {
      addLog({
        category: 'Configuration',
        action: 'SNAPSHOT_DELETE',
        description: `Deleted configuration snapshot "${snap.name}" (${snap.id})`,
        actor: 'angus@fairhaven.za.net',
        status: 'Warning',
      });
    }
  };

  const restoreSnapshot = async (snapshotId: string): Promise<boolean> => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return false;

    // Simulate snapshot rollback / restore process
    setSnapshots((prev) =>
      prev.map((s) => (s.id === snapshotId ? { ...s, status: 'Restoring' } : s))
    );

    addToast({
      type: 'info',
      title: 'Restoring Snapshot',
      message: `Applying configuration from "${snap.name}" to ${snap.containerName}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSnapshots((prev) =>
      prev.map((s) => (s.id === snapshotId ? { ...s, status: 'Ready' } : s))
    );

    addToast({
      type: 'success',
      title: 'Snapshot Restored',
      message: `Container ${snap.containerName} successfully restored to snapshot state.`,
    });

    addLog({
      category: 'Configuration',
      action: 'SNAPSHOT_RESTORE',
      description: `Restored container ${snap.containerName} configuration from snapshot "${snap.name}" (${snap.id})`,
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });

    return true;
  };

  const exportSnapshot = (snapshotId: string) => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${snap.containerName.toLowerCase().replace(/\s+/g, '-')}-snapshot-${snap.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      type: 'success',
      title: 'Snapshot Exported',
      message: `Downloaded configuration file for "${snap.name}".`,
    });
  };

  return (
    <SnapshotsContext.Provider
      value={{
        snapshots,
        createSnapshot,
        deleteSnapshot,
        restoreSnapshot,
        exportSnapshot,
      }}
    >
      {children}
    </SnapshotsContext.Provider>
  );
}

export function useSnapshots() {
  const context = useContext(SnapshotsContext);
  if (!context) {
    throw new Error('useSnapshots must be used within a SnapshotsProvider');
  }
  return context;
}
