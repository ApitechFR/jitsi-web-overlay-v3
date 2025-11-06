import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDTO, UpdateRoomDTO } from './DTOs/room.dto';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@ApiTags('room')
@UseGuards(JwtAuthGuard)
@Controller('rooms')
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
