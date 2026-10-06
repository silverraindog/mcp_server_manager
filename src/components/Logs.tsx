import { useState, useEffect } from 'react';

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // In a real implementation, this would be an EventSource or WebSocket connection
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [`[${timestamp}] Container MCP-GitHub: Started successfully`, ...prev].slice(0, 50));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Container Logs</h1>
      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
        {logs.map((log, i) => (
          <div key={i} className="mb-1">{log}</div>
        ))}
      </div>
    </div>
  );
}
