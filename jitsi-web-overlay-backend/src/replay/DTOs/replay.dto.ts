import { Injectable } from "@nestjs/common";
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReplayStatus } from "../enum/replay_status.enum";

@Injectable()
export class CreateReplayDto {
    @IsEnum(ReplayStatus)
    status: ReplayStatus;

    @IsString()
    message: string;

    @IsString()
    conference_name: string;
}
export class UpdateReplayDto {
    @IsOptional()
    @IsString()
    uid?: string;

    @IsOptional()
    @IsString()
    file_path?: string;

    @IsEnum(ReplayStatus)
    status: ReplayStatus;

    @IsOptional()
    @IsString()
    message?: string;
}