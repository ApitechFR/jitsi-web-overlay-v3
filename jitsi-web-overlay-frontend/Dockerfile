
FROM node:20-bookworm-slim AS build


WORKDIR /app


ARG VITE_API_URL
ARG VITE_APP_TEMPLATE
ARG VITE_JITSI_DOMAIN

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_TEMPLATE=$VITE_APP_TEMPLATE
ENV VITE_JITSI_DOMAIN=$VITE_JITSI_DOMAIN
ENV NODE_ENV=production


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