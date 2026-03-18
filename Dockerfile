# KickUp API — multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and Nest config (monorepo root)
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Copy all apps (kickup-api contains src/schemas, src/libs)
COPY apps ./apps

# Install dependencies and build API
RUN npm ci && npx nest build kickup-api

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory (for file uploads)
RUN mkdir -p uploads/images/members uploads/images/matches uploads/images/teams uploads/images/properties

ENV NODE_ENV=production
EXPOSE 3008

CMD ["node", "dist/apps/kickup-api/main.js"]
