import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'feedback', timestamps: true })
export class Feedback extends Document {
    @Prop({ required: true })
    evaluation: number; // correspond à rt.qty

    @Prop()
    inv?: number; // correspond à rt.inv

    @Prop()
    comment: string;

    @Prop({ required: true })
    isVPN: number;

    @Prop({ required: false })
    jmmc_id?: string;

    @Prop()
    ip?: number;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
