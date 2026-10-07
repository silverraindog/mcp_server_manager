export interface ContainerSnapshot {
  id: string;
  name: string; // e.g. "GitHub MCP - Backup 2026-10-07"
  containerName: string; // e.g. "GitHub MCP"
  createdAt: string;
  creator: string;
  imageTag: string;
  status: 'Ready' | 'Restoring';
  size: string;
  config: {
    containerName: string;
    version?: string;
    port: number;
    logLevel?: string;
    runtime?: string;
    healthCheckIntervalSeconds?: number;
    environmentVariables: Record<string, string>;
    volumes?: string[];
    resourceLimits?: {
      cpuLimit: string;
      memoryLimit: string;
    };
    network?: string;
  };
  notes?: string;
}

export const INITIAL_SNAPSHOTS: ContainerSnapshot[] = [
  {
    id: 'snap-gh-01',
    name: 'GitHub MCP - Production Baseline',
    containerName: 'GitHub MCP',
    createdAt: '2026-10-06 14:22',
    creator: 'angus@fairhaven.za.net',
    imageTag: 'ghcr.io/modelcontextprotocol/servers/github:v1.2.0',
    status: 'Ready',
    size: '14.2 KB',
    config: {
      containerName: 'GitHub MCP',
      version: '1.2.0',
      port: 8080,
      logLevel: 'info',
      runtime: 'Node.js 20 (Slim)',
      healthCheckIntervalSeconds: 15,
      environmentVariables: {
        GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_••••••••••••••••••••••••••••',
        MCP_LOG_LEVEL: 'info',
        PORT: '8080',
        CACHE_TTL_SECONDS: '300',
        MAX_REQUESTS_PER_MINUTE: '120',
      },
      volumes: ['/var/data/github-cache:/cache'],
      resourceLimits: {
        cpuLimit: '1.5 cores',
        memoryLimit: '1024 MB',
      },
      network: 'mcp-bridge',
    },
    notes: 'Stable configuration backup prior to v1.2.0 update migration.',
  },
  {
    id: 'snap-pg-01',
    name: 'PostgreSQL MCP - Read Replica Staging',
    containerName: 'Postgres MCP',
    createdAt: '2026-10-05 09:15',
    creator: 'angus@fairhaven.za.net',
    imageTag: 'ghcr.io/modelcontextprotocol/servers/postgres:v1.0.3',
    status: 'Ready',
    size: '12.8 KB',
    config: {
      containerName: 'Postgres MCP',
      version: '1.0.3',
      port: 8081,
      logLevel: 'debug',
      runtime: 'Python 3.11 (Minimal)',
      healthCheckIntervalSeconds: 30,
      environmentVariables: {
        DATABASE_URL: 'postgresql://postgres:••••••••@localhost:5432/mcp_db',
        MAX_POOL_SIZE: '10',
        PORT: '8081',
        READ_ONLY: 'true',
      },
      volumes: ['/var/log/pg-mcp:/var/log'],
      resourceLimits: {
        cpuLimit: '2.0 cores',
        memoryLimit: '2048 MB',
      },
      network: 'mcp-bridge',
    },
    notes: 'Configured with read-only pooled database connection.',
  },
  {
    id: 'snap-gd-01',
    name: 'Google Drive MCP - Nightly Snapshot',
    containerName: 'Google Drive MCP',
    createdAt: '2026-10-04 18:00',
    creator: 'system-autobackup',
    imageTag: 'ghcr.io/modelcontextprotocol/servers/gdrive:v1.1.4',
    status: 'Ready',
    size: '11.5 KB',
    config: {
      containerName: 'Google Drive MCP',
      version: '1.1.4',
      port: 8082,
      logLevel: 'info',
      runtime: 'Node.js 20 (Slim)',
      healthCheckIntervalSeconds: 20,
      environmentVariables: {
        GOOGLE_APPLICATION_CREDENTIALS: '/secrets/credentials.json',
        SYNC_INTERVAL: '3600',
        PORT: '8082',
      },
      volumes: ['/secrets/credentials.json:/secrets/credentials.json:ro'],
      resourceLimits: {
        cpuLimit: '1.0 core',
        memoryLimit: '512 MB',
      },
      network: 'mcp-bridge',
    },
    notes: 'Automatic nightly scheduled backup before index re-sync.',
  },
];
