import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateConferenceDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsDateString()
  start_time: Date;

  @ApiProperty()
  @IsDateString()
  end_time: Date;

  @ApiProperty()
  @IsUUID()
  created_by: string;
}

export class EndConferenceDTO {
  @ApiProperty()
  @IsDateString()
  end_time: Date;
}