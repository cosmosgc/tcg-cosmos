import type { CardRarity } from './types';

export const FACTION_COLORS: Record<string, string> = {
    dawnspire: '#f0b429',
    voidmire: '#2dd4bf',
    starforge: '#38bdf8',
    neutral: '#94a3b8',
};

export const RARITY_COLORS: Record<CardRarity, string> = {
    common: '#64748b',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
};

export const KEYWORD_LABELS: Record<string, string> = {
    swift: 'Swift',
    bulwark: 'Bulwark',
    siphon: 'Siphon',
};
