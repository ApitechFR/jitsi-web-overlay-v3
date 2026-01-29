import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

export interface ConferenceNameValidation {
  isValidConfName: boolean;
  isValidLength: boolean;
  isValidDigits: boolean;
  isValidRegex: boolean;
}

function getConferenceNameConfig() {
  const cfg = getCachedRuntimeConfig();

  const minDigits =
    cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS ?? 0;

  const minLength =
    cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH ?? 3;

  const maxLength =
    cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH ?? 10;

  // Lengths used for GENERATION only
  const genMinLength =
    cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH ?? minLength;

  const genMaxLength =
    cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH ?? maxLength;


  const regexString =
    cfg?.VITE_CONFERENCE_NAME_REGEX ??
    '^[A-Z0-9]+$';

  return {
    regex: new RegExp(regexString),
    minDigits,
    minLength,
    maxLength,
    genMinLength,
    genMaxLength,
  };
}


export function validateConferenceName(
  conferenceName: string | undefined,
): ConferenceNameValidation {
  if (!conferenceName) return {
    isValidConfName: false,
    isValidLength: false,
    isValidDigits: false,
    isValidRegex: false,
  };

  const { regex, minDigits, minLength, maxLength } =
    getConferenceNameConfig();

  // Check minimum and maximum length
  const length = conferenceName.length >= Number(minLength) && conferenceName.length < Number(maxLength);

  // Check minimum number of digits
  const digits = (conferenceName.match(/\d/g) || []).length >= Number(minDigits);

  const testRegex = regex.test(conferenceName);

  const test = {
    isValidConfName: length && digits && testRegex,
    isValidLength: length,
    isValidDigits: digits,
    isValidRegex: testRegex,
  };

  return {
    isValidConfName: length && digits && testRegex,
    isValidLength: length,
    isValidDigits: digits,
    isValidRegex: testRegex,
  };
}

export function generateConferenceName(): string {
  const { genMinLength, genMaxLength, minDigits } = getConferenceNameConfig();

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const allChars = letters + digits;

  let name = '';

  do {
    const len =
      Math.floor(Math.random() * (Number(genMaxLength) - Number(genMinLength) + 1)) +
      Number(genMinLength);

    if (Number(minDigits) > len) {
      throw new Error('minDigits cannot be greater than generated length');
    }

    const chars: string[] = [];

    for (let i = 0; i < Number(minDigits); i++) {
      chars.push(digits.charAt(Math.floor(Math.random() * digits.length)));
    }

    for (let i = chars.length; i < len; i++) {
      chars.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
    }

    name = chars
      .sort(() => Math.random() - 0.5)
      .join('');
  } while (!validateConferenceName(name));

  return name;
}

