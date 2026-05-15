FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV APP_ENV=production
ENV SERVE_WEB_APP=true
ENV API_PORT=5002

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run build && npm prune --omit=dev

EXPOSE 5002

CMD ["npm", "start"]
