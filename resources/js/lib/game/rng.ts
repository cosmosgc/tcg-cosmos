import type { RngState } from './types';

function mulberry32(seed: number): () => number {
    let a = seed;

    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;

        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Deterministic random integer in [0, maxExclusive) derived from the current
 * RNG state. Advances the counter so repeated calls produce fresh values.
 */
export function randomInt(rng: RngState, maxExclusive: number): number {
    if (maxExclusive <= 0) {
        return 0;
    }

    const next = mulberry32((rng.seed ^ rng.count++) >>> 0);

    return Math.floor(next() * maxExclusive);
}

export function shuffle<T>(items: readonly T[], rng: RngState): T[] {
    const arr = [...items];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = randomInt(rng, i + 1);
        const tmp = arr[i] as T;
        arr[i] = arr[j] as T;
        arr[j] = tmp;
    }

    return arr;
}
