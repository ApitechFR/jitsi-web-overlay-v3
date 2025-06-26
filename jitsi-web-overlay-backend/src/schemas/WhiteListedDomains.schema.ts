import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WhiteListedDomainsDocument = HydratedDocument<WhiteListedDomains>;

@Schema({ collection: 'whitelistedDomain' })
export class WhiteListedDomains {
  @Prop()
  owner: string;

  @Prop([])
  domains: any[];
}

export const WhiteListedDomainsSchema =
  SchemaFactory.createForClass(WhiteListedDomains);
