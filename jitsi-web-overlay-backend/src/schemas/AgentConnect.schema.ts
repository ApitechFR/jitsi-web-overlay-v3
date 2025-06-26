import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MetricDocument = HydratedDocument<AgentConnect>;

@Schema()
export class AgentConnect {
  @Prop()
  acjwt: string;

  @Prop()
  idToken: string;

  @Prop([])
  user: any[];
}

export const MetricSchema = SchemaFactory.createForClass(AgentConnect);
