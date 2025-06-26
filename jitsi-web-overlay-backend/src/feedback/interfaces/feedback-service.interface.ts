import { FeedbackDTO } from '../DTOs/feedback.dto';

export const IFeedbackService = Symbol('IFeedbackService');

export interface IFeedbackService<T = any> {
    createFeedback(dto: FeedbackDTO, jmmcId: string, ip: string, userAgent?: string): Promise<T>;
    getAllFeedback?(): Promise<T[]>;
    getFeedbackById?(id: string): Promise<T | null>;
    deleteFeedback?(id: string): Promise<void>;
}
