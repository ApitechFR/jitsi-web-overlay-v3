export interface Props {
    domain: string;
    conferenceName: string;
    jwt?: string;
    displayName?: string;
    user?: any;
}

export interface JitsiModuleOptions {
    etherpad: boolean;
    transcription: boolean;
    recording: boolean;
    excalidraw: boolean;
    voxify: boolean;
}