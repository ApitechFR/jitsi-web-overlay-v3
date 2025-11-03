import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

const cfg = getCachedRuntimeConfig();
const minDigits = cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS || 3;
const length = cfg?.VITE_FRONTCONF_ROOMNAMECONSTRAINT_LENGTH || 10;
const regexString = cfg?.VITE_CONFERENCE_NAME_REGEX || "^[a-zA-Z0-9_-]";

export const conferenceNameConfig = {
  regex: new RegExp(
    `${regexString}{${minDigits},${length}}$`
  ),
};

export function validateConferenceName(conferenceName: string | undefined): boolean {
  if (!conferenceName) return false;
  return conferenceNameConfig.regex.test(conferenceName);
}

export function generateConferenceName(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let name = '';
  do {
    name = Array.from({ length: 10 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  } while (!validateConferenceName(name));
  return name;
}

