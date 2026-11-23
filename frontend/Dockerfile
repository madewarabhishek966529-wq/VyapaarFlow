# Multi-stage Dockerfile for VyapaarFlow Frontend
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

RUN pnpm install --filter @vyapaarflow/frontend...

COPY shared ./shared
COPY frontend ./frontend

RUN pnpm --filter @vyapaarflow/shared build
RUN pnpm --filter @vyapaarflow/frontend build

# Nginx Production Stage
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
