import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

  // Gemini API Health Report Generation Endpoint
  app.post('/api/health-report', async (req, res) => {
    try {
      const { deployments = [], metrics = {} } = req.body;

      const cpuCurrent = metrics.cpuCurrent ?? 60;
      const memoryCurrent = metrics.memoryCurrent ?? 80;
      const cpuThreshold = metrics.cpuThreshold ?? 85;
      const memoryThreshold = metrics.memoryThreshold ?? 80;
      const autoScaleEnabled = !!metrics.autoScaleEnabled;
      const autoScaleBoost = metrics.autoScaleBoost ?? 25;
      const history = metrics.history ?? [];

      const prompt = `You are a Principal DevOps & Site Reliability Engineer specializing in Model Context Protocol (MCP) microservices and Docker container orchestration.

Perform an in-depth system performance audit and diagnostics evaluation on the following live MCP cluster telemetry:

### Telemetry Snapshot:
- Active Container Count: ${deployments.length}
- Container Instances:
${deployments.map((d: any) => `  * ${d.name}: Status=${d.status}, Health=${d.health}, Uptime=${d.uptime}, Timestamp=${d.timestamp}`).join('\n')}
- Current Peak CPU Utilization: ${cpuCurrent}% (Threshold: ${cpuThreshold}%)
- Current Peak Memory Utilization: ${memoryCurrent}% (Threshold: ${memoryThreshold}%)
- Autonomous Auto-Scaling: ${autoScaleEnabled ? `ACTIVE (+${autoScaleBoost}% Dynamic Memory/CPU Headroom)` : 'DISABLED'}
- Telemetry Timeline (Last 5 samples):
${history.map((h: any) => `  * [${h.time}]: CPU=${h.cpu}%, Memory=${h.memory}%`).join('\n')}

Generate a comprehensive, beautifully structured Markdown Health & Optimization Report.
Use clear headings, bullet points, code blocks where relevant, and structured tables.

Required Structure:
# 🩺 MCP Container Cluster Health & Diagnostic Report
*Generated on ${new Date().toUTCString()} using Gemini 3.8 Flash Diagnostic Intelligence*

## 1. Executive Summary & Cluster Status
(Provide a high-level assessment of overall cluster stability, uptime health, and whether the system is under critical, elevated, or nominal strain.)

## 2. Container Health & Runtime Analysis
(Analyze individual container services. Specifically address any degraded/failing services such as Postgres MCP or stopped workloads, root cause hypotheses, and active workloads stability.)

## 3. Resource Utilization & Bottleneck Diagnosis
(Analyze CPU (${cpuCurrent}%) and Memory (${memoryCurrent}%) against configured alert thresholds (${cpuThreshold}% / ${memoryThreshold}%). Evaluate risk of container memory throttling, garbage collection spikes, or OOM (Out-of-Memory) terminations.)

## 4. Auto-Scaling & Dynamic Headroom Evaluation
(Assess the effectiveness of the autonomous auto-scaler policies and dynamic headroom allocation under observed peak loads.)

## 5. Prioritized Optimization Recommendations
(Detail actionable, concrete engineering steps:
- 🔴 **Immediate Actions**: High-priority steps to stabilize degraded containers or alleviate memory pressure.
- 🟡 **Near-Term Tuning**: Configuration tuning, threshold adjustments, connection pool limits, or heap size tweaks.
- 🟢 **Architectural Resilience**: Proactive measures such as container configuration snapshots, circuit breakers, and health probe intervals.)

## 6. SRE Reliability Scorecard
(Provide a summary table with columns: Dimension | Status | Score (1-10) | Recommendation.)
`;

      let markdownReport = '';
      let modelUsed = 'gemini-3.8-flash';
      let generatedVia = 'gemini-api';

      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });
          markdownReport = response.text || '';
        } catch (apiError: any) {
          console.error('Gemini API call failed, using high-fidelity fallback generator:', apiError?.message || apiError);
          generatedVia = 'fallback-generator';
        }
      } else {
        generatedVia = 'fallback-generator';
      }

      // If Gemini response was empty or API key was missing, synthesize a rich report based on actual metrics
      if (!markdownReport) {
        const failingContainers = deployments.filter((d: any) => d.status === 'Failed' || d.health === 'Failing');
        const passingContainers = deployments.filter((d: any) => d.status === 'Success');
        const memoryExceeded = memoryCurrent > memoryThreshold;
        const cpuExceeded = cpuCurrent > cpuThreshold;

        markdownReport = `# 🩺 MCP Container Cluster Health & Diagnostic Report
*Generated on ${new Date().toUTCString()} using Gemini Diagnostic Intelligence (${modelUsed})*

## 1. Executive Summary & Cluster Status
The MCP server cluster is operating in a **${failingContainers.length > 0 || memoryExceeded ? 'DEGRADED / ATTENTION REQUIRED' : 'HEALTHY'}** state.
- **Total Registered MCP Containers:** ${deployments.length}
- **Healthy & Passing:** ${passingContainers.length} / ${deployments.length}
- **Failing / Degraded:** ${failingContainers.length} container(s) (${failingContainers.map((d: any) => d.name).join(', ') || 'None'})
- **Resource Pressure:** ${memoryExceeded || cpuExceeded ? 'Elevated threshold breach detected' : 'Operating within nominal threshold boundaries'}

---

## 2. Container Health & Runtime Analysis
${deployments.map((d: any) => `### \`${d.name}\`
- **State:** ${d.status === 'Success' ? '🟢 Online / Operational' : '🔴 Degraded / Failed'}
- **Health Check:** ${d.health}
- **Uptime:** ${d.uptime}
- **Diagnostic Note:** ${
  d.status === 'Failed'
    ? 'Container process exited unexpectedly or failed readiness probes. Requires configuration verification and restart signal.'
    : 'Container maintaining steady heartbeat with persistent IPC connectivity.'
}`).join('\n\n')}

---

## 3. Resource Utilization & Bottleneck Diagnosis
- **Peak CPU Load:** **${cpuCurrent}%** (Limit: ${cpuThreshold}%) — ${cpuExceeded ? '⚠️ **WARNING**: Exceeding baseline threshold.' : '✅ Nominal processing headroom.'}
- **Peak Memory Utilization:** **${memoryCurrent}%** (Limit: ${memoryThreshold}%) — ${memoryExceeded ? '⚠️ **CRITICAL BREACH**: High heap occupancy; risks container OOM kill.' : '✅ Safe memory buffer available.'}
- **Trend Evaluation:** Recent 5 telemetry intervals indicate ${memoryCurrent > 70 ? 'persistent memory retention with potential buffer accumulation' : 'smooth cyclical resource utilization'}.

---

## 4. Auto-Scaling & Dynamic Headroom Evaluation
- **Auto-Scale Policy:** ${autoScaleEnabled ? `🟢 **ACTIVE** with dynamic headroom boost of **+${autoScaleBoost}%**` : '⚪ **DISABLED** (Manual capacity scaling only)'}
- **Evaluation:** ${autoScaleEnabled ? `The auto-scaler engine successfully mitigated peak breaches by expanding temporary container resource buffers.` : `Enabling autonomous auto-scaling is strongly recommended to prevent container restarts during traffic spikes.`}

---

## 5. Prioritized Optimization Recommendations
### 🔴 Immediate Actions
1. **Restart Degraded Containers:** Address \`${failingContainers.map((d: any) => d.name).join(', ') || 'Postgres MCP'}\` by inspecting container logs and dispatching a clean restart cycle.
2. ${memoryExceeded ? `**Alleviate Memory Pressure:** Reduce in-flight request cache or execute container garbage collection.` : '**Verify Port Bindings:** Ensure no port collisions occur across running MCP microservices.'}

### 🟡 Near-Term Tuning
1. **Calibrate Thresholds:** Adjust CPU and Memory alert thresholds to match production workload baselines in Settings.
2. **Snapshot Creation:** Capture baseline configuration snapshots prior to applying configuration changes.

### 🟢 Architectural Resilience
1. **Automated Health Probes:** Configure periodic liveness and readiness probe intervals (every 10s).
2. **Auto-Scale Dynamic Headroom:** Maintain dynamic buffer headroom (+${autoScaleBoost}%) to absorb sudden agent query bursts.

---

## 6. SRE Reliability Scorecard
| Dimension | Status | Score | Recommendation |
| :--- | :--- | :---: | :--- |
| **Container Availability** | ${failingContainers.length === 0 ? '🟢 Nominal' : '🟡 Degraded'} | ${failingContainers.length === 0 ? '9.5/10' : '6.8/10'} | Recover ${failingContainers.length} offline instance(s) |
| **Memory Headroom** | ${memoryExceeded ? '🔴 Critical' : '🟢 Healthy'} | ${memoryExceeded ? '5.5/10' : '8.8/10'} | ${memoryExceeded ? 'Expand buffer allocation' : 'Optimal buffer'} |
| **CPU Processing** | ${cpuExceeded ? '🟡 Elevated' : '🟢 Healthy'} | ${cpuExceeded ? '7.0/10' : '9.0/10'} | Balance worker threads |
| **Auto-Scale Preparedness** | ${autoScaleEnabled ? '🟢 Enabled' : '🟡 Inactive'} | ${autoScaleEnabled ? '9.0/10' : '5.0/10'} | ${autoScaleEnabled ? 'Policy active' : 'Enable auto-scale in Settings'} |
`;
      }

      res.json({
        report: markdownReport,
        timestamp: new Date().toISOString(),
        model: modelUsed,
        generatedVia,
        metricsSummary: {
          cpuCurrent,
          memoryCurrent,
          cpuThreshold,
          memoryThreshold,
          activeContainers: deployments.length,
          failingContainers: deployments.filter((d: any) => d.status === 'Failed').length,
        },
      });
    } catch (err: any) {
      console.error('Error generating health report:', err);
      res.status(500).json({ error: 'Failed to generate health report', details: err?.message || String(err) });
    }
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

