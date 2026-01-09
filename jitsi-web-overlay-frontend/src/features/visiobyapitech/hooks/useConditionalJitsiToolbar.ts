import { useCallback, useRef } from 'react';
import type { JitsiModuleOptions } from '@/api';

type JitsiApiLike = {
    getConfig?: () => any;
    executeCommand?: (cmd: string, payload: any) => void;
};

function safeArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function useConditionalJitsiToolbar() {
    const appliedSignatureRef = useRef<string>('');

    const apply = useCallback((api: JitsiApiLike | null, modules: JitsiModuleOptions) => {
        if (!api?.getConfig || !api?.executeCommand) return;

        const currentCfg = api.getConfig?.() ?? {};
        const baseToolbar = safeArray(currentCfg.toolbarButtons);

        // NOTE: we do not mix "voxify" and "invite" here: Voxify mainly controls the dial-in/out URLs.
        // If you want to force the appearance of the "invite" button, handle it independently.
        const toggles: Record<string, boolean> = {
            recording: !!modules.recording,
            closedcaptions: !!modules.transcription,
            whiteboard: !!modules.excalidraw,
            etherpad: !!modules.etherpad
        };

        const merged = new Set(baseToolbar);
        for (const [btn, enabled] of Object.entries(toggles)) {
            if (enabled) merged.add(btn);
            else merged.delete(btn);
        }

        const mergedArr = Array.from(merged);

        // sgnature to avoid re-applying the same configuration
        const signature = JSON.stringify({
            toolbar: mergedArr,
            etherpad: !!modules.etherpad,
            voxify: !!modules.voxify
        });

        if (appliedSignatureRef.current === signature) return;
        appliedSignatureRef.current = signature;

        // Prepare the new configuration
        const overwrite: Record<string, any> = { toolbarButtons: mergedArr };

        // Delete options related to disabled modules
        if (!modules.etherpad && 'etherpad_base' in currentCfg) {
            delete currentCfg.etherpad_base;
        }
        if (!modules.voxify) {
            if ('dialInNumbersUrl' in currentCfg) delete currentCfg.dialInNumbersUrl;
            if ('dialInConfCodeUrl' in currentCfg) delete currentCfg.dialInConfCodeUrl;
        }

        // Apply the new configuration
        api.executeCommand('overwriteConfig', { ...overwrite, ...currentCfg });
    }, []);

    return { apply };
}
