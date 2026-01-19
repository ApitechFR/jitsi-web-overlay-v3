
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';



@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) { }


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
      VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH: process.env.FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH,
      VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH: process.env.FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH,
      VITE_APP_ORGANIZATION: process.env.APP_ORGANIZATION,
      VITE_APP_LIGHTVISIOLOGOHEADER: process.env.APP_LIGHTVISIOLOGOHEADER,
      VITE_APP_DARKVISIOLOGOHEADER: process.env.APP_DARKVISIOLOGOHEADER,
      VITE_APP_LIGHTVISIOLOGOFOOTER: process.env.APP_LIGHTVISIOLOGOFOOTER,
      VITE_APP_DARKVISIOLOGOFOOTER: process.env.APP_DARKVISIOLOGOFOOTER,
      VITE_APP_FOOTERDESCRIPTION: process.env.APP_FOOTERDESCRIPTION,
      VITE_APP_HEADERSERVICETITLE: process.env.APP_HEADERSERVICETITLE,
      VITE_APP_HEADERSERVICETAGLINE: process.env.APP_HEADERSERVICETAGLINE,
      VITE_APP_FOOTERLINKS: process.env.APP_FOOTERLINKS,
      VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH: process.env.FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH,
      VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH: process.env.FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH,
      VITE_APP_CHANGELOG_URL: process.env.APP_CHANGELOG_URL,
      VITE_APP_FAQ_URL: process.env.APP_FAQ_URL,
      VITE_APP_TITLE: process.env.APP_TITLE,
      VITE_APP_FAVICON_URL: process.env.APP_FAVICON_URL,
      VITE_IS_WEBINAR_ENABLED: process.env.IS_WEBINAR_ENABLED,
    };
  }


  @Get('/health')
  getHealth() {
    return { status: 'ok' };
  }


  @Get('/jitsi/modules')
  getJitsiModules() {
    return {
      etherpad: this.configService.get('JITSI_MOD_ETHERPAD', 'false') === 'true',
      transcription: this.configService.get('JITSI_MOD_TRANSCRIPTION', 'false') === 'true',
      recording: this.configService.get('JITSI_MOD_RECORDING', 'false') === 'true',
      excalidraw: this.configService.get('JITSI_MOD_EXCALIDRAW', 'false') === 'true',
      voxify: this.configService.get('JITSI_MOD_VOXIFY', 'false') === 'true',
    };
  }
}

