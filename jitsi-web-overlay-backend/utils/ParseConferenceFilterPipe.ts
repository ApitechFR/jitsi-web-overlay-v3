import { PipeTransform, BadRequestException } from "@nestjs/common";
import { ConferenceFilter } from "../src/conference/enum/conference_filter.enum";

export class ParseConferenceFilterPipe implements PipeTransform<string, ConferenceFilter> {
  transform(value: string): ConferenceFilter {
    if (!value) return undefined;
    if (!Object.values(ConferenceFilter).includes(value as ConferenceFilter)) {
      throw new BadRequestException(`Invalid filter. Allowed values: ${Object.values(ConferenceFilter).join(", ")}`);
    }
    return value as ConferenceFilter;
  }
}