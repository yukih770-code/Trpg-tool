FROM node:24.15.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Public endpoint only. Never add database/session credentials as build args.
ARG APP_PUBLIC_HTTP_URL
RUN npm run build:pilot -- --origin "$APP_PUBLIC_HTTP_URL"
RUN npm run server:build
RUN npm run pilot:verify:readiness && npm run pilot:verify:railway

FROM node:24.15.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24.15.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/deploy ./deploy
# Railway volumes mount as root. Only the startup directory ownership step runs
# as root; the application drops to the image's node user before preflight/listen.
CMD ["node", "deploy/railway-start.mjs"]
