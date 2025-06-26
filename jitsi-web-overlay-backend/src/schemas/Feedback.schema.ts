import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsIP, IsOptional } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

class Rating {
  @Prop()
  qty: number;
  @Prop()
  inv: number;
}
@Schema({ collection: 'feedback' })
export class Feedback {
  @Prop()
  @IsIP()
  ip: string;

  @Prop()
  rt: Rating;

  @Prop()
  isVPN: number;

  @Prop()
  com: string;

  @Prop()
  @IsOptional()
  jmmc_id: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
