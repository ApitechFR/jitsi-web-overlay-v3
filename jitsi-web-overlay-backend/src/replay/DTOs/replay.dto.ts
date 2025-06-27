import { Injectable } from "@nestjs/common";
import { IsOptional, IsString } from 'class-validator';

@Injectable()
export class CreateReplayDto {
    @IsString()
    status: string;

    @IsString()
    message: string;

    @IsString()
    conference_name: string;
}
export class UpdateReplayDto {
    @IsString()
    uid: string;

    @IsOptional()
    @IsString()
    file_path?: string;

    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    message?: string;
}