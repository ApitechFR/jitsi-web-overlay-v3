import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';

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
  @Delete(":id")
  async delete(@Param("id") id: number): Promise<void> {
    return this.userService.delete(id);
  }
}
