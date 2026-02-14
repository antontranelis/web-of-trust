FROM node:22-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm init -y && npm install @evolu/common@7.4.1 @evolu/nodejs@2.4.0

COPY relay.mjs .

ENV PORT=4000
ENV MAX_MB_PER_OWNER=100

EXPOSE 4000

VOLUME ["/app/data"]

CMD ["node", "relay.mjs"]
