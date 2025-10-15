FROM node:20-bookworm-slim AS build

WORKDIR /app

# Arguments pour Vite
ARG VITE_API_URL\
    ARG VITE_APP_TEMPLATE  


ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_TEMPLATE=$VITE_APP_TEMPLATE

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
RUN mkdir -p dist/dsfr/icons && cp -r node_modules/@apitechfr/react-dsapitech/dsfr/icons dist/dsfr/
# RUN mkdir -p dist/dsfr \
#     && cp -r node_modules/@apitechfr/react-dsapitech/dsfr/* dist/dsfr/



# RUN cp -r node_modules/@gouvfr/dsfr/dist/* dist/dsfr/

# ----------- Serveur Nginx ----------- #
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
