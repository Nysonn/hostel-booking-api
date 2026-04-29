################################
# Stage 1 — migrate
################################
FROM node:22-alpine AS migrate

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npx", "drizzle-kit", "migrate"]

################################
# Stage 2 — dev (hot reload)
################################
FROM node:22-alpine AS dev

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

CMD ["npx", "nodemon", "--watch", "src", "--ext", "ts", "--exec", "tsx src/index.ts"]

################################
# Stage 3 — builder
################################
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

################################
# Stage 4 — production
################################
FROM node:22-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
