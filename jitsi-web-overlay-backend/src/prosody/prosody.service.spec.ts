import { Test, TestingModule } from '@nestjs/testing';
import { ProsodyService } from './prosody.service';

describe('ProsodyService', () => {
  let service: ProsodyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProsodyService],
    }).compile();

    service = module.get<ProsodyService>(ProsodyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
