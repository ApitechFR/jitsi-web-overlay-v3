import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';

@Module({
    imports: [HttpModule],
    providers: [OidcService],
    exports: [OidcService],
})
export class OidcModule { }
