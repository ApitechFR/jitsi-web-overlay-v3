# Construction de l'application
FROM node:18 AS build


WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

RUN npm prune --production && npm cache clean --force

# Configuration Nginx pour servir les fichiers en production
FROM nginx:latest

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

COPY --from=build /usr/src/app/dist/manifest.xml /usr/share/nginx/html/manifest.xml

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
