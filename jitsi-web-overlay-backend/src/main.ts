import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("webconf de l'Etat")
    .setDescription("la spécification openApi de la webconf de l'Etat")
    .setVersion('1.0')
    .addTag("webconf de l'Etat")
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
  //app.set('trust proxy', 1);

  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(process.env.BACKEND_PORT || 3030);
}

bootstrap();
