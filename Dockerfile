FROM node:22-slim

WORKDIR /app

ENV APP_ENV=production
ENV SERVE_WEB_APP=true
ENV API_PORT=5002
ENV DATA_FILE_PATH=/data/koopcare/applications.json

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || process.env.API_PORT || 5002) + '/ready').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
