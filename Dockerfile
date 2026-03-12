# UniPilot — production image: build frontend + run Express server
# Build: docker build --build-arg VITE_BACKEND_URL=https://your-app.onrender.com -t unipilot .
# Run: docker run -p 3000:3000 -e DATABASE_URL=... -e JWT_SECRET=... -e APP_URL=... unipilot
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_BACKEND_URL=
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

# Runner
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
