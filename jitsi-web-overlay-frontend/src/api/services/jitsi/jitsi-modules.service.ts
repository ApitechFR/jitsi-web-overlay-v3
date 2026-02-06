
import { getHttp } from '@/api/http';
import { toApiError } from '@/api/errors';
import { JitsiModuleOptions } from './jitsi.types';


export const JitsiModulesService = {
    async fetch(): Promise<JitsiModuleOptions> {
        try {
            const http = await getHttp();
            const { data } = await http.get<JitsiModuleOptions>('/jitsi/modules');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des options Jitsi');
        }
    }
};
