import { StatsService } from './stats.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../authentication/roles.decorator';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';
import { RolesGuard } from '../authentication/roles.guard';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

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
    return this.statsService.realTimeStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
    return this.statsService.realTimeStats();
  }
}
