import { Test, TestingModule } from '@nestjs/testing';
import { VoxifyController } from './voxify.controller';

describe('VoxifyController', () => {
  let controller: VoxifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoxifyController],
    }).compile();

    controller = module.get<VoxifyController>(VoxifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
