import {
    Injectable,
    Logger,
    ServiceUnavailableException,
    NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

import { ENV, DEFAULTS } from '../conference/ constants/prosody.constants';
import { ProsodyEndpoint } from '../conference/enum/prosody-endpoint.enum';
import { ProsodyQueryKey } from '../conference/enum/prosody-query-key.enum';
import type { Occupant } from '../conference/types/occupant.type';
import {
    splitList,
    buildPath,
    makeUrl,
    parseNumberLike,
    parseParticipantsNumber,
    parseOccupantsList,
} from '../conference/utils/prosody-runtime.utils';

@Injectable()
export class ProsodyRuntimeService {
    private readonly logger = new Logger(ProsodyRuntimeService.name);

    // Instances Prosody (séparateur espace OU virgule)
    private readonly prosodyInstances = splitList(
        this.config.get<string>(ENV.PROSODY_INSTANCES),
    );

    // Domaine MUC (conference.<host> en général)
    private readonly mucDomain =
        this.config.get<string>(ENV.JITSI_MUC_DOMAIN) ??
        this.config.get<string>(ENV.PROSODY_DOMAIN) ??
        '';

    // Chemins configurables
    private readonly apiPrefix =
        this.config.get<string>(ENV.PROSODY_API_PREFIX) ?? DEFAULTS.ApiPrefix;

    private readonly pathRoomSize =
        this.config.get<string>(ENV.EP_ROOM_SIZE) ?? ProsodyEndpoint.RoomSize;

    private readonly pathRoom =
        this.config.get<string>(ENV.EP_ROOM) ?? ProsodyEndpoint.Room;

    private readonly pathSessions =
        this.config.get<string>(ENV.EP_SESSIONS) ?? ProsodyEndpoint.Sessions;

    // Token service (si mod_token_verification actif côté Prosody)
    private readonly staticToken =
        this.config.get<string>(ENV.SERVICE_TOKEN) ?? '';


    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {
    }

    /** True si ≥ 1 participant (hors focus). */
    async roomExistsV2(roomName: string): Promise<boolean> {
        return (await this.getRoomSizeV2(roomName)) > 0;
    }

    /** Compte les participants (hors focus). Tolère JSON ou entier brut. */
    async getRoomSizeV2(roomName: string): Promise<number> {
        const room = (roomName ?? '').trim().toLowerCase();
        this.logger.debug(`getRoomSizeV2(${room})`);
        if (!room) return 0;

        const path = buildPath(this.apiPrefix, this.pathRoomSize);
        const res = await this.tryAll<number>(
            path,
            { [ProsodyQueryKey.Room]: room, [ProsodyQueryKey.Domain]: this.mucDomain },
            d => parseParticipantsNumber(d),
            //  token,
        );

        return res ?? 0;
    }

    /** Liste les occupants (hors focus). */
    async getRoomOccupantsV2(roomName: string, token: string): Promise<Occupant[]> {
        const room = (roomName ?? '').trim().toLowerCase();
        if (!room) return [];

        const path = buildPath(this.apiPrefix, this.pathRoom);
        const res = await this.tryAll<Occupant[]>(
            path,
            { [ProsodyQueryKey.Room]: room, [ProsodyQueryKey.Domain]: this.mucDomain },
            d => parseOccupantsList(d),
            //  token,
        );

        return res ?? [];
    }

    /** Nombre total de sessions Prosody. */
    async getSessionsCountV2(): Promise<number> {
        const path = buildPath(this.apiPrefix, this.pathSessions);
        const res = await this.tryAll<number>(
            path,
            {},
            d => parseNumberLike(d) ?? 0,
        );
        if (res == null) {
            throw new NotFoundException('Prosody /sessions endpoint not available');
        }
        return res;
    }


    /** Essaie toutes les instances en parallèle; retourne la 1re réponse parsée. */
    private async tryAll<T>(
        path: string,
        query: Record<string, string>,
        parser: (data: unknown) => T,
        //token?: string,
    ): Promise<T | null> {
        if (!this.prosodyInstances.length) {
            throw new ServiceUnavailableException('No Prosody instances configured');
        }

        const urls = this.prosodyInstances.map(b =>
            makeUrl(b, path, query, { token: this.staticToken, tokenKey: ProsodyQueryKey.Token }),
        );

        const settled = await Promise.allSettled(
            urls.map(u => lastValueFrom(this.http.get(u, { timeout: DEFAULTS.HttpTimeoutMs }))),
        );

        for (let i = 0; i < settled.length; i++) {
            const r = settled[i];
            const u = urls[i];
            if (r.status === 'fulfilled') {
                try {
                    return parser(r.value.data);
                } catch (e: any) {
                    this.logger.warn(`Parse error for "${u}": ${e?.message ?? e}`);
                }
            } else {
                const status = r.reason?.response?.status;
                if (status === 404) {
                    this.logger.debug(`404 on "${u}" (endpoint absent), trying next`);
                } else {
                    this.logger.warn(`HTTP error for "${u}": ${r.reason?.message ?? r.reason}`);
                }
            }
        }
        return null;
    }

}
