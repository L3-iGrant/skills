FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 6002
CMD ["npx", "tsx", "src/server.ts"]
