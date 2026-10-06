# ==========================================
# Multi-Stage Dockerfile for MCP Server Manager
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package.json package-lock.json* bun.lock* ./

# Install all dependencies
RUN npm install

# Copy source code and build config
COPY . .

# Build Vite client production assets into dist/
RUN npm run build

# ==========================================
# 2. Production Runner Stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Create non-root system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mcpuser

# Copy package files and install production dependencies + tsx runner
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm install -g tsx

# Copy built application assets and server runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Grant ownership to non-root user
RUN chown -R mcpuser:nodejs /app

USER mcpuser

# Expose web dashboard port
EXPOSE 3000

# Automated container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

# Start full-stack server
CMD ["tsx", "server.ts"]
