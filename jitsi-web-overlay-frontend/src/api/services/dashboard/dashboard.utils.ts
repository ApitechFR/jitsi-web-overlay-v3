import type { CardData } from '@/api/services/dashboard/dashboard.types';

/**
 * Data mapping for historic statistics to card format.
 */
export function mapHistoricStatsToCards(prev: CardData[], dataHistoricConf: any): CardData[] {
    const mapping: Record<string, any> = {
        users: dataHistoricConf.users || 0,
        confNb: dataHistoricConf.confNb || 0,
        confTime: dataHistoricConf.confMoyTime || "00:00:00",
        confMoyPart: dataHistoricConf.confMoyPart || 0,
        confMaxSimult: dataHistoricConf.maxSimult || 0,
        partMaxSimult: dataHistoricConf.partMaxSimult || 0,
    };
    return prev.map((item) =>
        mapping.hasOwnProperty(item.key)
            ? { ...item, valeur: mapping[item.key as string] }
            : item
    );
}

/**
 * Data mapping for real-time statistics to card format.
 */
export function mapRealtimeStatsToCards(prev: CardData[], dataRealTime: any): CardData[] {
    const totalParticipants = dataRealTime.part || 0;
    const totalConferences = dataRealTime.conf || 0;
    const MoyParticipantsPerConf = totalConferences > 0
        ? Math.round(totalParticipants / totalConferences)
        : 0;
    const mapping: Record<string, any> = {
        totalParticipants,
        totalConferences,
        MoyParticipantsPerConf,
    };
    return prev.map((item) =>
        mapping.hasOwnProperty(item.key)
            ? { ...item, valeur: mapping[item.key as string] }
            : item
    );
}
