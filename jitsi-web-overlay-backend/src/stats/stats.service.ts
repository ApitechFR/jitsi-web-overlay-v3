import { ProsodyService } from './../prosody/prosody.service';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  constructor(private prosodyService: ProsodyService) {}
  async homePageStats() {
    try {
      const data = await this.prosodyService.getRealTimeStats();
      if (data.length > 1) {
        const mergedData = { conf: 0, part: 0 };
        for (let i = 0; i < data.length; i++) {
          mergedData.conf += data[i].conferences;
          mergedData.part += data[i].participants;
        }
        this.logger.log('stats récupérés' + mergedData);
        return mergedData;
      } else {
        this.logger.log('stats récupérés' + data[0]);
        return data[0];
      }
    } catch (error) {
      this.logger.error('erreur lors de la récupération des stats', error);
      throw error;
    }
  }
}
