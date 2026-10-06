import React, { useState } from 'react';
import { X, Layers, Key, CheckCircle2, ArrowRight, ArrowLeft, Terminal, Shield, Plus, Trash2 } from 'lucide-react';

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

interface DeployWizardProps {
  server: ServerCatalogItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeploy: (config: DeploymentConfig) => Promise<void>;
}

export default function DeployWizard({ server, isOpen, onClose, onConfirmDeploy }: DeployWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [imageTag, setImageTag] = useState<string>('v' + (server.version || '1.0.0') + '-stable');
  const [runtime, setRuntime] = useState<string>('Node.js 20 (Slim)');
  const [port, setPort] = useState<number>(8080);
  const [enableHealthCheck, setEnableHealthCheck] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string; isSecret: boolean }>>([
    { key: 'MCP_LOG_LEVEL', value: 'info', isSecret: false },
    { key: 'PORT', value: '8080', isSecret: false },
    { key: 'API_SECRET_KEY', value: 'sk_live_mcp_987123x', isSecret: true },
  ]);

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
        server,
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Deploy Wizard: {server.name}
              </h2>
              <p className="text-xs text-slate-500">
                Step {currentStep} of 3 — Configure container environment & launch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white text-xs font-medium">
          <div
            className={`py-3 px-4 flex items-center gap-2 border-r border-slate-200 transition-colors ${
              currentStep === 1
                ? 'bg-slate-900 text-white font-semibold'
                : currentStep > 1
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-400 bg-slate-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 1 ? 'bg-white text-slate-900' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              1
            </span>
            Image & Tag
          </div>

          <div
            className={`py-3 px-4 flex items-center gap-2 border-r border-slate-200 transition-colors ${
              currentStep === 2
                ? 'bg-slate-900 text-white font-semibold'
                : currentStep > 2
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-400 bg-slate-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 2 ? 'bg-white text-slate-900' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </span>
            Environment Vars
          </div>

          <div
            className={`py-3 px-4 flex items-center gap-2 transition-colors ${
              currentStep === 3
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-400 bg-slate-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 3 ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-500'
            }`}>
              3
            </span>
            Confirmation
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-6">
          {/* STEP 1: Image & Runtime Selection */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Image Tag
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['v' + (server.version || '1.0.0') + '-stable', 'latest', 'v2.0.0-rc1', 'alpine-slim'].map((tag) => (
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
                    Configure environment flags and API tokens injected at runtime.
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
                  <span>Server Component:</span>
                  <span className="text-white font-semibold">{server.name}</span>

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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
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
