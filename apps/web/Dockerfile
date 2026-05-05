## ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# Install
RUN npm ci \
	--fetch-retries=5 \
	--fetch-retry-factor=2 \
	--fetch-retry-mintimeout=20000 \
	--fetch-retry-maxtimeout=120000

# Copy source (server needed for type imports in trpc.ts)
COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/server/ ./apps/server/
COPY apps/web/ ./apps/web/
COPY tsconfig.base.json ./

# Generate Prisma client types without engine download (web build needs types only)
RUN cd packages/db && npx prisma generate --no-engine

# Build
RUN cd apps/web && npm run build

## ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
