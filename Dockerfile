# Dockerfile para produção - apenas aplicação
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build || echo "No build step"

FROM node:20-alpine as prod
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
