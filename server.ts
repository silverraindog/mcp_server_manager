import express from 'express';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // API route to fetch MCP servers (placeholder logic)
  app.get('/api/catalog', (req, res) => {
    res.json([
      { id: '1', name: 'GitHub MCP', description: 'Interact with GitHub repositories.', status: 'Available' },
      { id: '2', name: 'Postgres MCP', description: 'Query PostgreSQL databases.', status: 'Available' },
    ]);
  });

  app.use(vite.middlewares);

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

createServer();
