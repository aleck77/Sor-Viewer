# Stage 1: Build the frontend
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the frontend with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/public
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
