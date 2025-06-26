# wce-portail-react-ts

## Description

[Webconf de l'Etat](https://preprod.webconf.numerique.gouv.fr/) is an open source project for webconferencing between agents.

## Sequence diagram

```mermaid
sequenceDiagram
wce-portail->>+ wce-api: GET : /authentication/whereami
wce-api-->>-wce-portail: "RIE" ou "INTERNET"
wce-portail->>+ wce-api: GET : /authentication/login_authorize
wce-api-->>-wce-portail: 302 redirect to cerbère
wce-portail->>+ wce-api: GET : /authentication/login_callback
wce-api-->>-wce-portail: {roomName, jwt, accessToken}
wce-portail->>+ wce-api: GET : /authentication/logout
wce-api-->>-wce-portail: 302 redirect to cerbère
wce-portail->>+ wce-api: GET : /authentication/logout_callback
wce-api-->>-wce-portail: {url: "/"}
wce-portail->>+ wce-api: GET : /authentication/refreshToken
wce-api-->>-wce-portail: {accessToken}
wce-portail->>+ wce-api: GET : /roomExists/:roomName
wce-api->>+ prosody: GET : /roomExists/:roomName
prosody-->>-wce-api: true
wce-api-->>-wce-portail: {accessToken}
wce-portail->>+ wce-api: GET : /:roomName
wce-api-->>-wce-portail: {roomName, jwt, ?accessToken}
wce-portail->>+ wce-api: POST : /conference/create/byemail
wce-api-->>-wce-portail: { isWhitelisted: true, sended: 'email sended' }
wce-portail->>+ wce-api: GET : /stats/homePage
wce-api-->>-wce-portail: { conf, part }
wce-portail->>+ wce-api: POST : /feedback
wce-api->>+ mongoDB: {isVPN: 0,rt: {inv: 0,qty: 0},com: "string"}
mongoDB-->- wce-api: 201
wce-api-->>-wce-portail: 201
```

## Installation

```bash

$ npm install

```

## Running the app

```bash

# development

$ npm run dev



# preproduction mode

$ npm run build:preprod



# production mode

$ npm run build:prod

```

## Test

```bash

# unit tests

$ npm run test



# e2e tests

$ npm run test:e2e



# test coverage

$ npm run test:cov

```

## Stay in touch

- Author - [Youssef El Mkhantar](https://github.com/youssefelmkhantar)

- Website - [https://preprod.webconf.numerique.gouv.fr/](https://preprod.webconf.numerique.gouv.fr/)

## License

Webconf is [MIT licensed](LICENSE).
