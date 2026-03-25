import { Cron, CronExpression } from '@nestjs/schedule';
import { ReplayService } from '../../replay/replay.service';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class ReplayCleanerService {
    private readonly logger = new Logger(ReplayCleanerService.name);
    constructor(
        private readonly replayService: ReplayService,
        private readonly configService: ConfigService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    // @Cron(CronExpression.EVERY_MINUTE)
    async cleanOldReplays() {
        const ttlDays = this.configService.get<number>('REPLAY_TTL_DAYS');

        if (!ttlDays) {
            this.logger.log('Replay cleanup disabled (REPLAY_TTL_DAYS not set)');
            return;
        }

        const oldReplays = await this.replayService.findOlderThanDays(ttlDays);

        if (oldReplays.length === 0) {
            this.logger.log(`No replays older than ${ttlDays} days found.`);
            return;
        }

        const deletedFiles: string[] = [];
        const failedDeletes: string[] = [];

        for (const replay of oldReplays) {
            try {
                if (fs.existsSync(replay.file_path)) {
                    await fs.promises.unlink(replay.file_path);
                    deletedFiles.push(replay.file_path);
                } else {
                    this.logger.warn(`File not found for replay ${replay.uid}: ${replay.file_path}`);
                    failedDeletes.push(replay.file_path);
                }

                await this.replayService.deactivateReplay(replay.id);

            } catch (error) {
                console.error(`Replay deletion error ${replay.uid}`, error);
                failedDeletes.push(replay.file_path);
            }
        }

        this.logger.log(`Replay cleanup finished: ${deletedFiles.length} files deleted, ${failedDeletes.length} failed.`);
        if (deletedFiles.length > 0) this.logger.log(`Deleted files: ${deletedFiles.join(', ')}`);
        if (failedDeletes.length > 0) this.logger.warn(`Failed deletes: ${failedDeletes.join(', ')}`);
    }
}