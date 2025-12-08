import vars from "./vars.json";
import pkg from "./package.json";

export const APP_VERSION = pkg.version;

export const configs = {
  dialInNumbersUrl: vars.DIALINNUMBER_URL,
  dialInConfCodeUrl: vars.DIALINCONFCODE_URL,
  ENABLE_PHONE_ACCESS: vars.ENABLE_PHONE_ACCESS,
  JITSI_DOMAIN: vars.JITSI_DOMAIN,
  PHONE_NUMBER_FORMAT: vars.PHONE_NUMBER_FORMAT,
  MODERATOR_OPTIONS: vars.ENABLE_MODERATOR_OPTIONS,
  TITLE_MEETING_DETAILS: vars.TITLE_MEETING_DETAILS,
  room_name_prefix: vars.ROOM_NAME_PREFIX, //process.env.ROOM_NAME_PREFIX,
  room_name_size: vars.ROOM_NAME_LENGTH,
  //process.env.ROOM_NAME_SIZE ? parseInt(process.env.ROOM_NAME_SIZE, 10) : 15,
};
