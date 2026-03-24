FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG MODE=development
ARG VITE_APP_TITLE="Ocotillo"
ARG VITE_BASE_URL="/"
ARG VITE_AUTHENTIK_CLIENT_ID
ARG VITE_AUTHENTIK_URL
ARG VITE_AUTHENTIK_REDIRECT_URI
ARG VITE_OCOTILLO_API_URL
ARG VITE_MAPBOX_TOKEN
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST
ARG VITE_TEST_AUTH

ENV NODE_OPTIONS=--max-old-space-size=4096
ENV VITE_DISABLE_SOURCEMAP=true
ENV VITE_SENTRY_TELEMETRY_DISABLED=true

RUN npm run build:ci -- --mode $MODE

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
