/**
 * ModuleKey enum and offer modules configuration
 * Defines the available modules and which ones are included in each offer
 */

export enum ModuleKey {
    // Core modules
    VISIO_JITSI = 'visio_jitsi',
    FEEDBACK = 'feedback',

    // Premium modules
    WEBINAR = 'webinar',
    REPLAY = 'replay',
    RECORDING = 'recording',
    WHITEBOARD = 'whiteboard',
    VOXIFY = 'voxify',
}

/**
 * Mapping of offer types to included modules
 */
export const OFFER_MODULES = {
    BASIQUE: [ModuleKey.VISIO_JITSI, ModuleKey.FEEDBACK],
    PREMIUM: [
        ModuleKey.VISIO_JITSI,
        ModuleKey.FEEDBACK,
        ModuleKey.WEBINAR,
        ModuleKey.REPLAY,
        ModuleKey.RECORDING,
        ModuleKey.WHITEBOARD,
        ModuleKey.VOXIFY,
    ],
};
