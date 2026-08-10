import { shuffle } from './rng';
import type { CardDef, FactionId, RngState } from './types';

export const DECK_SIZE = 30;

export const COPY_LIMIT = 3;

export const TOKEN_CARDS: CardDef[] = [
    {
        id: 'token-sun-spark',
        set: 'celestial-genesis',
        faction: 'dawnspire',
        name: 'Sun Spark',
        type: 'unit',
        rarity: 'common',
        cost: 0,
        power: 1,
        health: 1,
        keywords: [],
        text: 'A mote of living light.',
        effects: [],
        finish: 'standard',
        frameVariant: 'dawnspire-common',
        artUrl: null,
    },
    {
        id: 'token-warp-entity',
        set: 'celestial-genesis',
        faction: 'neutral',
        name: 'Warp Entity',
        type: 'unit',
        rarity: 'uncommon',
        cost: 0,
        power: 3,
        health: 3,
        keywords: [],
        text: 'It unfolds from a fold in space.',
        effects: [],
        finish: 'standard',
        frameVariant: 'neutral-common',
        artUrl: null,
    },
];

/**
 * Merge base cards and token cards into a lookup keyed by card id.
 */
export function buildLibrary(
    cards: readonly CardDef[],
    extra: readonly CardDef[] = TOKEN_CARDS,
): Record<string, CardDef> {
    const library: Record<string, CardDef> = {};

    for (const card of [...cards, ...extra]) {
        library[card.id] = card;
    }

    return library;
}

export interface StarterDeck {
    leaderId: string;
    cards: string[];
}

const TYPE_PRIORITY: Record<CardDef['type'], number> = {
    unit: 0,
    equipment: 1,
    action: 2,
    leader: 3,
};

/**
 * Build a legal 30-card starter deck for a faction: the faction leader plus
 * three copies of cards chosen to give the faction a smooth energy curve.
 */
export function buildStarterDeck(
    library: Record<string, CardDef>,
    faction: FactionId,
    rng: RngState,
): StarterDeck {
    const all = Object.values(library);
    const leader = all.find(
        (card) => card.type === 'leader' && card.faction === faction,
    );

    if (!leader) {
        throw new Error(`No leader defined for faction "${faction}".`);
    }

    const ordered = all
        .filter(
            (card) =>
                card.type !== 'leader' &&
                (card.faction === faction || card.faction === 'neutral'),
        )
        .sort(
            (a, b) =>
                a.cost - b.cost ||
                TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] ||
                a.id.localeCompare(b.id),
        );

    const pool: CardDef[] = [];

    for (const card of ordered) {
        for (let i = 0; i < COPY_LIMIT; i++) {
            pool.push(card);
        }
    }

    return {
        leaderId: leader.id,
        cards: shuffle(
            pool.slice(0, DECK_SIZE).map((card) => card.id),
            rng,
        ),
    };
}
