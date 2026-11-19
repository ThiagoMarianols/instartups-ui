# syntax=docker/dockerfile:1

# Dependências em camada separada: só é refeita quando o package-lock.json muda
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund


FROM node:22-alpine AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# output: "standalone" (next.config.ts) gera .next/standalone/server.js só com o necessário
RUN npm run build


# Sem node_modules completo nem código-fonte: só o standalone, os estáticos e o public/.
# Roda como o usuário não-root "node" (uid 1000) da imagem oficial.
FROM node:22-alpine AS final
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
