FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_BASE_URL=http://localhost:9001
ARG VITE_API_CLIENT_ID=operations-ui
ARG VITE_ALERT_WS_URL=ws://localhost:9001/ws/alerts
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_CLIENT_ID=${VITE_API_CLIENT_ID}
ENV VITE_ALERT_WS_URL=${VITE_ALERT_WS_URL}

RUN npm run build

FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
