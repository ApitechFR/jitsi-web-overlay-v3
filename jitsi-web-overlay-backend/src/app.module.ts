import { configValidationSchema } from './config.schema';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
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
import { JwtOidcMiddleware } from './authentication/utils/jwt-oidc.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { OriginMiddleware } from './common/middleware/origin.middleware';


import { ReplayModule } from './replay/replay.module';
import { RoomModule } from './room/room.module';
import { dataSourceOptions } from '../db/datasource';
import { ParticipantModule } from './participant/participant.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
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
    ...(process.env.MONGODB_URI
      ? [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            uri:
              configService.get<string>('MONGODB_URI') ||
              'mongodb://localhost/wce',
          }),
        }),
      ]
      : []),
    TypeOrmModule.forRoot(dataSourceOptions),
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
    ReplayModule,
    RoomModule,
    ParticipantModule,
  ],
  controllers: [AppController],
  providers: [AppService, RoomNameValidator],
  exports: [RoomNameValidator],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtOidcMiddleware)
      .forRoutes({ path: 'conferences/*', method: RequestMethod.ALL });
    consumer
      .apply(OriginMiddleware)
      .forRoutes({ path: 'conferences', method: RequestMethod.GET });

    //particcipants endpoint
    consumer
      .apply(OriginMiddleware)
      .forRoutes({ path: 'conferences/participants/*', method: RequestMethod.GET });

    //feedback endpoint  
    consumer
      .apply(OriginMiddleware)
      .forRoutes({ path: 'feedback/*', method: RequestMethod.GET });

    // replay endpoints
    consumer
      .apply(OriginMiddleware)
      .forRoutes({ path: 'replays/*', method: RequestMethod.GET });




  }
}
