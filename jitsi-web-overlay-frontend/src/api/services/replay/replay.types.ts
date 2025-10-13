
export enum ReplayStatus {
    Started = 'started',
    Terminated = 'terminated',
    ErrorUploadingRsync = 'error-uploading-rsync',
}

export interface Replay {
    id: number | string;
    status: ReplayStatus | string;
    conference?: { uid?: string; name?: string };
}