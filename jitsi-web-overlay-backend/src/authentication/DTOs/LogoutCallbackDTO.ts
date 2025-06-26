import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@Injectable()
export class LogoutCallbackDTO {
  @IsString()
  @ApiProperty({
    type: String,
    description: "le code 'state' envoyé par le fournisseur d'identité",
  })
  state: string;
}
