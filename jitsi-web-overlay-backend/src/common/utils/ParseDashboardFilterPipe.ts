import { PipeTransform, BadRequestException } from "@nestjs/common";
import { DashboardFilter } from "../enum/dashboard_filter.enum";

export class ParseDashboardFilterPipe implements PipeTransform<string, DashboardFilter> {
  transform(value: string): DashboardFilter {
    if (!value) return undefined;
    if (!Object.values(DashboardFilter).includes(value as DashboardFilter)) {
      throw new BadRequestException(`Invalid filter. Allowed values: ${Object.values(DashboardFilter).join(", ")}`);
    }
    return value as DashboardFilter;
  }
}