import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback as FeedbackEntity } from './entities/feedback.entity';
import {
  Feedback as FeedbackMongo,
  FeedbackSchema,
} from './schemas/Feedback.schema';
import { FeedbackController } from './feedback.controller';
import { FeedbackServiceMongo } from './services/feedback.service.mongo';
import { FeedbackServiceSQL } from './services/feedback.service.sql';
import { IFeedbackService } from './interfaces/feedback-service.interface';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ...(process.env.DB_TYPE === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: FeedbackMongo.name, schema: FeedbackSchema },
          ]),
        ]
      : [TypeOrmModule.forFeature([FeedbackEntity])]),
  ],
  controllers: [FeedbackController],
  providers: [
    ...(process.env.DB_TYPE === 'mongodb'
      ? [
          FeedbackServiceMongo,
          {
            provide: IFeedbackService,
            inject: [FeedbackServiceMongo, ConfigService],
            useFactory: (mongo: FeedbackServiceMongo) => mongo,
          },
        ]
      : [
          FeedbackServiceSQL,
          {
            provide: IFeedbackService,
            inject: [FeedbackServiceSQL, ConfigService],
            useFactory: (sql: FeedbackServiceSQL) => sql,
          },
        ]),
  ],
  exports: [IFeedbackService],
})
export class FeedbackModule {}
