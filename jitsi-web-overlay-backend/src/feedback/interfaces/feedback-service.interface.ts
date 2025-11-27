import { FeedbackDTO } from '../DTOs/feedback.dto';
import { PaginationDto } from '../DTOs/pagination.dto';
import { FeedbackFilter } from '../enums/feedback_filter.enum';

export const IFeedbackService = Symbol('IFeedbackService');

export interface IFeedbackService<T = any> {
    createFeedback(dto: T, jmmcId?: string, ip?: string, userAgent?: string): Promise<T>;
    getAllFeedback?(): Promise<T[]>;
    getFeedbackById?(id: string): Promise<T | null>;
    deleteFeedback?(id: string): Promise<void>;
    findByConference?(uuid: string, filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<T>;
    //getStatsByOrganization?(organizationId: string, paginationDto: PaginationDto, filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<any>;
    getStats?(uuid: string): Promise<T>;
    createFeedbackBulk?(dtos: T[]): Promise<T[]>;
    exportFeedbacksToCSV?(filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<Buffer>;
    getTextCommentsByOrganization?(organizationId: string, label: string, paginationDto: PaginationDto, filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<T>;
    getStatsByOrganization?(organizationId: string, filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<any>;
}