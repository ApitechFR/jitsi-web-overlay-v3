import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@Injectable()
export class LoginCallbackDTO {
  @IsString()
  @ApiProperty({
    type: String,
    description: "le code 'state' envoyé par le fournisseur d'identité",
  })
  state: string;
  @IsString()
  @ApiProperty({
    type: String,
    description: "le 'code' envoyé par le fournisseur d'identité",
  })
  code: string;
}
