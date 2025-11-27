# Build stage
FROM denoland/deno:2.1.4 AS builder

WORKDIR /app

# Install Node.js for esbuild
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy source files
COPY deno.json deno.lock ./
COPY app.tsx build.ts main.ts ./
COPY components/ ./components/
COPY static/ ./static/

# Cache dependencies
RUN deno cache main.ts

# Build production bundle
RUN deno task build:prod

# Production stage
FROM denoland/deno:2.1.4

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/main.ts ./
COPY --from=builder /app/deno.json ./
COPY --from=builder /app/deno.lock ./
COPY --from=builder /app/static/ ./static/
COPY --from=builder /app/components/styles.css ./components/

# Cache dependencies
RUN deno cache main.ts

# Create non-root user for security
RUN useradd -m -u 1000 deno
USER deno

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "const r = await fetch('http://localhost:8000/health'); if (!r.ok) Deno.exit(1);"

# Run the server
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]

