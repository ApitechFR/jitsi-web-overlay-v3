import { StatsService } from './stats.service';
import { Controller, Get } from '@nestjs/common';
import { ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';

@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) { }

  @Get('/homePage')
  @ApiResponse({
    status: 200,
    description:
      'retourne le nombre de participants et le nombre de conférences ouvertes',
  })
  @ApiNotFoundResponse({
    description: "le serveur jicofo n'est pas disponible",
  })
  async homePageStats() {
    return this.statsService.homePageStats();
  }

  @Get('/realtime')
  @ApiResponse({
    status: 200,
    description:
      'retourne le nombre de participants et le nombre de conférences',
  })
  @ApiNotFoundResponse({
    description: "le serveur jicofo n'est pas disponible",
  })
  async dashboardStats() {
    return this.statsService.dashboardStats();
  }
}
