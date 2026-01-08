import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
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
  @Get('ldap/all')
  async getAllUsersLDAP() {
    return this.userService.findAllLDAP();
  }

  // Deactivate users with pwdEndTime
  @Post('pwd-endtime/deactivate')
  async deactivateExpiredPasswords(
    @Body() users: any[],
  ) {
    return this.userService.deactivateUsersWithExpiredPassword(users);
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

  @Patch(':uid/deactivate')
  async deactivate(@Param('uid') uid: string) {
    return this.userService.deactivateUser(uid);
  }

  @Post('deactivate/byemail')
  async deactivateByEmail(@Body('emails') emails: string[]) {

    if (!Array.isArray(emails) || emails.length === 0) {
      throw new BadRequestException('emails must be a non-empty array');
    }
    return this.userService.deactivateUsersByEmail(emails);
  }
}
