import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const configService = new ConfigService();

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
    type: 'mariadb',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: isProduction ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
    // Migrations seulement en prod
    migrations: isProduction ? ['dist/db/migrations/*.js'] : [],
    migrationsTableName: 'migrations',
    migrationsRun: isProduction,
    synchronize: !isProduction,
    logging: !isProduction,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;