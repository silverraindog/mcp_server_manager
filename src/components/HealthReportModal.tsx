import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Server, 
  Cpu, 
  HardDrive, 
  Code, 
  FileText 
} from 'lucide-react';

interface HealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: string;
  isLoading: boolean;
  onRegenerate: () => void;
  timestamp?: string;
  model?: string;
  metricsSummary?: {
    cpuCurrent: number;
    memoryCurrent: number;
    cpuThreshold: number;
    memoryThreshold: number;
    activeContainers: number;
    failingContainers: number;
  };
}

export default function HealthReportModal({
  isOpen,
  onClose,
  report,
  isLoading,
  onRegenerate,
  timestamp,
  model = 'gemini-3.8-flash',
  metricsSummary,
}: HealthReportModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcp-health-report-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to render markdown content with rich styling
  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let tableRows: string[][] = [];
    let isTable = false;

    const flushTable = (key: string) => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const rows = tableRows.slice(1).filter(r => !r.every(c => c.trim().startsWith('---') || c.trim().startsWith(':---')));

        elements.push(
          <div key={key} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {row.map((col, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                        {renderInlineMarkdown(col.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        isTable = false;
      }
    };

    lines.forEach((line, index) => {
      // Check for table row
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        isTable = true;
        const columns = line.split('|').slice(1, -1);
        tableRows.push(columns);
        return;
      } else if (isTable) {
        flushTable(`table-${index}`);
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 flex items-center gap-2">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-6 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-4 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={index} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 ml-3 my-1">
            <span className="text-emerald-500 dark:text-emerald-400 font-bold mt-1 text-xs">•</span>
            <span className="flex-1 leading-relaxed">{renderInlineMarkdown(line.slice(2))}</span>
          </div>
        );
      } else if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\.\s/)?.[1] || '1';
        const rest = line.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={index} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 ml-3 my-1">
            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold shrink-0">{num}.</span>
            <span className="flex-1 leading-relaxed">{renderInlineMarkdown(rest)}</span>
          </div>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={index} className="my-4 border-slate-200 dark:border-slate-800" />);
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-1.5" />);
      } else {
        elements.push(
          <p key={index} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 my-1 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    });

    if (isTable) {
      flushTable(`table-end`);
    }

    return elements;
  };

  // Helper for inline markdown bold, code, italics
  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Process code `code`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-mono text-xs border border-slate-200 dark:border-slate-700/80">
            {part.slice(1, -1)}
          </code>
        );
      } else if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-slate-500 dark:text-slate-400 italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-all text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/80 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Cluster Health & Optimization Report
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {model}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI diagnostic assessment of active MCP containers, utilization bottlenecks & reliability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Summary Bar */}
        {metricsSummary && (
          <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                Containers: <strong className="text-slate-900 dark:text-slate-200">{metricsSummary.activeContainers} total</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-purple-500" />
                Peak CPU: <strong className={metricsSummary.cpuCurrent > metricsSummary.cpuThreshold ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-900 dark:text-slate-200'}>
                  {metricsSummary.cpuCurrent}%
                </strong> (Limit: {metricsSummary.cpuThreshold}%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                Peak Memory: <strong className={metricsSummary.memoryCurrent > metricsSummary.memoryThreshold ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-900 dark:text-slate-200'}>
                  {metricsSummary.memoryCurrent}%
                </strong> (Limit: {metricsSummary.memoryThreshold}%)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {metricsSummary.failingContainers > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  {metricsSummary.failingContainers} Degraded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  All Passing
                </span>
              )}
            </div>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 dark:border-purple-900/60 border-t-purple-600 dark:border-t-purple-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Analyzing Live Telemetry with Gemini 3.8 Flash...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Correlating memory buffers, CPU trendlines, container uptimes, and auto-scale policies to generate recommendations.
                </p>
              </div>
            </div>
          ) : viewMode === 'raw' ? (
            <div className="relative bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre-wrap">{report}</pre>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {renderFormattedMarkdown(report)}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('formatted')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'formatted'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Formatted
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'raw'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Raw Markdown
              </button>
            </div>

            {timestamp && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                Analyzed at: {new Date(timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? 'Copied' : 'Copy MD'}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
