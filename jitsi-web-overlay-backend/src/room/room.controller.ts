import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDTO, UpdateRoomDTO } from './DTOs/room.dto';

@ApiTags('room')
@Controller('room')
export class RoomController {

    constructor(private readonly roomService: RoomService) { }

    @Post()
    @ApiOkResponse({ description: 'Room créée avec succès' })
    async create(@Body() dto: CreateRoomDTO) {
        return this.roomService.create(dto);
    }

    @Get()
    async findAll() {
        return this.roomService.findAll();
    }

    @Get(':uid')
    async findOne(@Param('uid') uid: string) {
        return this.roomService.findOne(uid);
    }

    @Get('name/:roomName')
    async findByRoomName(@Param('roomName') roomName: string) {
        return this.roomService.findByRoomName(roomName);
    }

    @Patch(':uid')
    async updateRoom(
        @Param('uid') uid: string,
        @Body() updateDto: UpdateRoomDTO
    ) {
        return this.roomService.updateByUid(uid, updateDto);
    }
}
