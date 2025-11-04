import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { InviteMethod, ParticipantRole, ParticipantStatus } from '../participant.enums';

export class CreateParticipantDto {
    @IsString()
    conferenceUid!: string;

    @IsOptional()
    @IsString()
    userUid?: string; // si participant a un compte

    @IsString()
    @Length(2, 128)
    displayName!: string;

    @IsOptional()
    @IsEmail()
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
