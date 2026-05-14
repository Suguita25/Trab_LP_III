#FROM nginx:alpine
#COPY home.html /usr/share/nginx/html/index.html

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["node", "./node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "5173"]
