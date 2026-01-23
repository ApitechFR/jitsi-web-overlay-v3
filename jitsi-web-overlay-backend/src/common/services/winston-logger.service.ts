import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';

@Injectable()
export class WinstonLoggerService implements LoggerService {
    private readonly logger: winston.Logger;

    constructor(private readonly configService: ConfigService) {
        const logDir = this.configService.get<string>('LOG_DIR') || './logs';

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.printf(({ level, message }) =>
                            `${moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss')} [${level}] ${message}`,
                        ),
                    ),
                }),
                new winston.transports.File({
                    filename: path.join(logDir, 'automation_cron.log'),
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5,
                    tailable: true,
                    format: winston.format.combine(
                        winston.format.printf(({ level, message }) =>
                            `${moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss')} [${level}] ${message}`,
                        ),
                    ),
                }),
            ],
        });
    }

    log(message: any) {
        this.logger.info(message);
    }

    error(message: any, trace?: any) {
        this.logger.error(`${message} ${trace || ''}`);
    }

    warn(message: any) {
        this.logger.warn(message);
    }

    debug(message: any) {
        this.logger.debug(message);
    }

    verbose(message: any) {
        this.logger.verbose(message);
    }
}
