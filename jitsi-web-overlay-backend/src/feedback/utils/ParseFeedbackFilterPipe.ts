import { PipeTransform, BadRequestException } from "@nestjs/common";
import { FeedbackFilter } from "../enums/feedback_filter.enum";

export class ParseFeedbackFilterPipe implements PipeTransform<string | undefined, FeedbackFilter | undefined> {
    transform(value: string | undefined): FeedbackFilter | undefined {
        if (!value) return undefined;
        if (!Object.values(FeedbackFilter).includes(value as FeedbackFilter)) {
            throw new BadRequestException(`Invalid filter. Allowed values: ${Object.values(FeedbackFilter).join(", ")}`);
        }
        return value as FeedbackFilter;
    }
}