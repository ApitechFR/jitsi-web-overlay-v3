import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'roomNamePattern', async: false })
@Injectable()
export class RoomNameValidator implements ValidatorConstraintInterface {
  constructor(private readonly configService: ConfigService) {}

  validate(roomName: string): boolean {
    const minDigits = this.configService.get<number>(
      'FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS',
    );
    const length = this.configService.get<number>(
      'FRONTCONF_ROOMNAMECONSTRAINT_LENGTH',
    );

    const regex = new RegExp(
      `^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){${minDigits}})[a-zA-Z0-9]{${length},}$`,
    );
    return regex.test(roomName);
  }

  defaultMessage() {
    return "le nom de conférence n'est pas valide";
  }
}
