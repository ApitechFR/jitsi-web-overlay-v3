import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProsodyService {
  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private readonly logger = new Logger(ProsodyService.name);

  private jicofo_available_instances: string[] = this.configService.get(
    'JICOFO_AVAILABLE_INSTANCES',
  )
    ? this.configService.get('JICOFO_AVAILABLE_INSTANCES').split(' ')
    : [];

  private prosody_available_instances: string[] = this.configService.get(
    'PROSODY_AVAILABLE_INSTANCES',
  )
    ? this.configService.get('PROSODY_AVAILABLE_INSTANCES').split(' ')
    : [];

  async getRoomFromProsody(urls: string[]): Promise<string[] | [] | false> {
    const index = 0;
    try {
      const { data } = await this.httpService.axiosRef.get(urls[index]);
      return data;
    } catch (error) {
      if (urls.length > 1) {
        return this.getRoomFromProsody(urls.slice(1));
      } else if (urls.length === 1 && error.response?.status === 404) {
        return [];
      } else {
        return false;
      }
    }
  }

  async roomExists(roomName: string) {
    const prosody_domain = this.configService.get('PROSODY_DOMAIN');
    const room_prosody_urls =
      this.prosody_available_instances.length !== 0
        ? this.prosody_available_instances.map(
            (url) =>
              url +
              `/room?domain=${prosody_domain}&room=${roomName.toLocaleLowerCase()}&subdomain=`,
          )
        : null;

    if (await this.getRoomFromProsody(room_prosody_urls)) {
      return this.getRoomFromProsody(room_prosody_urls);
    } else {
      this.logger.error(
        "l'url prosody n'existe pas ou erreur de charger les urls",
      );
      throw new NotFoundException(
        "l'url prosody n'existe pas ou erreur de charger les urls",
      );
    }
  }

  async userExists(roomName: string, userId: string) {
    try {
      let userFound = false;
      const room = (await this.roomExists(roomName)) as any[] | [];
      for (let i = 0; i < room.length; i++) {
        if (userId === room[i].jid.substr(room[i].jid.lastIndexOf('/') + 1)) {
          userFound = true;
          break;
        }
      }
      return userFound;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getRealTimeStats() {
    const stats_prosody_urls =
      this.jicofo_available_instances.length !== 0 &&
      this.jicofo_available_instances.map((url) => {
        return this.httpService.axiosRef.get(url + '/stats');
      });

    try {
      const res = await Promise.all(stats_prosody_urls);
      const data = [];
      res.forEach((element) => data.push(element.data));
      return data;
    } catch (error) {
      this.logger.error("le serveur jicofo n'est pas disponible", error);
      throw new NotFoundException("le serveur jicofo n'est pas disponible");
    }
  }
}
