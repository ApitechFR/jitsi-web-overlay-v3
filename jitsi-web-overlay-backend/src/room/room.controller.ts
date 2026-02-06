import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDTO, UpdateRoomDTO } from './DTOs/room.dto';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@ApiTags('room')
@Controller('rooms')
export class RoomController {

    constructor(private readonly roomService: RoomService) { }

    @Post()
    @ApiOkResponse({ description: 'Room créée avec succès' })
    async create(@Body() dto: CreateRoomDTO) {
        return this.roomService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll() {
        return this.roomService.findAll();
    }

    @Get(':uid')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('uid') uid: string) {
        return this.roomService.findOne(uid);
    }

    @Get('name/:roomName')
    async findByRoomName(@Param('roomName') roomName: string) {
        return this.roomService.findByRoomName(roomName);
    }

    @Patch(':uid')
    @UseGuards(JwtAuthGuard)
    async updateRoom(
        @Param('uid') uid: string,
        @Body() updateDto: UpdateRoomDTO
    ) {
        return this.roomService.updateByUid(uid, updateDto);
    }
}
