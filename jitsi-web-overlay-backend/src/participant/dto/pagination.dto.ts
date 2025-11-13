import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsPositive } from 'class-validator';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    limit?: number = 20;
}