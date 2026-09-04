FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /worker

COPY worker/package.json ./package.json
RUN npm install

COPY worker ./
COPY prisma ./prisma

RUN npx prisma generate

CMD ["node", "index.js"]
