export enum ReplayStatus {
    STARTED = 'started',
    UPLOADING_RSYNC = 'uploading-rsync',
    UPLOADED_RSYNC = 'uploaded-rsync',
    ERROR_UPLOADING_RSYNC = 'error-uploading-rsync',
    TERMINATED = 'terminated',
}