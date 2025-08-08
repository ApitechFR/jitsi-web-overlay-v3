import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
//import { JwtOidcMiddleware } from './authentication/utils/jwt-oidc.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle("webconf de l'Etat")
    .setDescription("la spécification openApi de la webconf de l'Etat")
    .setVersion('1.0')
    .addTag("webconf de l'Etat")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  //Enable CORS  if not in production

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser(`${process.env.COOKIE_SECRET}`));

  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  // Appliquer le middleware uniquement sur les routes protégées
  // app.use('/conferences', new JwtOidcMiddleware(jwtService, configService).use);
  // app.use('/feedback', new JwtOidcMiddleware(jwtService, configService).use);

  await app.listen(process.env.BACKEND_PORT || 3030);
}

bootstrap();
