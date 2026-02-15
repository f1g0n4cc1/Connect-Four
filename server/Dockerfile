# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy root config and shared
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY shared/ ./shared/
COPY server/ ./server/

# Install dependencies and build
RUN npm install
RUN npm run build -w @connect-four/server

# Production Stage
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist

# Install production dependencies only
RUN npm install --omit=dev

EXPOSE 8080

CMD ["npm", "start", "-w", "@connect-four/server"]
