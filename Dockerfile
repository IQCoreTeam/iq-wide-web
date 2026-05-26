FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so they must be present here (not at runtime). Passed via --build-arg.
ARG NEXT_PUBLIC_ROOT_ID
ARG NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_ROOT_ID=$NEXT_PUBLIC_ROOT_ID
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3008
ENV HOSTNAME=0.0.0.0
# Next standalone bundles only the runtime files (no node_modules tree).
# Static assets + public/ are copied alongside.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3008
CMD ["node", "server.js"]
