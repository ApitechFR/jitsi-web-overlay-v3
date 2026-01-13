
import vars from "./vars.json";
import pkg from "./package.json";

function getEnvOrVar(key: string, fallback?: any) {
  return process.env[key] || vars[key] || fallback;
}

export const APP_VERSION = pkg.version;

export const configs = {
  dialInNumbersUrl: getEnvOrVar('DIALINNUMBER_URL'),
  dialInConfCodeUrl: getEnvOrVar('DIALINCONFCODE_URL'),
  ENABLE_PHONE_ACCESS: getEnvOrVar('ENABLE_PHONE_ACCESS'),
  JITSI_DOMAIN: getEnvOrVar('JITSI_DOMAIN'),
  PHONE_NUMBER_FORMAT: getEnvOrVar('PHONE_NUMBER_FORMAT'),
  MODERATOR_OPTIONS: getEnvOrVar('ENABLE_MODERATOR_OPTIONS'),
  TITLE_MEETING_DETAILS: getEnvOrVar('TITLE_MEETING_DETAILS'),
  room_name_prefix: getEnvOrVar('ROOM_NAME_PREFIX'),
  room_name_size: getEnvOrVar('ROOM_NAME_LENGTH'),
};
