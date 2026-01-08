import { Inject, Injectable } from '@nestjs/common';
import { IConferenceService } from '../conference/interfaces/conference-service.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { ReplayService } from '../replay/replay.service';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '../common/services/winston-logger.service';

@Injectable()
export class AutomationService {

    constructor(
        @Inject(IConferenceService)
        private readonly conferenceService: IConferenceService,
        private readonly userService: UsersService,
        private readonly replayService: ReplayService,
        private readonly configService: ConfigService,
        private readonly logger: WinstonLoggerService,
    ) { }

    /**
     * Cron job : toutes les minutes, on vérifie les conférences actives.
     * Si participants = 0, on met end_time et on termine la conférence.
    */
    @Cron(CronExpression.EVERY_MINUTE)
    async runCloseEmptyConferences() {
        await this.conferenceService.closeEmptyConferences();
    }



    /**
     * Désactivation des conférences des utilisateurs inactifs
    */
    async runDeactivateConferences() {
        this.logger.log('[Conference] Deactivation started');

        const result = await this.conferenceService.disableAllInactiveUserConferences();

        if (result.totalDisabled === 0) {
            this.logger.log('[Conference] No conferences to deactivate');
        }

        this.logger.log(`[Conference] Deactivated count=${result.totalDisabled}`);
        this.logger.log(`[Conference] Deactivated conferences uids=${result.disabledConferences.join(', ')}`);

        this.logger.log('[Conference] Deactivation finished');
    }


    /**
     * Suppression des utilisateurs désactivés depuis plus de RETENTION_DAYS
     * Suppression des replays liés aux conférences des utilisateurs désactivés depuis plus de RETENTION_DAYS
    */
    async applyRetention() {
        const retentionDays = Number(
            this.configService.get('RETENTION_DAYS', 90),
        );

        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - retentionDays);

        this.logger.log(`[Retention] Start – retention days = ${retentionDays}`);
        this.logger.log(`[Retention] deactivation limite date = ${limitDate.toLocaleString('fr-FR', {timeZone: 'Europe/Paris'})}`);

        const usersResult = await this.userService.deleteDeactivatedUsers(limitDate);

        this.logger.log(
            `[Retention][Users] deleted=${usersResult.totalDeleted} uids=${usersResult.deletedUserUids.join(', ')}`,
        );

        const replaysResult = await this.replayService.deleteReplaysByDeactivatedConferences(limitDate);

        this.logger.log(
            `[Retention][Replays] totalDeleted=${replaysResult.totalDeleted} details=` +
            replaysResult.byConference
                .map(c => `${c.conferenceUid}:${c.count}`)
                .join(', '),
        );

        this.logger.log('[Retention] Finished');
    }

    @Cron(CronExpression.EVERY_DAY_AT_6PM, {timeZone: 'Europe/Paris'})
    // @Cron(CronExpression.EVERY_MINUTE)
    async dailyAutomation() {
        this.logger.log('=== DAILY AUTOMATION START ===');

        await this.runDeactivateConferences();
        await this.applyRetention();

        this.logger.log('=== DAILY AUTOMATION END ===\n');
    }
}
