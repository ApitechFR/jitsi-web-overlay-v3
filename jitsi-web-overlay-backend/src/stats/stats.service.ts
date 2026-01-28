import { ProsodyService } from './../prosody/prosody.service';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  constructor(private prosodyService: ProsodyService) { }
  async realTimeStats() {
    try {
      const data = await this.prosodyService.getRealTimeStats();
      const result = { conf: 0, part: 0 };

      for (const item of data) {
        result.conf += item.conferences;
        result.part += item.participants;
      }

      this.logger.log(`stats récupérés ${JSON.stringify(result)}`);
      return result;
      
    } catch (error) {
      this.logger.error('erreur lors de la récupération des stats', error);
      throw error;
    }
  }
}
