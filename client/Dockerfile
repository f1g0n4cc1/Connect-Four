# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy root config and shared
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY shared/ ./shared/
COPY client/ ./client/

# Install dependencies and build
RUN npm install
RUN npm run build -w @connect-four/client

# Production Stage (Serve with Nginx)
FROM nginx:stable-alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
