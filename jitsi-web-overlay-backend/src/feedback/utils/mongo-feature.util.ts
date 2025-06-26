import { MongooseModule } from '@nestjs/mongoose';

export function getMongoFeatureFor(name: string, schema: any): any[] {
    return process.env.DB_TYPE === 'mongodb'
        ? [MongooseModule.forFeature([{ name, schema }])]
        : [];
}
