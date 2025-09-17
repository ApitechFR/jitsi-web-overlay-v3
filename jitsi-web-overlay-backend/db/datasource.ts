import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    //entities: isProduction ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
    entities: isProduction ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
    // Migrations seulement en prod
    migrations: isProduction ? ['dist/db/migrations/*.js'] : [],
    migrationsTableName: 'migrations',
    migrationsRun: isProduction,
    synchronize: !isProduction,
    logging: !isProduction,
};

export default new DataSource(dataSourceOptions);