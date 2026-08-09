export interface MindmapWord {
    text: string;
    value: number;
}

function isMindmapWord(value: unknown): value is MindmapWord {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.text === 'string'
        && typeof candidate.value === 'number'
        && Number.isFinite(candidate.value);
}

export function parseMindmapWords(data: unknown, limit: number): MindmapWord[] {
    if (!Array.isArray(data)) return [];
    return data
        .filter(isMindmapWord)
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}
