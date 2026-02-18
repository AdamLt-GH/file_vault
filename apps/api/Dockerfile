FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json

RUN npm ci --workspace @file-vault/api --include-workspace-root

COPY apps/api apps/api

RUN npm run prisma:generate --workspace @file-vault/api
RUN npm run build --workspace @file-vault/api
RUN npm prune --omit=dev --workspace @file-vault/api --include-workspace-root

FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY apps/api/docker-entrypoint.sh apps/api/docker-entrypoint.sh

RUN chmod +x apps/api/docker-entrypoint.sh

EXPOSE 3000

USER node

ENTRYPOINT ["apps/api/docker-entrypoint.sh"]
