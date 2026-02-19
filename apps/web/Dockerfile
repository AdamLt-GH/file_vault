FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json

RUN npm ci --workspace @file-vault/web --include-workspace-root

COPY apps/web apps/web

RUN npm run build --workspace @file-vault/web

FROM nginx:1.27-alpine AS production

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
