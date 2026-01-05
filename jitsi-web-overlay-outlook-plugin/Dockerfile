

# Construction de l'application
FROM node:18 AS build

# Permet de passer les variables nécessaires au build Webpack
ARG ADDIN_BASE_URL
ARG DIALINNUMBER_URL
ARG DIALINCONFCODE_URL
ARG ENABLE_PHONE_ACCESS
ARG PHONE_NUMBER_FORMAT
ARG ENABLE_MODERATOR_OPTIONS
ARG TITLE_MEETING_DETAILS
ARG DEBUG
ARG ROOM_NAME_LENGTH
ARG ROOM_NAME_PREFIX
ARG ROOM_NAME_MODE
ARG PLUGIN_PORT


WORKDIR /usr/src/app


COPY package*.json ./
RUN npm ci && npm cache clean --force



# Génère dynamiquement un .env minimal pour le build Webpack
RUN echo "ADDIN_BASE_URL=$ADDIN_BASE_URL" > .env \
    && echo "DIALINNUMBER_URL=$DIALINNUMBER_URL" >> .env \
    && echo "DIALINCONFCODE_URL=$DIALINCONFCODE_URL" >> .env \
    && echo "ENABLE_PHONE_ACCESS=$ENABLE_PHONE_ACCESS" >> .env \
    && echo "PHONE_NUMBER_FORMAT=$PHONE_NUMBER_FORMAT" >> .env \
    && echo "ENABLE_MODERATOR_OPTIONS=$ENABLE_MODERATOR_OPTIONS" >> .env \
    && echo "TITLE_MEETING_DETAILS=$TITLE_MEETING_DETAILS" >> .env \
    && echo "DEBUG=$DEBUG" >> .env \
    && echo "ROOM_NAME_LENGTH=$ROOM_NAME_LENGTH" >> .env \
    && echo "ROOM_NAME_PREFIX=$ROOM_NAME_PREFIX" >> .env \
    && echo "ROOM_NAME_MODE=$ROOM_NAME_MODE" >> .env \
    && echo "PLUGIN_PORT=$PLUGIN_PORT" >> .env


RUN npm run build

RUN npm prune --production && npm cache clean --force

# Configuration Nginx pour servir les fichiers en production
FROM nginx:latest

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

COPY --from=build /usr/src/app/dist/manifest.xml /usr/share/nginx/html/manifest.xml

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
