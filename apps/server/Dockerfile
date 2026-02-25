## ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first (better caching)
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Install all deps
RUN npm ci

# Copy source
COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/server/ ./apps/server/
COPY tsconfig.base.json ./

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Build @repo/shared → dist/
RUN cd packages/shared && npx tsc -p tsconfig.json \
    && echo "shared/dist:" && ls -la dist/

# Build @repo/db → dist/ (only src, exclude prisma/seed.ts)
RUN cd packages/db \
    && printf '{"extends":"./tsconfig.json","include":["src"],"exclude":["prisma","node_modules","dist"]}\n' > tsconfig.build.json \
    && npx tsc -p tsconfig.build.json --skipLibCheck \
    && echo "db/dist:" && ls -la dist/

# Build server
RUN cd apps/server && npm run build \
    && echo "server/dist:" && ls dist/

## ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache tini

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Install only production deps
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled workspace packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist

# Rewrite workspace package.json exports from .ts source to compiled .js
RUN sed -i 's|"./src/index.ts"|"./dist/index.js"|g' packages/shared/package.json packages/db/package.json \
    && echo "shared exports:" && grep -o '"\..*"' packages/shared/package.json \
    && echo "db exports:" && grep -o '"\..*"' packages/db/package.json

# Copy Prisma client (hoisted to root node_modules)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built server + prisma schema (for migrations)
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY packages/db/prisma/ ./packages/db/prisma/

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/server/dist/main.js"]
