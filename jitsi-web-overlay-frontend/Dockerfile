
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
COPY . .
RUN npm install --force



RUN npm run build

# Stage for serving the built application
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]