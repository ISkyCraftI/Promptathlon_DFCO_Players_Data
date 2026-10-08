FROM node:20-slim AS frontend-builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build -- --configuration production

FROM nginx:1.28.0-alpine AS frontend

RUN apk add --no-cache openssl

COPY --from=frontend-builder /app/dist/frontend /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN sed -i "s/\r$//" /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 8089

ENTRYPOINT ["/docker-entrypoint.sh"]
