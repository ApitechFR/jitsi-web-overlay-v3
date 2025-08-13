import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const production = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: production ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
    // Migrations seulement en prod
    migrations: production ? ['dist/db/migrations/*.js'] : [],
    migrationsTableName: 'migrations',
    migrationsRun: production,
    synchronize: !production,
    logging: !production,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;