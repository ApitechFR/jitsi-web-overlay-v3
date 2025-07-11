import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConferenceDTO {
  @ApiProperty()
  @IsUUID()
  room_uid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsDateString()
  start_time: Date;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  end_time?: Date;

  @ApiProperty()
  @IsUUID()
  created_by: string;
}

export class EndConferenceDTO {
  @ApiProperty()
  @IsDateString()
  end_time: Date;
}