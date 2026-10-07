import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2, Play, CornerDownLeft, Copy, Check, Shield, Circle } from 'lucide-react';
import { DeploymentItem } from '../App';
import { useAuditLog } from '../context/AuditLogContext';

interface ContainerTerminalProps {
  container: DeploymentItem;
  isOpen: boolean;
  onClose: () => void;
}

interface CommandHistoryEntry {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: string;
}

export default function ContainerTerminal({ container, isOpen, onClose }: ContainerTerminalProps) {
  const { addLog } = useAuditLog();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputCommand, setInputCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize terminal output buffer
  const [lines, setLines] = useState<CommandHistoryEntry[]>([]);

  // Setup initial session banners when opened
  useEffect(() => {
    if (isOpen) {
      const now = new Date().toLocaleTimeString();
      const initialLogs: CommandHistoryEntry[] = [
        {
          type: 'system',
          text: `Connecting to interactive debug shell on container [${container.name}] (id: ${container.id})...`,
          timestamp: now,
        },
        {
          type: 'system',
          text: `Container status: ${container.status} | Uptime: ${container.uptime} | Health: ${container.health}`,
          timestamp: now,
        },
        {
          type: 'output',
          text: `Linux mcp-runtime-node 5.15.0-104-generic #114-Ubuntu SMP x86_64\nDocker container ID: ${container.id}-prod-${container.name.toLowerCase().replace(/\s+/g, '-')}\nMCP Protocol Version: 2024-11-05 (JSON-RPC 2.0 supported)\nType 'help' for a list of MCP diagnostic and debug commands.`,
          timestamp: now,
        },
      ];

      if (container.status === 'Failed') {
        initialLogs.push({
          type: 'error',
          text: `[WARN] Container is marked as Failed / Stopped. Debug terminal is running in rescue/offline container sandbox.`,
          timestamp: now,
        });
      }

      setLines(initialLogs);

      // Audit log the terminal session start
      addLog({
        category: 'Container Management',
        action: 'CONTAINER_TERMINAL_OPEN',
        description: `Opened interactive debug terminal session for container [${container.name}]`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });

      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, container.id, container.name]);

  // Auto-scroll to bottom whenever output updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!isOpen) return null;

  const handleCopyLogs = () => {
    const fullText = lines.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.text}`).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setLines([
      {
        type: 'system',
        text: `Terminal cleared. Container: ${container.name}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCommand.trim();
    if (!cmd) return;

    const time = new Date().toLocaleTimeString();
    
    // Add command to terminal output and command history
    const newEntry: CommandHistoryEntry = {
      type: 'input',
      text: cmd,
      timestamp: time,
    };

    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputCommand('');

    // Process commands
    const lower = cmd.toLowerCase();
    const args = cmd.split(' ');
    const mainCommand = args[0].toLowerCase();

    let responseEntry: CommandHistoryEntry;

    if (mainCommand === 'clear' || mainCommand === 'cls') {
      handleClear();
      return;
    } else if (mainCommand === 'help') {
      responseEntry = {
        type: 'output',
        text: `Available MCP Debug Commands:
  help                     - List available debugging commands
  clear                    - Clear terminal screen
  status                   - Display container state, uptime & health status
  ps                       - Show container running processes
  env                      - Print active environment variables and secrets status
  mcp-ping                 - Send JSON-RPC ping to the MCP server process
  mcp-tools                - List registered MCP tools, schemas, and resource handlers
  logs                     - Tail recent container stderr and stdout entries
  netstat / ports          - Inspect active network listeners and ports
  top / stats              - Check container CPU, memory and thread usage
  reboot / restart         - Trigger in-container soft restart
  curl <endpoint>          - Test internal loopback communication`,
        timestamp: time,
      };
    } else if (mainCommand === 'status') {
      responseEntry = {
        type: 'output',
        text: `Container: ${container.name} (${container.id})
Status: ${container.status.toUpperCase()}
Health: ${container.health}
Uptime: ${container.uptime}
Runtime: Docker Engine v26.1 / MCP Runtime SDK Node v20.15.1
State: ${container.status === 'Success' ? 'RUNNING (Healthy)' : 'EXITED (Code 137 / Out of memory or crash)'}`,
        timestamp: time,
      };
    } else if (mainCommand === 'ps') {
      responseEntry = {
        type: 'output',
        text: `PID   USER     TIME   COMMAND
  1   root     0:12   node /app/dist/index.js --transport=stdio
 28   root     0:01   mcp-healthcheck-daemon --interval=15s
 44   root     0:00   /bin/sh -c interactive-debug-pty
 45   root     0:00   sh`,
        timestamp: time,
      };
    } else if (mainCommand === 'env') {
      responseEntry = {
        type: 'output',
        text: `NODE_ENV=production
MCP_CONTAINER_NAME=${container.name}
MCP_CONTAINER_ID=${container.id}
PORT=8080
LOG_LEVEL=debug
AUTH_TOKEN=******** [HIDDEN]
AUTO_SCALER_ENABLED=true
MCP_PROTOCOL_VERSION=2024-11-05
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
        timestamp: time,
      };
    } else if (mainCommand === 'mcp-ping') {
      responseEntry = {
        type: 'output',
        text: `> Sending JSON-RPC: {"jsonrpc":"2.0","method":"ping","id":"dbg-101"}
< Received JSON-RPC: {"jsonrpc":"2.0","result":{},"id":"dbg-101"}
Roundtrip latency: 3.4ms. MCP server process responded OK.`,
        timestamp: time,
      };
    } else if (mainCommand === 'mcp-tools') {
      responseEntry = {
        type: 'output',
        text: `Registered MCP Tools in [${container.name}]:
  1. execute_query        - Query or inspect backend data
  2. get_schema           - Retrieve schema definitions & metadata
  3. search_records       - Full-text tokenized search
  4. list_resources       - MCP protocol resource enumeration
  5. subscribe_feed       - Real-time event streams`,
        timestamp: time,
      };
    } else if (mainCommand === 'logs' || mainCommand === 'tail') {
      responseEntry = {
        type: 'output',
        text: `[INFO] [${container.name}] Connection established via StdioServerTransport
[DEBUG] Initializing stdio transport pipes
[INFO] Server capabilities verified: tools, prompts, resources
[DEBUG] Received client initialization handshake
[INFO] Ready to process incoming tool requests`,
        timestamp: time,
      };
    } else if (mainCommand === 'netstat' || mainCommand === 'ports') {
      responseEntry = {
        type: 'output',
        text: `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:8080            0.0.0.0:*               LISTEN      1/node              
tcp6       0      0 :::8080                 :::*                    LISTEN      1/node`,
        timestamp: time,
      };
    } else if (mainCommand === 'top' || mainCommand === 'stats') {
      responseEntry = {
        type: 'output',
        text: `CPU: 18.4% | Memory: 312MB / 1024MB (30.4%) | Threads: 12 | FD Count: 38
I/O Read: 1.2MB/s | I/O Write: 340KB/s | Net TX/RX: 4.8MB / 12.1MB`,
        timestamp: time,
      };
    } else if (mainCommand === 'reboot' || mainCommand === 'restart') {
      responseEntry = {
        type: 'system',
        text: `Sending SIGTERM to process PID 1... Process gracefully stopped. Spawning fresh worker process... Container worker re-attached successfully.`,
        timestamp: time,
      };
      addLog({
        category: 'Container Management',
        action: 'CONTAINER_TERMINAL_RESTART',
        description: `Triggered container soft restart from interactive terminal on [${container.name}]`,
        actor: 'angus@fairhaven.za.net',
        status: 'Success',
      });
    } else if (mainCommand.startsWith('curl')) {
      responseEntry = {
        type: 'output',
        text: `HTTP/1.1 200 OK
Content-Type: application/json
Date: ${new Date().toUTCString()}
Connection: keep-alive

{"status":"ok","server":"${container.name}","version":"1.0.0","uptime":"${container.uptime}"}`,
        timestamp: time,
      };
    } else {
      responseEntry = {
        type: 'error',
        text: `bash: ${args[0]}: command not found. Type 'help' for available MCP debugging commands.`,
        timestamp: time,
      };
    }

    setLines(prev => [...prev, newEntry, responseEntry]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputCommand(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputCommand('');
      } else {
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex]);
      }
    }
  };

  const quickCommands = ['help', 'status', 'ps', 'mcp-ping', 'mcp-tools', 'stats', 'env', 'logs'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className={`bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded ? 'w-[98vw] h-[94vh]' : 'w-full max-w-4xl h-[650px]'
        }`}
      >
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer transition-colors" onClick={onClose} title="Close" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 cursor-pointer transition-colors" onClick={() => setIsExpanded(!isExpanded)} title="Toggle Size" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 cursor-pointer transition-colors" onClick={handleClear} title="Clear Screen" />
            </div>
            
            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200 tracking-wide font-mono">
                {container.name}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {container.id}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                container.status === 'Success' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                  : 'bg-red-950 text-red-400 border border-red-800/60'
              }`}>
                <Circle className={`w-1.5 h-1.5 fill-current ${container.status === 'Success' ? 'animate-pulse' : ''}`} />
                {container.status === 'Success' ? 'Live Shell' : 'Rescue Shell'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700/80 transition-colors"
              title="Copy session output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700/80 transition-colors"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Restore' : 'Maximize'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Close Terminal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Command Toolbar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 overflow-x-auto text-xs">
          <span className="text-slate-500 font-medium mr-1 text-[11px] whitespace-nowrap">Quick Commands:</span>
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setInputCommand(cmd);
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 border border-slate-700/60 text-slate-300 font-mono text-[11px] transition-colors whitespace-nowrap"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Terminal Screen / Output Body */}
        <div 
          className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 space-y-2 bg-slate-950"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line, idx) => (
            <div key={idx} className="leading-relaxed whitespace-pre-wrap">
              {line.type === 'input' && (
                <div className="flex items-start gap-2 text-emerald-400">
                  <span className="text-slate-500 select-none">root@{container.name.toLowerCase().replace(/\s+/g, '-')}:~#</span>
                  <span className="font-semibold">{line.text}</span>
                </div>
              )}
              {line.type === 'output' && (
                <div className="text-slate-300 pl-4 border-l border-slate-800">
                  {line.text}
                </div>
              )}
              {line.type === 'error' && (
                <div className="text-red-400 pl-4 border-l border-red-800/70 bg-red-950/20 py-1 rounded-r">
                  {line.text}
                </div>
              )}
              {line.type === 'system' && (
                <div className="text-cyan-400/90 italic pl-4 border-l border-cyan-800/60 bg-cyan-950/10 py-0.5">
                  [SYSTEM] {line.text}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Interactive Command Input Prompt */}
        <form onSubmit={handleExecute} className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs select-none">
            <span className="font-bold">root@{container.name.toLowerCase().replace(/\s+/g, '-')}:~#</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'help' or any container command..."
            className="flex-1 bg-transparent text-slate-100 font-mono text-xs outline-none placeholder:text-slate-600 caret-emerald-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>Exec</span>
          </button>
        </form>

        {/* Footer info strip */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>Protocol: stdio/JSON-RPC</span>
            <span>Encoding: UTF-8</span>
            <span>TTY: /dev/pts/1</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Use &uarr;&darr; for history</span>
            <span>&bull;</span>
            <span>ESC / Click Close to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
