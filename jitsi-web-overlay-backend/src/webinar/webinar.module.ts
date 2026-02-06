import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebinarInvitation } from './webinar.entity';
import { WebinarService } from './webinar.service';
import { WebinarController } from './webinar.controller';

@Module({
    imports: [TypeOrmModule.forFeature([WebinarInvitation])],
    providers: [WebinarService],
    controllers: [WebinarController],
    exports: [WebinarService],
})
export class WebinarModule { }
