import React, { useState, useEffect } from 'react';
import { X, Layers, CheckCircle2, ArrowRight, ArrowLeft, Terminal, Shield, Plus, Trash2, Sparkles } from 'lucide-react';

export interface ServerCatalogItem {
  id: string;
  name: string;
  description: string;
  status: 'Installed' | 'Available' | 'Installing' | 'Running';
  category?: string;
  version?: string;
}

export interface DeploymentConfig {
  server: ServerCatalogItem;
  imageTag: string;
  runtime: string;
  port: number;
  envVars: Array<{ key: string; value: string; isSecret: boolean }>;
  enableHealthCheck: boolean;
}

export interface PredefinedTemplate extends ServerCatalogItem {
  defaultPort: number;
  defaultRuntime: string;
  defaultEnv: Array<{ key: string; value: string; isSecret: boolean }>;
}

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'tpl-github',
    name: 'GitHub MCP',
    description: 'Interact with GitHub repositories, pull requests, issues, and commit histories.',
    status: 'Available',
    version: '1.2.0',
    defaultPort: 8080,
    defaultRuntime: 'Node.js 20 (Slim)',
    defaultEnv: [
      { key: 'GITHUB_PERSONAL_ACCESS_TOKEN', value: 'ghp_live_token_sample99', isSecret: true },
      { key: 'MCP_LOG_LEVEL', value: 'info', isSecret: false },
      { key: 'PORT', value: '8080', isSecret: false },
    ],
  },
  {
    id: 'tpl-postgres',
    name: 'PostgreSQL MCP',
    description: 'Query database schemas, inspect table definitions, and run read-only queries.',
    status: 'Available',
    version: '1.0.3',
    defaultPort: 8081,
    defaultRuntime: 'Python 3.11 (Minimal)',
    defaultEnv: [
      { key: 'DATABASE_URL', value: 'postgresql://postgres:pass@localhost:5432/mcp_db', isSecret: true },
      { key: 'MAX_POOL_SIZE', value: '10', isSecret: false },
      { key: 'PORT', value: '8081', isSecret: false },
    ],
  },
  {
    id: 'tpl-gdrive',
    name: 'Google Drive MCP',
    description: 'Index, read, and write Google Docs, Sheets, and Drive directory files.',
    status: 'Available',
    version: '2.1.0',
    defaultPort: 8082,
    defaultRuntime: 'Node.js 20 (Slim)',
    defaultEnv: [
      { key: 'GOOGLE_DRIVE_FOLDER_ID', value: 'root', isSecret: false },
      { key: 'OAUTH_CLIENT_ID', value: 'mcp-app-client-id.apps.googleusercontent.com', isSecret: true },
      { key: 'PORT', value: '8082', isSecret: false },
    ],
  },
  {
    id: 'tpl-slack',
    name: 'Slack MCP',
    description: 'Stream Slack channel messages and broadcast notifications into AI workspaces.',
    status: 'Available',
    version: '0.9.4',
    defaultPort: 8083,
    defaultRuntime: 'Node.js 20 (Slim)',
    defaultEnv: [
      { key: 'SLACK_BOT_TOKEN', value: 'xoxb-mcp-bot-token-demo', isSecret: true },
      { key: 'DEFAULT_CHANNEL', value: '#mcp-alerts', isSecret: false },
      { key: 'PORT', value: '8083', isSecret: false },
    ],
  },
  {
    id: 'tpl-brave',
    name: 'Brave Search MCP',
    description: 'High-speed web search grounding and page content extraction for autonomous AI.',
    status: 'Available',
    version: '1.4.1',
    defaultPort: 8084,
    defaultRuntime: 'Node.js 20 (Slim)',
    defaultEnv: [
      { key: 'BRAVE_SEARCH_API_KEY', value: 'BSA_sample_live_token', isSecret: true },
      { key: 'SAFE_SEARCH_LEVEL', value: 'moderate', isSecret: false },
      { key: 'PORT', value: '8084', isSecret: false },
    ],
  },
  {
    id: 'tpl-memory',
    name: 'Memory / Knowledge Graph MCP',
    description: 'Graph-based persistent long-term memory store for AI agents across sessions.',
    status: 'Available',
    version: '1.1.2',
    defaultPort: 8085,
    defaultRuntime: 'Python 3.11 (Minimal)',
    defaultEnv: [
      { key: 'GRAPH_STORE_PATH', value: '/data/graph_memory.db', isSecret: false },
      { key: 'ENABLE_VECTOR_INDEX', value: 'true', isSecret: false },
      { key: 'PORT', value: '8085', isSecret: false },
    ],
  },
];

interface DeployWizardProps {
  server?: ServerCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeploy: (config: DeploymentConfig) => Promise<void>;
}

export default function DeployWizard({ server, isOpen, onClose, onConfirmDeploy }: DeployWizardProps) {
  // Use passed server or default to first predefined template
  const initialServer = server || PREDEFINED_TEMPLATES[0];
  const [activeServer, setActiveServer] = useState<ServerCatalogItem>(initialServer);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [imageTag, setImageTag] = useState<string>('v' + (initialServer.version || '1.0.0') + '-stable');
  const [runtime, setRuntime] = useState<string>('Node.js 20 (Slim)');
  const [port, setPort] = useState<number>(8080);
  const [enableHealthCheck, setEnableHealthCheck] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string; isSecret: boolean }>>([
    { key: 'MCP_LOG_LEVEL', value: 'info', isSecret: false },
    { key: 'PORT', value: '8080', isSecret: false },
    { key: 'API_SECRET_KEY', value: 'sk_live_mcp_987123x', isSecret: true },
  ]);

  // Sync state when server prop changes or modal opens
  useEffect(() => {
    const target = server || PREDEFINED_TEMPLATES[0];
    applyTemplate(target);
    setCurrentStep(1);
  }, [server, isOpen]);

  const applyTemplate = (tpl: ServerCatalogItem) => {
    setActiveServer(tpl);
    setImageTag('v' + (tpl.version || '1.0.0') + '-stable');

    const matchingPredefined = PREDEFINED_TEMPLATES.find((p) => p.name.toLowerCase() === tpl.name.toLowerCase() || p.id === tpl.id);
    if (matchingPredefined) {
      setRuntime(matchingPredefined.defaultRuntime);
      setPort(matchingPredefined.defaultPort);
      setEnvVars(matchingPredefined.defaultEnv);
    } else {
      setPort(8080);
      setRuntime('Node.js 20 (Slim)');
    }
  };

  if (!isOpen) return null;

  const handleAddEnv = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '', isSecret: false }]);
  };

  const handleRemoveEnv = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEnvChange = (index: number, field: 'key' | 'value' | 'isSecret', val: any) => {
    setEnvVars((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmDeploy({
        server: activeServer,
        imageTag,
        runtime,
        port,
        envVars: envVars.filter((e) => e.key.trim() !== ''),
        enableHealthCheck,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 dark:bg-slate-800 rounded-lg text-white dark:text-slate-100">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Deploy Wizard: {activeServer.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step {currentStep} of 3 — Configure template, image environment & launch container
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium">
          <div
            className={`py-3 px-4 flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 transition-colors ${
              currentStep === 1
                ? 'bg-slate-900 text-white font-semibold dark:bg-slate-100 dark:text-slate-900'
                : currentStep > 1
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-400 bg-slate-50 dark:bg-slate-850 dark:text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 1 ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              1
            </span>
            Template & Image
          </div>

          <div
            className={`py-3 px-4 flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 transition-colors ${
              currentStep === 2
                ? 'bg-slate-900 text-white font-semibold dark:bg-slate-100 dark:text-slate-900'
                : currentStep > 2
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-400 bg-slate-50 dark:bg-slate-850 dark:text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 2 ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              2
            </span>
            Environment Vars
          </div>

          <div
            className={`py-3 px-4 flex items-center gap-2 transition-colors ${
              currentStep === 3
                ? 'bg-slate-900 text-white font-semibold dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-400 bg-slate-50 dark:bg-slate-850 dark:text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 3 ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              3
            </span>
            Confirmation
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-6">
          {/* STEP 1: Predefined Template & Image Selection */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Predefined Template Quick Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Predefined MCP Template Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PREDEFINED_TEMPLATES.map((tpl) => {
                    const isSelected = activeServer.name === tpl.name;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="font-semibold truncate">{tpl.name}</div>
                        <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          Port {tpl.defaultPort} · v{tpl.version}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Selecting a predefined template pre-loads certified container tags, runtime dependencies, and environment keys.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Image Tag
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['v' + (activeServer.version || '1.0.0') + '-stable', 'latest', 'v2.0.0-rc1', 'alpine-slim'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setImageTag(tag)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        imageTag === tag
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="font-mono text-xs">
                        <span className="block font-medium">{tag}</span>
                        <span className={`text-[10px] ${imageTag === tag ? 'text-slate-300' : 'text-slate-400'}`}>
                          {tag.includes('stable') ? 'Recommended' : 'Container release tag'}
                        </span>
                      </div>
                      {imageTag === tag && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Base Execution Runtime
                </label>
                <select
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="Node.js 20 (Slim)">Node.js 20 (Alpine / Slim Container)</option>
                  <option value="Python 3.11 (Minimal)">Python 3.11 (FastAPI/MCP Runtime)</option>
                  <option value="Rust / Native Binary">Rust / Standalone Binary</option>
                  <option value="Docker-in-Docker Sidecar">Docker-in-Docker Sidecar Agent</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Internal Container Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={enableHealthCheck}
                      onChange={(e) => setEnableHealthCheck(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-medium text-slate-700">Enable Health Probe (/healthz)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Environment Variables */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Environment Variables & Secrets
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-populated from template for {activeServer.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEnv}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variable
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {envVars.map((env, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="text"
                      placeholder="KEY_NAME"
                      value={env.key}
                      onChange={(e) => handleEnvChange(idx, 'key', e.target.value.toUpperCase())}
                      className="w-1/3 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-900 focus:outline-none uppercase"
                    />
                    <input
                      type={env.isSecret ? 'password' : 'text'}
                      placeholder="Value"
                      value={env.value}
                      onChange={(e) => handleEnvChange(idx, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleEnvChange(idx, 'isSecret', !env.isSecret)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        env.isSecret
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                      }`}
                      title={env.isSecret ? 'Secret variable (masked)' : 'Plain text variable'}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveEnv(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Final Summary & Launch Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed space-y-2 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <Terminal className="w-4 h-4" />
                  Container Build Manifest Summary
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 pt-1 text-slate-300">
                  <span>Server Template:</span>
                  <span className="text-white font-semibold">{activeServer.name}</span>

                  <span>Docker Image Tag:</span>
                  <span className="text-amber-300">{imageTag}</span>

                  <span>Base Runtime:</span>
                  <span className="text-slate-200">{runtime}</span>

                  <span>Port Binding:</span>
                  <span className="text-blue-300">0.0.0.0:{port}</span>

                  <span>Health Check:</span>
                  <span className="text-emerald-400">{enableHealthCheck ? 'Active (/healthz)' : 'Disabled'}</span>

                  <span>Configured Env Vars:</span>
                  <span className="text-purple-300">{envVars.length} variables</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Deployment Confirmation Required</span>
                  Launching will generate Dockerfile configurations, build the container image, and start an isolated container instance.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white rounded-xl transition-colors shadow-sm"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Initializing Container...' : 'Confirm & Launch Container'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
