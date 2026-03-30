import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { InviteMethod, ParticipantRole, ParticipantStatus } from '../participant.enums';
import { PartialType } from '@nestjs/mapped-types';

export class CreateParticipantDto {
    @IsString()
    conferenceUid!: string;

    @IsOptional()
    @IsString()
    userUid?: string; // si participant a un compte

    @IsString()
    @IsOptional()
    @Length(2, 128)
    displayName?: string;

    @IsOptional()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(ParticipantRole)
    role?: ParticipantRole;

    @IsOptional()
    @IsEnum(ParticipantStatus)
    status?: ParticipantStatus;

    @IsOptional()
    @IsEnum(InviteMethod)
    inviteMethod?: InviteMethod;
}

export class UpdateParticipantDto extends PartialType(CreateParticipantDto) {}
