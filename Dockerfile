# 1)  DEPENDENCIES
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/


# exactly install deps from lock-file (should be present at the root level)
RUN npm ci

# 2) BUILD
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the whole monorepo (turbo builds web + deps)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Runner - only standalone output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next standalone output lives under apps/web/.next/standalone
# You must copy static files and public folder per Next docs:
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/.next/standalone ./

# Cloud Run sets PORT; Next standalone respects it
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

# Path depends on how Next names the server inside standalone — often:
CMD ["node", "apps/web/server.js"]