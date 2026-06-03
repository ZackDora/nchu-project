FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV PORT=4173
ENV BASE_PATH=/nchu-project
ENV GROQ_MODEL=qwen/qwen3-32b

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs

EXPOSE 4173
CMD ["node", "server.mjs"]
