import * as fs from 'fs';

export function safeStatFile( filePath?: string ): { isFile: boolean; stat?: fs.Stats; error?: unknown } {
    if (!filePath) {
        return { isFile: false };
    }

    try {
        const stat = fs.statSync(filePath);
        return {
            isFile: stat.isFile(),
            stat,
        };
    } catch (error) {
        return {
            isFile: false,
            error,
        };
    }
}
