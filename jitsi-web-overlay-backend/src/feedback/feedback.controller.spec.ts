import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { IFeedbackService } from './interfaces/feedback-service.interface';
import { FeedbackDTO } from './DTOs/feedback.dto';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let mockService: IFeedbackService;

  beforeEach(async () => {
    mockService = {
      createFeedback: jest.fn().mockResolvedValue({ status: 'ok' }),
      getAllFeedback: jest.fn().mockResolvedValue([{ id: '1' }]),
      getFeedbackById: jest.fn().mockResolvedValue({ id: '1' }),
      deleteFeedback: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: 'FEEDBACK_SERVICE', useValue: mockService }],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create feedback', async () => {
    const dto = { isVPN: -1, rt: { qty: 3 }, com: 'test' } as FeedbackDTO;
    const req = {
      ip: '127.0.0.1',
      signedCookies: { jmmc_objectId: 'abc123' },
    } as any;
    const result = await controller.createFeedback(req, dto, 'internet');
    expect(result).toEqual({ status: 'ok' });
  });

  it('should throw BadRequestException if VPN context is invalid', async () => {
    const dto = { isVPN: 1, rt: { qty: 3 }, com: 'test' } as FeedbackDTO;
    const req = {
      ip: '127.0.0.1',
      signedCookies: { jmmc_objectId: 'abc123' },
      headers: { 'user-agent': 'test' },
    } as any;
    await expect(
      controller.createFeedback(req, dto, 'internet'),
    ).rejects.toThrow(
      'Veuillez vérifier les informations que vous avez envoyées.',
    );
  });

  it('should get all feedbacks', async () => {
    const result = await controller.getAll();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should get feedback by id', async () => {
    const result = await controller.getOne('1');
    expect(result).toEqual({ id: '1' });
  });

  it('should delete feedback', async () => {
    await expect(controller.remove('1')).resolves.toBeUndefined();
  });
});
