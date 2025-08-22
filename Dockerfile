FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Etapa 2 - Servir com Nginx
FROM nginx:alpine
COPY --from=build /app/dist/dish-app /usr/share/nginx/html
EXPOSE 80
