import React, { useState, useRef } from 'react';
import { Download, Upload, Save, RefreshCw, FileCode, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuditLog } from '../context/AuditLogContext';

const DEFAULT_CONFIG = {
  serverVersion: "1.2.0",
  port: 8080,
  logLevel: "info",
  maxConcurrentServers: 8,
  enableTelemetry: false,
  healthCheckIntervalSeconds: 15,
  environmentVariables: {
    NODE_ENV: "production",
    MCP_LOG_LEVEL: "debug",
    MAX_PAYLOAD_SIZE: "10MB",
    CONTAINER_NETWORK: "mcp-bridge"
  },
  serverCatalogs: [
    "https://mcpservers.org/api/v1/catalog",
    "https://registry.modelcontextprotocol.io/index.json"
  ]
};

export default function ConfigurationEditor() {
  const [configText, setConfigText] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const { addLog } = useAuditLog();

  const validateJson = (text: string): boolean => {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setConfigText(val);
    validateJson(val);
  };

  const handleSave = () => {
    if (!validateJson(configText)) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Cannot save: Configuration contains JSON syntax errors.',
      });
      return;
    }

    try {
      const parsed = JSON.parse(configText);
      setConfigText(JSON.stringify(parsed, null, 2));
      addToast({
        type: 'success',
        title: 'Configuration Saved',
        message: 'Server environment settings updated and persisted successfully.',
      });
      addLog({
        category: 'Configuration',
        action: 'SAVE_CONFIG',
        description: `Saved server configuration (port ${parsed.port || 8080}, ${Object.keys(parsed.environmentVariables || {}).length} env vars)`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Invalid JSON format.',
      });
    }
  };

  const handleExport = () => {
    if (!validateJson(configText)) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Please fix JSON syntax errors before exporting.',
      });
      return;
    }

    try {
      const blob = new Blob([configText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcp-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Configuration Exported',
        message: 'Downloaded JSON configuration file to your device.',
      });

      addLog({
        category: 'Configuration',
        action: 'EXPORT_CONFIG',
        description: 'Exported active server configuration settings to JSON file',
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Error',
        message: 'Failed to generate download file.',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        setConfigText(formatted);
        setJsonError(null);
        addToast({
          type: 'success',
          title: 'Configuration Imported',
          message: `Successfully loaded settings from "${file.name}".`,
        });
        addLog({
          category: 'Configuration',
          action: 'IMPORT_CONFIG',
          description: `Imported configuration settings from file "${file.name}"`,
          actor: 'angus@fairhaven.za.net',
          status: 'Success',
        });
      } catch (err: any) {
        setJsonError(err.message || 'File is not valid JSON');
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: `File "${file.name}" is not valid JSON syntax.`,
        });
        addLog({
          category: 'Configuration',
          action: 'IMPORT_CONFIG',
          description: `Failed to import configuration from "${file.name}": JSON syntax error`,
          actor: 'angus@fairhaven.za.net',
          status: 'Failed',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(configText);
      setConfigText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      addToast({
        type: 'info',
        title: 'JSON Formatted',
        message: 'Reformatted JSON with standard 2-space indentation.',
      });
    } catch (err: any) {
      setJsonError(err.message);
      addToast({
        type: 'error',
        title: 'Format Error',
        message: 'Fix syntax errors before formatting.',
      });
    }
  };

  const handleReset = () => {
    setConfigText(JSON.stringify(DEFAULT_CONFIG, null, 2));
    setJsonError(null);
    addToast({
      type: 'info',
      title: 'Configuration Reset',
      message: 'Reverted configuration settings to default template.',
    });
    addLog({
      category: 'Configuration',
      action: 'RESET_CONFIG',
      description: 'Reverted server configuration parameters to system default template',
      actor: 'angus@fairhaven.za.net',
      status: 'Success',
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuration Editor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Modify server parameters, port bindings, and container environment variables directly.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
            title="Import configuration JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Import JSON
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
            title="Export configuration JSON file"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Export JSON
          </button>

          <button
            onClick={handleFormat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
            title="Prettify JSON formatting"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Format
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm"
            title="Reset to default template"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reset
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            mcp-server-config.json
          </div>
          <div className="flex items-center gap-3">
            {jsonError ? (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Invalid JSON
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                Valid JSON
              </span>
            )}
          </div>
        </div>

        <textarea
          className={`w-full h-[450px] p-4 font-mono text-xs sm:text-sm bg-slate-950 text-slate-100 focus:outline-none resize-y leading-relaxed ${
            jsonError ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'
          }`}
          value={configText}
          onChange={handleChange}
          spellCheck={false}
        />

        {jsonError && (
          <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/80 border-t border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="truncate">Syntax Error: {jsonError}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Changes apply to newly deployed MCP server containers upon save.
          </p>
          <button
            onClick={handleSave}
            disabled={!!jsonError}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
