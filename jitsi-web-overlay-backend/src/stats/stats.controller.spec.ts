import { StatsService } from './stats.service';
import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';

describe('StatsController', () => {
  let controller: StatsController;
  const mockStatsService = {
    homePageStats: () => {
      return { conf: 0, part: 0 };
    },
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [StatsService],
    })
      .overrideProvider(StatsService)
      .useValue(mockStatsService)
      .compile();

    controller = module.get<StatsController>(StatsController);
  });

  it('StatsController should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('homePageStats should return { conf: 0, part: 0 }', () => {
    expect(controller.homePageStats()).resolves.toEqual({ conf: 0, part: 0 });
  });
});
