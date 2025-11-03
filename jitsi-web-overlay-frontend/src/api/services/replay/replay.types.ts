
export enum ReplayStatus {
    Started = 'started',
    Terminated = 'terminated',
    ErrorUploadingRsync = 'error-uploading-rsync',
}

export interface Replay {
    id: number | string;
    uid: string;
    status: ReplayStatus | string;
    message: string;
    conference_name: string;
    created_at: string;
    updated_at: string;
}