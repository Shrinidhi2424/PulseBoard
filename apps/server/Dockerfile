FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

RUN npm ci --workspace=@pulseboard/server

COPY apps/server ./apps/server

EXPOSE 3001
ENV NODE_ENV=production

CMD ["npm", "run", "start", "--workspace=@pulseboard/server"]
