import { IFeedbackService } from './interfaces/feedback-service.interface';
import { FeedbackDTO } from './DTOs/feedback.dto';

describe('IFeedbackService (mock)', () => {
    let service: IFeedbackService;

    beforeEach(() => {
        service = {
            createFeedback: jest.fn((body: FeedbackDTO, jmmc_id: string, ip: string, userAgent: string) => Promise.resolve({ status: 'ok' })),
            getAllFeedback: jest.fn(() => Promise.resolve([{ id: '1' }])),
            getFeedbackById: jest.fn(id => Promise.resolve({ id })),
            deleteFeedback: jest.fn(id => Promise.resolve()),
        };
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('createFeedback should return status ok', async () => {
        const dto = { isVPN: -1, rt: { qty: 3 }, com: 'test' } as FeedbackDTO;
        await expect(service.createFeedback(dto, 'abc', '127.0.0.1', 'agent')).resolves.toEqual({ status: 'ok' });
    });

    it('getAllFeedback should return feedbacks', async () => {
        await expect(service.getAllFeedback()).resolves.toEqual([{ id: '1' }]);
    });

    it('getFeedbackById should return feedback by id', async () => {
        await expect(service.getFeedbackById('1')).resolves.toEqual({ id: '1' });
    });

    it('deleteFeedback should resolve without error', async () => {
        await expect(service.deleteFeedback('1')).resolves.toBeUndefined();
    });
});
