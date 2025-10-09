import { IsNotEmpty } from 'class-validator';

export class RegisterEventDto {
  @IsNotEmpty()
  confname: string;

  @IsNotEmpty()
  eventid: string;

  @IsNotEmpty()
  jwt: string;

  @IsNotEmpty()
  uploadCallbackUrl: string;

  @IsNotEmpty()
  uploadCallbackDomainUrl: string;
}