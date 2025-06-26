import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Validate } from 'class-validator';
import { RoomNameValidator } from '../../common/validators/room-name.validator';

export class ByEmailDTO {
  @ApiProperty({ type: String })
  @Validate(RoomNameValidator)
  roomName: string;

  @IsEmail()
  @ApiProperty({ type: String })
  email: string;
}
