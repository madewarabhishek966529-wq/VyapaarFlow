# Multi-stage Dockerfile for VyapaarFlow Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace package manifests
COPY package.json pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies with build scripts allowed
RUN pnpm install --filter @vyapaarflow/backend...

# Copy shared & backend source
COPY shared ./shared
COPY backend ./backend

# Build shared and backend
RUN pnpm --filter @vyapaarflow/shared build
RUN pnpm --filter @vyapaarflow/backend build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN pnpm install --prod --filter @vyapaarflow/backend...

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 5000

CMD ["node", "backend/dist/server.js"]
