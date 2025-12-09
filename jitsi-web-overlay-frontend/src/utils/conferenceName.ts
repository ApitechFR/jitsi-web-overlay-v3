import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

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
    '^[A-Z0-9]';

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
): boolean {
  if (!conferenceName) return false;

  const { regex, minDigits, minLength, maxLength } =
    getConferenceNameConfig();

  // Check minimum and maximum length
  if (conferenceName.length < Number(minLength)) return false;
  if (conferenceName.length > Number(maxLength)) return false;

  // Check minimum number of digits
  if ((conferenceName.match(/\d/g) || []).length < Number(minDigits)) {
    return false;
  }

  return regex.test(conferenceName);
}


export function generateConferenceName(): string {
  const { genMinLength, genMaxLength } = getConferenceNameConfig();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let name = '';

  do {
    const len =
      Math.floor(
        Math.random() *
        (Number(genMaxLength) - Number(genMinLength) + 1),
      ) + Number(genMinLength);

    name = Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
  } while (!validateConferenceName(name));

  return name;
}
