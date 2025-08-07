import { configValidationSchema } from './config.schema';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConferenceModule } from './conference/conference.module';
import { StatsModule } from './stats/stats.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FeedbackModule } from './feedback/feedback.module';
import { ProsodyModule } from './prosody/prosody.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomNameValidator } from './common/validators/room-name.validator';

function getDatabaseImports() {
  const dbType = process.env.DB_TYPE;
  if (dbType === 'mongodb') {
    return [
      MongooseModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          uri:
            configService.get<string>('MONGODB_URI') ||
            'mongodb://localhost/wce',
        }),
      }),
    ];
  } else if (dbType === 'mariadb' || dbType === 'mysql') {
    return [
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          type: 'mariadb',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get('DB_PORT'), 10) || 3306,
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
        }),
      }),
    ];
  }
  return [];
}

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          transport: {
            pool: configService.get('EMAIL_SMTP_POOL'),
            host: configService.get('EMAIL_SMTP_HOST'),
            port: configService.get('EMAIL_SMTP_PORT'),
            secure: configService.get('EMAIL_SMTP_SECURE') === 'true',
            auth: {
              user: configService.get('EMAIL_SMTP_AUTH_USER'),
              pass: configService.get('EMAIL_SMTP_AUTH_PASS'),
            },
            tls: {
              rejectUnauthorized:
                configService.get('EMAIL_SMTP_TLS_REJECTUNAUTHORIZED') ===
                'true',
            },
          },
          defaults: {
            from: '"nest-modules" <modules@nestjs.com>',
          },
        };
      },
    }),
    ...getDatabaseImports(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return { secret: configService.get('JITSI_JITSIJWT_SECRET') };
      },
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      validationSchema: configValidationSchema,
    }),
    AuthenticationModule,
    ConferenceModule,
    StatsModule,
    FeedbackModule,
    ProsodyModule,
  ],
  controllers: [AppController],
  providers: [AppService, RoomNameValidator],
  exports: [RoomNameValidator],
})
export class AppModule { }
