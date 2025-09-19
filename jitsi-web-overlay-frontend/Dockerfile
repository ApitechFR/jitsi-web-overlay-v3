FROM node:20-bookworm-slim AS build

WORKDIR /app

# Arguments pour Vite
ARG VITE_API_URL
ARG VITE_APP_TEMPLATE
ARG VITE_JITSI_DOMAIN
ARG VITE_VOXAPI_URL
ARG VITE_CONFERENCE_NAME_REGEX
ARG VITE_CONFERENCE_NAME_REGEX_MESSAGE
ARG VITE_ENABLE_JIBRI_APITECH_API
ARG VITE_JIBRI_APITECH_API_DOMAIN
ARG VITE_REPLAY_CHECK_TIMEOUT_MS

ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_TEMPLATE=$VITE_APP_TEMPLATE \
    VITE_JITSI_DOMAIN=$VITE_JITSI_DOMAIN \
    VITE_VOXAPI_URL=$VITE_VOXAPI_URL \
    VITE_CONFERENCE_NAME_REGEX=$VITE_CONFERENCE_NAME_REGEX \
    VITE_CONFERENCE_NAME_REGEX_MESSAGE=$VITE_CONFERENCE_NAME_REGEX_MESSAGE \
    VITE_ENABLE_JIBRI_APITECH_API=$VITE_ENABLE_JIBRI_APITECH_API \
    VITE_JIBRI_APITECH_API_DOMAIN=$VITE_JIBRI_APITECH_API_DOMAIN \
    VITE_REPLAY_CHECK_TIMEOUT_MS=$VITE_REPLAY_CHECK_TIMEOUT_MS 

# Copier uniquement les fichiers nécessaires pour installer
COPY package.json package-lock.json ./

RUN mkdir -p public/@gouvfr-lasuite/integration
# Installer les dépendances avec devDependencies (vite inclus)
RUN npm ci --no-audit --no-fund

# Copier le reste du code
COPY . .

# Build
RUN npm run build

#RUN cp -r node_modules/@apitechfr/react-dsapitech/dsfr dist/ 2>/dev/null || true
RUN mkdir -p dist/dsfr \
    && cp -r node_modules/@apitechfr/react-dsapitech/dsfr/* dist/dsfr/



# RUN cp -r node_modules/@gouvfr/dsfr/dist/* dist/dsfr/

# ----------- Serveur Nginx ----------- #
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
