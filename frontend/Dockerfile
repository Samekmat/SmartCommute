# ==============================================================================
# Multi-stage Dockerfile for SmartCommute React Frontend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build production static assets with Node.js
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications first for layer caching
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci

# Copy application source code and build configs
COPY . .

# Compile TypeScript and bundle with Vite
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve production assets via Nginx Alpine
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (reverse proxy + SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose default HTTP port
EXPOSE 80

# Healthcheck testing frontend accessibility
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
