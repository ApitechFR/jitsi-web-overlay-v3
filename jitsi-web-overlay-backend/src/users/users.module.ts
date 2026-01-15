import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectoryModule } from '../providers/directory/directory.module';

@Module({
  imports: [
    DirectoryModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    UsersService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
