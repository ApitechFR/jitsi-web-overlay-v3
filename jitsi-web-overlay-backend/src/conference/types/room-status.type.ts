import type { Occupant } from './occupant.type';

export type RoomStatus = {
    room: string;
    domain: string;
    participants: number; // hors focus
    occupants?: Occupant[];
    started: boolean;
};
