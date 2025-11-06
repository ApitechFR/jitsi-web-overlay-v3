import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

function getConferenceNameConfig() {
  const cfg = getCachedRuntimeConfig();
  const minDigits = cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS || 3;
  const length = cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_LENGTH || 10;
  const regexString = cfg?.VITE_CONFERENCE_NAME_REGEX || "^[a-zA-Z0-9_-]";
  return {
    regex: new RegExp(`${regexString}{${minDigits},${length}}$`),
    minDigits,
    length,
  };
}

export function validateConferenceName(conferenceName: string | undefined): boolean {
  if (!conferenceName) return false;
  const { regex } = getConferenceNameConfig();
  return regex.test(conferenceName);
}

export function generateConferenceName(): string {
  const { length } = getConferenceNameConfig();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let name = '';
  do {
    name = Array.from({ length: Number(length) }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  } while (!validateConferenceName(name));
  return name;
}