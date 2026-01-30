# syntax=docker/dockerfile:1

# Base stage for dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copy seed script and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Startup script: run migrations, seed if needed, then start
COPY --from=builder /app/prisma/seed.ts ./prisma/seed.ts
RUN printf '#!/bin/sh\n./node_modules/.bin/prisma migrate deploy\nnode server.js\n' > /app/start.sh && chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "/app/start.sh"]
