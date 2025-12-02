import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';
import { Roles } from '../authentication/roles.decorator';
import { RolesGuard } from '../authentication/roles.guard';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  // Create user

  @Post()
  async createUser(
    @Body() userData: Partial<User>,
  ): Promise<User> {
    return this.userService.createUser(userData);
  }

  // Get all user
  @Get()
  async getAllUser(): Promise<User[]> {
    return this.userService.findAll();
  }

  // Get user by ID
  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  //Update user
  @Put(":id")
  async update(@Param("id") id: number, @Body() userData: Partial<User>): Promise<User> {
    return this.userService.update(id, userData);
  }

  //delete user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(":id")
  async delete(@Param("id") id: number): Promise<void> {
    return this.userService.delete(id);
  }
}
