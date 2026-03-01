# ----- Build stage -----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ----- Production stage -----
FROM node:18-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./

# Switch to non-root user
USER appuser

# Render injects PORT env var at runtime
EXPOSE 3000

CMD ["node", "server.js"]
