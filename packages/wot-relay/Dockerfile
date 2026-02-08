FROM node:22-slim AS build

# better-sqlite3 needs build tools for native addon
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (layer cache)
COPY package.json ./
RUN npm install

# Copy source + standalone tsconfig (no monorepo extends)
COPY src/ src/
COPY tsconfig.docker.json tsconfig.json
RUN npx tsc

# --- Production stage ---
FROM node:22-slim

WORKDIR /app

COPY --from=build /app/dist/ dist/
COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/package.json .

ENV PORT=8787
ENV DB_PATH=/data/relay-queue.db

EXPOSE 8787

VOLUME ["/data"]

CMD ["node", "dist/start.js"]
