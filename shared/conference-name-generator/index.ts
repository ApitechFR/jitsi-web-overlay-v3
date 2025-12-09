// Module commun pour la génération de noms de conférence
import roomData from './roomData.json';

function randomAlphanumString(length: number): string {
    return _randomString(length, roomData.ALPHANUM);
}
function _randomString(length: number, characters: string[]): string {
    let result = '';
    for (let i = 0; i < length; ++i) {
        result += randomElement(characters);
    }
    return result;
}
function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface ConferenceNameConfig {
    prefix?: string;
    size?: number;
}

export function generateConferenceName(config?: ConferenceNameConfig): string {
    const prefix = config?.prefix ?? 'alea_name';
    const totalSize = config?.size ?? 30;

    if (prefix === 'alea_name') {
        const place = randomElement(roomData.PLACE);
        const noun = randomElement(roomData.PLURALNOUN);
        const verb = randomElement(roomData.VERB);
        const alphanum = randomAlphanumString(randomInt(7, 10));
        return `${place}${noun}${verb}-${alphanum}`;
    }

    // Sinon : calculer la longueur restante
    const finalPrefix = prefix.trim();
    const remainingLength = Math.max(totalSize - finalPrefix.length, 7);
    const suffix = randomAlphanumString(remainingLength);
    return `${finalPrefix}${suffix}`;
}
