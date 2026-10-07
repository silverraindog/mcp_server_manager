import { useState, useEffect } from 'react';
import { Box, Play, Settings, Search, CheckCircle2, RotateCcw, Rocket } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuditLog } from '../context/AuditLogContext';
import DeployWizard, { ServerCatalogItem, DeploymentConfig } from './DeployWizard';

export default function ServerCatalog() {
  const [search, setSearch] = useState('');
  const [servers, setServers] = useState<ServerCatalogItem[]>([]);
  const [installingIds, setInstallingIds] = useState<Record<string, boolean>>({});
  const [selectedServerForWizard, setSelectedServerForWizard] = useState<ServerCatalogItem | null>(null);
  const { notifyDeployment, addToast } = useToast();
  const { addLog } = useAuditLog();

  useEffect(() => {
    fetch('/api/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item: any, index: number) => ({
            id: item.id || String(index + 1),
            name: item.name || 'MCP Server',
            description: item.description || 'Model Context Protocol Server',
            status: item.status || 'Available',
            version: item.version || '1.0.0'
          }));
          
          if (formatted.length < 4) {
            formatted.push(
              { id: '3', name: 'Google Drive MCP', description: 'Read, write, and index Google Drive documents and folders.', status: 'Installed', version: '2.1.0' },
              { id: '4', name: 'Slack MCP', description: 'Publish alerts and stream channels into AI context.', status: 'Available', version: '0.9.4' },
              { id: '5', name: 'Brave Search MCP', description: 'Enable web search grounding for autonomous agents.', status: 'Available', version: '1.4.1' },
              { id: '6', name: 'Memory / Knowledge Graph MCP', description: 'Graph-based persistent long-term memory store for AI entities.', status: 'Available', version: '1.1.2' }
            );
          }
          setServers(formatted);
        } else {
          setServers([
            { id: '1', name: 'GitHub MCP', description: 'Interact with GitHub repositories, issues, and PRs.', status: 'Installed', version: '1.2.0' },
            { id: '2', name: 'Postgres MCP', description: 'Execute safe SQL queries and inspect database schemas.', status: 'Available', version: '1.0.3' },
            { id: '3', name: 'Google Drive MCP', description: 'Read, write, and index Google Drive documents and folders.', status: 'Installed', version: '2.1.0' },
            { id: '4', name: 'Slack MCP', description: 'Publish alerts and stream channels into AI context.', status: 'Available', version: '0.9.4' },
            { id: '5', name: 'Brave Search MCP', description: 'Enable web search grounding for autonomous agents.', status: 'Available', version: '1.4.1' },
            { id: '6', name: 'Memory / Knowledge Graph MCP', description: 'Graph-based persistent long-term memory store for AI entities.', status: 'Available', version: '1.1.2' }
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch servers:', err);
        setServers([
          { id: '1', name: 'GitHub MCP', description: 'Interact with GitHub repositories, issues, and PRs.', status: 'Installed', version: '1.2.0' },
          { id: '2', name: 'Postgres MCP', description: 'Execute safe SQL queries and inspect database schemas.', status: 'Available', version: '1.0.3' },
          { id: '3', name: 'Google Drive MCP', description: 'Read, write, and index Google Drive documents and folders.', status: 'Installed', version: '2.1.0' },
          { id: '4', name: 'Slack MCP', description: 'Publish alerts and stream channels into AI context.', status: 'Available', version: '0.9.4' },
        ]);
      });
  }, []);

  const handleOpenWizard = (server: ServerCatalogItem) => {
    setSelectedServerForWizard(server);
  };

  const handleConfirmDeploy = async (config: DeploymentConfig) => {
    const serverId = config.server.id;
    setInstallingIds((prev) => ({ ...prev, [serverId]: true }));

    const success = await notifyDeployment(config.server.name);

    setInstallingIds((prev) => ({ ...prev, [serverId]: false }));

    if (success) {
      setServers((prev) =>
        prev.map((s) => (s.id === serverId ? { ...s, status: 'Installed' } : s))
      );
      addLog({
        category: 'Deployment',
        action: 'CONTAINER_LAUNCH',
        description: `Successfully deployed ${config.server.name} container (${config.imageTag}) on port ${config.port}`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
    } else {
      addLog({
        category: 'Deployment',
        action: 'CONTAINER_LAUNCH_FAILED',
        description: `Failed to deploy ${config.server.name} container: Build step exited with code 1`,
        actor: 'angus@fairhaven.za.net',
        status: 'Failed',
      });
    }
  };

  const handleConfigure = (server: ServerCatalogItem) => {
    addToast({
      type: 'info',
      title: 'Container Settings',
      message: `Navigating to environment configuration for ${server.name}.`
    });
  };

  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Server Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and deploy pre-configured Model Context Protocol (MCP) servers with guided container orchestration.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search servers..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServers.map((server) => {
          const isInstalling = !!installingIds[server.id];
          return (
            <div key={server.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Box className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{server.name}</h3>
                      {server.version && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">v{server.version}</span>
                      )}
                    </div>
                  </div>
                  {server.status === 'Installed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{server.description}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {server.status === 'Installed' ? (
                  <>
                    <button
                      onClick={() => handleConfigure(server)}
                      className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure
                    </button>
                    <button
                      onClick={() => handleOpenWizard(server)}
                      disabled={isInstalling}
                      className="flex items-center justify-center p-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Redeploy container wizard"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isInstalling ? 'animate-spin' : ''}`} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenWizard(server)}
                    disabled={isInstalling}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    {isInstalling ? 'Deploying...' : 'Deploy Wizard'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deploy Wizard Overlay Modal */}
      {selectedServerForWizard && (
        <DeployWizard
          server={selectedServerForWizard}
          isOpen={!!selectedServerForWizard}
          onClose={() => setSelectedServerForWizard(null)}
          onConfirmDeploy={handleConfirmDeploy}
        />
      )}
    </div>
  );
}
