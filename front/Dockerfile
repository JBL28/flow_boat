# Stage 1: build the React app
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_WS_URL is baked into the JS bundle at build time.
# Pass via --build-arg or docker-compose args. Leave empty to
# auto-derive the URL from window.location.host at runtime
# (works when Nginx proxies /ws on the same origin).
ARG VITE_WS_URL
ENV VITE_WS_URL=${VITE_WS_URL}

RUN npm run build

# Stage 2: serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
