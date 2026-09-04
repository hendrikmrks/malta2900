FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY app/package.json ./package.json
RUN npm install

COPY app ./
COPY prisma ./prisma
COPY scripts ./scripts

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
