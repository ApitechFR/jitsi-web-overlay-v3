import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class Rating {
  @IsNumber({}, { message: 'inv doit etre un nombre' })
  @IsOptional()
  @Min(0, { message: 'inv doit etre supérieur à 0' })
  @Max(5, { message: 'inv doit etre inférieur à 5' })
  @ApiProperty({
    type: Number,
    required: false,
    description: 'qty doit etre un entier supérieur à 0 et inférieur à 5',
  })
  inv: number;
  @IsNumber({}, { message: 'qty doit etre un nombre' })
  @Min(1, { message: 'qty doit etre supérieur à 1' })
  @Max(5, { message: 'qty doit etre inférieur à 5' })
  @ApiProperty({
    type: Number,
    required: true,
    description: 'qty doit etre un entier supérieur à 1 et inférieur à 5',
  })
  qty: number;
}

@Injectable()
export class FeedbackDTO {
  @IsNumber({}, { message: 'isVPN doit etre un nombre' })
  @Min(-1, { message: 'isVPN doit etre supérieur à -1' })
  @Max(1, { message: 'isVPN doit etre inférieur à 1' })
  @ApiProperty({ type: Number, description: 'doit etre -1 , 0 ou 1' })
  isVPN: number;

  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => Rating)
  @ApiProperty({ type: Rating })
  rt: Rating;

  @IsString({ message: 'com doit etre une chaine de caractères' })
  @ApiProperty({ type: String })
  com: string;
}
