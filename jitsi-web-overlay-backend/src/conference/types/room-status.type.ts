import type { Occupant } from '../../prosody/types/occupant.type';

export type RoomStatus = {
    room: string;
    domain: string;
    participants: number; // hors focus
    occupants?: Occupant[];
    started: boolean;
};
