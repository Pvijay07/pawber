# ────────── Build Stage ──────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build


# ────────── Runner Stage ──────────
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy production dependencies (smaller image)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./.env.example

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose the API port
EXPOSE 4000

# Start command
CMD ["node", "dist/server.js"]
