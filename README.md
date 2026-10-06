# MCP Server Manager

> A web dashboard and container orchestration platform for managing, configuring, deploying, and monitoring Model Context Protocol (MCP) servers.

---

## Overview

**MCP Server Manager** provides an operational control center for Model Context Protocol (MCP) servers. It unifies catalog discovery, container lifecycle management, real-time telemetry, runtime environment configuration, administrative auditing, and automated health checks into a single responsive web interface.

### Key Capabilities

- **MCP Server Catalog**: Browse, search, and deploy pre-configured MCP servers (GitHub, PostgreSQL, Google Drive, Slack, Brave Search, Memory Graph, and custom registries).
- **Interactive Deploy Wizard**: A 3-step confirmation wizard that guides users through Docker image tag selection, runtime execution environment, environment variables, secret masking, and manifest verification before container launch.
- **Real-Time Performance Dashboard**: Live CPU and Memory utilization charts (Area & Aggregate Bar charts using Recharts), active container longevity, uptime tracking, and bulk operations.
- **Resource Alert Thresholds**: Custom user-defined CPU and Memory limits that trigger instant visual warning banners and status indicators across the dashboard.
- **In-Browser JSON Configuration Editor**: Edit, auto-format, validate, import, and export server environment settings and catalog URLs as downloadable `.json` manifests.
- **Live Container Logs Stream**: Real-time stdout/stderr log stream viewer with automated timestamps and container status telemetry.
- **Administrative Audit Trail**: Comprehensive audit log recording all deployments, configuration changes, threshold modifications, and bulk actions with exportable JSON reports.
- **Global Header Search**: Instant search bar across running containers, catalog definitions, environment variables, and application routes.
- **Automated Health Checks**: Built-in container health probes (`/healthz`) for monitoring container reliability and uptime.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router 7
- **Backend & API**: Express, Node.js 20, TSX runtime
- **Containerization**: Docker (multi-stage alpine build), Docker Compose
- **CI/CD**: GitHub Actions with Docker Buildx, QEMU multi-arch, and automated Semantic Version Git Tagging

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your host machine:

- **Node.js**: `v20.0.0` or higher
- **npm** (or **bun** / **yarn**)
- **Docker** & **Docker Compose** (for containerized deployments)
- **Git**

---

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/mcp-server-manager.git
   cd mcp-server-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables (optional)**:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to **`http://localhost:3000`**.

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## Docker Deployment

### 1. Build and Run with Docker

Build the standalone production Docker image:

```bash
# Build image with version tag
docker build -t mcp-server-manager:1.2.0 .

# Run container exposing port 3000
docker run -d \
  --name mcp-server-manager \
  -p 3000:3000 \
  --restart unless-stopped \
  mcp-server-manager:1.2.0
```

Verify container health:
```bash
curl -f http://localhost:3000/healthz
```

---

### 2. Run with Docker Compose

To launch using Docker Compose:

```bash
# Start container in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop container
docker compose down
```

---

## GitHub Actions CI/CD (Docker Build & Version Tags)

The project includes an automated GitHub Actions workflow located at [`.github/workflows/docker-build.yml`](.github/workflows/docker-build.yml) that builds and publishes multi-architecture Docker images (`linux/amd64`, `linux/arm64`) directly to **GitHub Container Registry (GHCR)**.

### Semantic Version Tagging Workflow

Whenever a new Git tag is pushed, the CI pipeline automatically extracts the tag version and produces tagged Docker images:

1. **Create and push a release tag**:
   ```bash
   # Create a semantic version tag
   git tag v1.2.0

   # Push tag to GitHub
   git push origin v1.2.0
   ```

2. **Docker Tag Matrix Generated Automatically**:
   - `ghcr.io/<owner>/mcp-server-manager:1.2.0` (exact version)
   - `ghcr.io/<owner>/mcp-server-manager:1.2` (minor release track)
   - `ghcr.io/<owner>/mcp-server-manager:1` (major release track)
   - `ghcr.io/<owner>/mcp-server-manager:latest` (default branch releases)
   - `ghcr.io/<owner>/mcp-server-manager:sha-<commit-hash>` (commit tracking)

3. **CI Pipeline Features**:
   - Multi-arch support via QEMU & Docker Buildx (`linux/amd64` and `linux/arm64`)
   - GitHub Actions Layer Caching (`type=gha`) for ultra-fast build times
   - Pull request build testing without unauthenticated image pushes

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/catalog` | Returns the list of available and installed MCP server definitions |
| `GET` | `/healthz` | Container health probe returning JSON status and timestamp |
| `GET` | `/*` | Serves client SPA assets and fallback routing |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`) |
| `PORT` | `3000` | Port on which the Express web server listens |
| `APP_VERSION` | `1.2.0` | Application release version |
| `GEMINI_API_KEY` | - | Optional API key for AI Studio integrations |

---

## Project Structure

```text
├── .github/
│   └── workflows/
│       └── docker-build.yml       # GitHub Actions CI workflow (Docker multi-arch & SemVer tags)
├── src/
│   ├── components/
│   │   ├── AuditLog.tsx           # Administrative audit trail table with JSON export
│   │   ├── ConfigurationEditor.tsx# In-browser JSON config editor (export/import/format)
│   │   ├── DeployWizard.tsx       # 3-step interactive container launch wizard
│   │   ├── Header.tsx             # Global search bar and system status indicators
│   │   ├── Logs.tsx               # Real-time stdout/stderr log stream viewer
│   │   ├── ServerCatalog.tsx      # MCP server catalog grid with deploy triggers
│   │   ├── Settings.tsx           # Custom CPU/Memory threshold sliders & notifications
│   │   └── Sidebar.tsx            # Navigation sidebar
│   ├── context/
│   │   ├── AuditLogContext.tsx    # Global audit log state provider
│   │   ├── SettingsContext.tsx    # Thresholds and system settings provider
│   │   └── ToastContext.tsx       # Real-time deployment notification toast provider
│   ├── App.tsx                    # Main Dashboard, routing, and deployment history table
│   ├── index.css                  # Global Tailwind CSS styling
│   └── main.tsx                   # Application DOM entrypoint
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Container orchestration manifest
├── server.ts                      # Express API server & Vite production asset handler
├── metadata.json                  # Application metadata
└── package.json                   # Project dependencies and npm scripts
```

---

## License

This project is licensed under the Apache-2.0 License.
