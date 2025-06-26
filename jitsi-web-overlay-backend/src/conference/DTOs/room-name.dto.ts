import { ApiProperty } from '@nestjs/swagger';
import { Validate } from 'class-validator';
import { RoomNameValidator } from '../../common/validators/room-name.validator';

export class RoomNameDto {
    @ApiProperty({ type: String, description: 'nom de la conférence' })
    @Validate(RoomNameValidator)
    roomName: string;
}
