/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TEMPLATE: string;
  readonly VITE_JITSI_DOMAIN: string;
  readonly VITE_VOXAPI_URL: string;
  readonly VITE_CONFERENCE_NAME_REGEX: string;
  readonly VITE_CONFERENCE_NAME_REGEX_MESSAGE: string;

}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}