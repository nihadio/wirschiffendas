FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG APP
RUN npx nest build ${APP}

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
ARG APP
COPY --from=build /app/dist/apps/${APP} ./dist
CMD ["node", "dist/main.js"]
