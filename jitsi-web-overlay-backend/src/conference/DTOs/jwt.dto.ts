import { Injectable } from '@nestjs/common';
import { IsJWT } from 'class-validator';

@Injectable()
export class JwtDTO {
  @IsJWT()
  jwt: string;
}
