import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Permet à class-validator d'utiliser l'injection de dépendances NestJS
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Visio By Apitech")
    .setDescription("la spécification openApi de  Visio By Apitech")
    .setVersion('1.0')
    .addTag("Visio By Apitech")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // CORS (déduire un tableau depuis la chaîne d'env)
  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Cookies signés
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Important si derrière un proxy/ingress (TLS terminé en amont)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);


  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true,
    transform: true,
  }));


  const port = Number(process.env.PORT) || 3030;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Serveur démarré sur le port ${port}`);

}

bootstrap();
