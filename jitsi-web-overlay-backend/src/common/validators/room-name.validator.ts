import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'roomNamePattern', async: false })
@Injectable()
export class RoomNameValidator implements ValidatorConstraintInterface {
  constructor(private readonly configService: ConfigService) { }

  validate(roomName: string): boolean {
    if (!this.configService) return false;

    const minDigits =
      this.configService.get<number>(
        'FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS',
      ) || 3;

    const minLength =
      this.configService.get<number>(
        'FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH',
      ) ?? 3;

    const maxLength =
      this.configService.get<number>(
        'FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH',
      ) ?? 10;

    // We assume the config regex is complete (with ^ and $)
    // Example: "^[a-zA-Z0-9_-]{3,10}$"
    const regexString =
      this.configService.get<string>('CONFERENCE_NAME_REGEX') ||
      '^[a-zA-Z0-9_-]{3,10}$';

    if (!minDigits || !minLength || !maxLength) return false;

    // Length min / max
    if (roomName.length < minLength) return false;
    if (roomName.length > maxLength) return false;

    // Minimum number of digits
    if ((roomName.match(/\d/g) || []).length < minDigits) return false;

    const regex = new RegExp(regexString);
    return regex.test(roomName);
  }

  defaultMessage() {
    return "le nom de conférence n'est pas valide";
  }
}
