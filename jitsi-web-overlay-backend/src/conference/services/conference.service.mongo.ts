import {
    Logger,
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ProsodyService } from '../../prosody/prosody.service';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhiteListedDomains } from '../../schemas/WhiteListedDomains.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { IConferenceService } from '../interfaces/conference-service.interface';
import { CreateConferenceDTO } from '../DTOs/conference.dto';

@Injectable()
export class ConferenceServiceMongo implements IConferenceService {
    private readonly logger = new Logger(ConferenceServiceMongo.name);

    constructor(
        @InjectModel(WhiteListedDomains.name)
        private readonly whiteListedDomainsModel: Model<WhiteListedDomains>,
        private readonly prosodyService: ProsodyService,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) { }


    async roomExists(roomName: string) {
        const exists = await this.prosodyService.roomExists(roomName);
        if (exists && exists.length > 0) {
            return { roomName };
        } else {
            this.logger.error("la conférence n'existe pas");
            throw new NotFoundException("la conférence n'existe pas");
        }
    }

    async getRoomTestAccessToken(roomName: string) {
        this.logger.log("récupération de l'accessToken pour tester le materiel");
        if (
            roomName.toLocaleLowerCase().startsWith('browserTest123') &&
            roomName.length === 30
        ) {
            const jwt = this.jwtService.sign({
                iss: this.configService.get('JITSI_JITSIJWT_ISS'),
                exp: moment().add('5', 'minutes').unix(),
                aud: this.configService.get('JITSI_JITSIJWT_AUD'),
                sub: this.configService.get('JITSI_JITSIJWT_SUB'),
                room: roomName,
            });
            return { roomName, jwt };
        }
    }
    async getRoomAccessToken(
        roomName: string,
        webconfUserRegion: string,
        accessToken: string,
    ) {
        this.logger.log("récupération de l'accessToken pour ouvrir une conférence");
        // si la conférence est déja ouverte
        const exists = await this.prosodyService.roomExists(roomName);
        if (exists && exists.length > 0) {
            return { roomName };
        }

        // si l'utilisateur RIE ou MTE
        if (this.isInternalUser(webconfUserRegion)) {
            return this.sendToken(roomName);
        }

        // si le salon n'existe pas et l'utilisateur internet (authentication check)
        if (!accessToken) {
            this.logger.warn(
                "veuillez vous authentifier pour accéder à la webconf de l'Etat",
            );
            throw new UnauthorizedException(
                "veuillez vous authentifier pour accéder à la webconf de l'Etat",
            );
        }

        this.verifyToken(accessToken);

        return this.sendToken(roomName);
    }

    // authentication by email
    async getRoomAccessTokenByEmail({ room, email, host }) {
        const domain = email.split('@')[1];
        try {
            const docs = await this.whiteListedDomainsModel.find();
            const exists = await docs.some((element) => {
                const elt = element.domains.find((elt) => elt === domain);
                return elt === domain;
            });

            if (!exists) {
                throw new UnauthorizedException({ isWhitelisted: false });
            }

            const { roomName, jwt } = this.sendToken(room);
            const jwtConferenceLink = `https://${host}/${roomName}?jwt=${jwt}`;
            const conferenceLink = `https://${host}/${roomName}`;
            const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="utf-8">
          <!-- Title of this page -->
          <title>WebConférence de l'État</title>
          <!-- viewport of this page -->
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
          <!-- description of this page -->
          <meta name="description" content="WebConférence de l'État">
          <!-- author of this page -->
          <meta name="author" content="GMCD MTES">
      </head>
      <body>
      <header>
          <p>Bonjour,</p>
          <p>
              Vous avez effectué une demande de création de la conférence <i>${roomName}</i> sur notre site.<br>
          </p>
      </header>
      <main>
          Voici les liens pour accéder à la conférence:
          <br>
          <p style="overflow-wrap: break-word; margin:10px; color: black; background-color: white; border-radius: 2px; font-weight: bold;">
              Lien modérateur (Valable pendant ${this.configService.get('JITSI_JITSIJWT_EXPIRESAFTER')} heures à partir de la réception de cet email) : 
              <br>
              <small>Ce lien vous permet de contrôler le fonctionnement de votre conférence.</small>    
              <br>            
              <a href=${jwtConferenceLink}>${jwtConferenceLink}</a>
          </p>
          <p style="margin:10px; color: black; background-color: white; border-radius: 2px; font-weight: bold;">
              Lien invité :
              <br>
              <small>Ce lien doit être communiqué à vos invités.</small>
              <br>
              <a href=${conferenceLink}>${conferenceLink}</a>
          </p>
      </main>
      <!-- Footer -->
      <footer style="margin-top:20px">
          <p>
              <br>
              <span>Pour nous contacter :</span>
              <ul>
                <li>Pour toute demande d'assistance :  <a href="mailto:assistance@webconf.numerique.gouv.fr">assistance@webconf.numerique.gouv.fr</a></li>
                <li>Pour toute autre demande :  <a href="mailto:contact@webconf.numerique.gouv.fr">contact@webconf.numerique.gouv.fr</a></li>
              </ul>
          </p>
      </footer>
      </body>
      </html>
      `;
            await this.mailerService.sendMail({
                from: this.configService.get('EMAIL_FROM'), // sender address
                to: email, // list of receivers
                subject: this.configService.get('EMAIL_SUBJECT') + roomName, // Subject line
                html: html,
            });

            return { isWhitelisted: true, sended: 'email sended' };
        } catch (error) {
            this.logger.error("erreur de l'envoi de l'email");
            throw new BadRequestException("erreur de l'envoi de l'email");
        }
    }

    verifyToken(jwt: string) {
        try {
            if (jwt && this.jwtService.verify(jwt)) {
                return { jwt };
            }
        } catch (error) {
            this.logger.error("l'accessToken est expiré", error);
            throw new UnauthorizedException("l'accessToken est expiré");
        }
    }

    isInternalUser(webconfUserRegion: string) {
        return webconfUserRegion.toLowerCase() !== 'internet';
    }

    sendToken(roomName: string) {
        const jwt = this.jwtService.sign({
            iss: this.configService.get('JITSI_JITSIJWT_ISS'),
            exp: moment()
                .add(this.configService.get('JITSI_JITSIJWT_EXPIRESAFTER'), 'hours')
                .unix(),
            aud: this.configService.get('JITSI_JITSIJWT_AUD'),
            sub: this.configService.get('JITSI_JITSIJWT_SUB'),
            room: roomName,
        });
        return { roomName, jwt };
    }

}
