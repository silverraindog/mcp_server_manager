import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API route to fetch MCP servers
  app.get('/api/catalog', (req, res) => {
    res.json([
      { id: '1', name: 'GitHub MCP', description: 'Interact with GitHub repositories, issues, and PRs.', status: 'Installed', version: '1.2.0' },
      { id: '2', name: 'Postgres MCP', description: 'Query PostgreSQL databases and inspect schemas.', status: 'Available', version: '1.0.3' },
      { id: '3', name: 'Google Drive MCP', description: 'Read, write, and index Google Drive documents and folders.', status: 'Installed', version: '2.1.0' },
      { id: '4', name: 'Slack MCP', description: 'Publish alerts and stream channels into AI context.', status: 'Available', version: '0.9.4' },
      { id: '5', name: 'Brave Search MCP', description: 'Enable web search grounding for autonomous agents.', status: 'Available', version: '1.4.1' },
      { id: '6', name: 'Memory / Knowledge Graph MCP', description: 'Graph-based persistent long-term memory store for AI entities.', status: 'Available', version: '1.1.2' },
    ]);
  });

  // Automated health check endpoint
  app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${isProd ? 'production' : 'development'} mode at http://localhost:${PORT}`);
  });
}

createServer();

