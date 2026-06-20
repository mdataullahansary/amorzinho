FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Build
RUN pnpm --filter @amorzinho/server run build

# Production image
FROM node:20-alpine AS runner
RUN corepack enable pnpm
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/server/dist ./dist
COPY --from=base /app/apps/server/package.json ./package.json

EXPOSE 4000

CMD ["node", "dist/index.js"]
