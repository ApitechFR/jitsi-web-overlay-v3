
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('/config')
  getFrontendConfig() {
    return {
      VITE_APP_TEMPLATE: process.env.APP_TEMPLATE,
      VITE_JITSI_DOMAIN: process.env.JITSI_DOMAIN,
      VITE_VOXAPI_URL: process.env.VOXAPI_URL,
      VITE_CONFERENCE_NAME_REGEX: process.env.CONFERENCE_NAME_REGEX,
      VITE_CONFERENCE_NAME_REGEX_MESSAGE: process.env.CONFERENCE_NAME_REGEX_MESSAGE,
      VITE_ENABLE_JIBRI_APITECH_API: process.env.ENABLE_JIBRI_APITECH_API,
      VITE_JIBRI_APITECH_API_DOMAIN: process.env.JIBRI_APITECH_API_DOMAIN,
      VITE_REPLAY_CHECK_TIMEOUT_MS: process.env.REPLAY_CHECK_TIMEOUT_MS,
      VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS: process.env.FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS,
      VITE_FRONTCONF_ROOMNAMECONSTRAINT_LENGTH: process.env.FRONTCONF_ROOMNAMECONSTRAINT_LENGTH,
      VITE_APP_ORGANIZATION: process.env.APP_ORGANIZATION,
    };
  }
}
