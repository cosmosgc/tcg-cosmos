import { describe, expect, it } from 'vitest';
import {
    canAttackUnit,
    canPlayCard,
    createGame,
    dispatch,
    GameError,
    getAttackTargets,
} from './engine';
import { buildStarterDeck, buildLibrary, TOKEN_CARDS } from './library';
import type { CardDef, Game } from './types';

function card(
    def: Partial<CardDef> & Pick<CardDef, 'id' | 'name' | 'type' | 'cost'>,
): CardDef {
    return {
        set: 'test',
        faction: 'neutral',
        rarity: 'common',
        power: null,
        health: null,
        keywords: [],
        text: null,
        effects: [],
        finish: 'standard',
        frameVariant: 'neutral-common',
        artUrl: null,
        ...def,
    };
}

function makeLibrary(): Record<string, CardDef> {
    const dawnLeader = card({
        id: 'ldr',
        name: 'Sunwarden Adara',
        type: 'leader',
        faction: 'dawnspire',
        rarity: 'legendary',
        cost: 0,
        health: 30,
    });

    return buildLibrary([
        dawnLeader,
        card({
            id: 'sol',
            name: 'Soldier',
            type: 'unit',
            faction: 'dawnspire',
            cost: 2,
            power: 3,
            health: 2,
        }),
        card({
            id: 'swi',
            name: 'Swift',
            type: 'unit',
            faction: 'dawnspire',
            cost: 1,
            power: 1,
            health: 1,
            keywords: ['swift'],
        }),
        card({
            id: 'blw',
            name: 'Wall',
            type: 'unit',
            faction: 'dawnspire',
            cost: 3,
            power: 1,
            health: 4,
            keywords: ['bulwark'],
        }),
        card({
            id: 'sip',
            name: 'Leech',
            type: 'unit',
            faction: 'dawnspire',
            cost: 3,
            power: 2,
            health: 3,
            keywords: ['siphon'],
        }),
        card({
            id: 'blz',
            name: 'Blaze',
            type: 'action',
            faction: 'dawnspire',
            cost: 1,
            effects: [
                {
                    trigger: 'on_play',
                    actions: [
                        {
                            kind: 'damage',
                            amount: 2,
                            target: {
                                kind: 'target_unit',
                                scope: 'enemy_unit',
                            },
                        },
                    ],
                },
            ],
        }),
        card({
            id: 'edg',
            name: 'Edge',
            type: 'equipment',
            faction: 'dawnspire',
            cost: 2,
            power: 2,
            health: 1,
        }),
        card({
            id: 'coh',
            name: 'Cohort',
            type: 'unit',
            faction: 'dawnspire',
            cost: 3,
            power: 3,
            health: 3,
            effects: [
                {
                    trigger: 'on_play',
                    actions: [
                        { kind: 'summon', defId: 'token-sun-spark', count: 1 },
                    ],
                },
            ],
        }),
        card({
            id: 'neu1',
            name: 'Moth',
            type: 'unit',
            cost: 1,
            power: 1,
            health: 2,
        }),
        card({
            id: 'neu2',
            name: 'Droid',
            type: 'unit',
            cost: 2,
            power: 2,
            health: 2,
        }),
        card({
            id: 'neu3',
            name: 'Runner',
            type: 'unit',
            cost: 3,
            power: 2,
            health: 3,
        }),
    ]);
}

function setup(seed = 7): Game {
    return createGame(makeLibrary(), {
        playerOne: { name: 'P1', faction: 'dawnspire' },
        playerTwo: { name: 'P2', faction: 'dawnspire' },
        seed,
    });
}

function setHand(game: Game, player: 0 | 1, ids: string[]): void {
    game.state.players[player].hand = ids;
}

function setEnergy(game: Game, player: 0 | 1, energy: number): void {
    game.state.players[player].energy = energy;
}

function placeUnit(
    game: Game,
    player: 0 | 1,
    defId: string,
    opts?: { power?: number; health?: number },
): string {
    const def = game.library[defId];

    if (!def) {
        throw new Error(`Unknown defId ${defId}`);
    }

    const unit = {
        uid: `test-${defId}-${player}-${game.state.uidCounter++}`,
        defId,
        name: def.name,
        owner: player,
        basePower: opts?.power ?? def.power ?? 0,
        tempPower: 0,
        baseMaxHealth: opts?.health ?? def.health ?? 1,
        tempMaxHealth: 0,
        health: opts?.health ?? def.health ?? 1,
        keywords: [...def.keywords],
        summonedThisTurn: false,
        exhausted: false,
        equipment: [],
    };

    game.state.players[player].board.push(unit);

    return unit.uid;
}

describe('createGame', () => {
    it('builds full 30-card decks and 4-card starting hands', () => {
        const game = setup();
        expect(
            game.state.players[0].deck.length +
                game.state.players[0].hand.length,
        ).toBe(30);
        expect(game.state.players[0].hand).toHaveLength(4);
        expect(game.state.players[0].maxEnergy).toBe(1);
        expect(game.state.players[0].leader.health).toBe(30);
        expect(game.state.currentPlayer).toBe(0);
        expect(game.state.turnNumber).toBe(1);
    });

    it('produces identical matches for the same seed', () => {
        const a = setup(42);
        const b = setup(42);
        expect(a.state.players[0].hand).toEqual(b.state.players[0].hand);
        expect(a.state.players[1].deck).toEqual(b.state.players[1].deck);
    });

    it('builds legal starter decks with a leader and three-copy limit', () => {
        const lib = makeLibrary();
        const deck = buildStarterDeck(lib, 'dawnspire', { seed: 1, count: 0 });
        expect(deck.cards).toHaveLength(30);
        expect(deck.leaderId).toBe('ldr');
        expect(deck.cards).not.toContain('ldr');
        const counts = new Map<string, number>();

        for (const id of deck.cards) {
            counts.set(id, (counts.get(id) ?? 0) + 1);
        }

        for (const count of counts.values()) {
            expect(count).toBeLessThanOrEqual(3);
        }
    });
});

describe('playCard', () => {
    it('plays a unit onto the board for its cost', () => {
        const game = setup();
        setHand(game, 0, ['sol']);
        setEnergy(game, 0, 5);
        const next = dispatch(game, {
            type: 'play_card',
            player: 0,
            handIndex: 0,
        });
        expect(next.state.players[0].board).toHaveLength(1);
        expect(next.state.players[0].board[0]?.defId).toBe('sol');
        expect(next.state.players[0].energy).toBe(3);
        expect(next.state.players[0].hand).toHaveLength(0);
    });

    it('applies summoning sickness to non-swift units', () => {
        const game = setup();
        setHand(game, 0, ['sol']);
        setEnergy(game, 0, 5);
        const next = dispatch(game, {
            type: 'play_card',
            player: 0,
            handIndex: 0,
        });
        const unit = next.state.players[0].board[0];
        expect(unit?.exhausted).toBe(true);
        expect(unit?.summonedThisTurn).toBe(true);
    });

    it('lets swift units attack on the turn they are played', () => {
        const game = setup();
        setHand(game, 0, ['swi']);
        setEnergy(game, 0, 5);
        const next = dispatch(game, {
            type: 'play_card',
            player: 0,
            handIndex: 0,
        });
        const unit = next.state.players[0].board[0];
        expect(unit?.exhausted).toBe(false);
        expect(unit?.summonedThisTurn).toBe(true);
    });

    it('rejects a card when energy is insufficient', () => {
        const game = setup();
        setHand(game, 0, ['sol']);
        setEnergy(game, 0, 1);
        expect(() =>
            dispatch(game, { type: 'play_card', player: 0, handIndex: 0 }),
        ).toThrow(GameError);
    });

    it('casts an action, applies its effect and discards it', () => {
        const game = setup();
        setHand(game, 0, ['blz']);
        setEnergy(game, 0, 5);
        const enemyUid = placeUnit(game, 1, 'neu2');
        const next = dispatch(game, {
            type: 'play_card',
            player: 0,
            handIndex: 0,
            targetUnit: enemyUid,
        });
        expect(next.state.players[1].board).toHaveLength(0);
        expect(next.state.players[0].discard).toContain('blz');
    });

    it('attaches equipment and boosts the unit', () => {
        const game = setup();
        const friendUid = placeUnit(game, 0, 'sol');
        setHand(game, 0, ['edg']);
        setEnergy(game, 0, 5);
        const next = dispatch(game, {
            type: 'play_card',
            player: 0,
            handIndex: 0,
            targetUnit: friendUid,
        });
        const unit = next.state.players[0].board[0];
        expect(unit?.basePower).toBe(5);
        expect(unit?.baseMaxHealth).toBe(3);
        expect(unit?.health).toBe(3);
    });

    it('resolves summon effects into tokens', () => {
        const game = setup();
        setHand(game, 0, ['coh']);
        setEnergy(game, 0, 5);
        const next = dispatch(game, {
            type: 'play_card',
            player: 0,
            handIndex: 0,
        });
        expect(next.state.players[0].board).toHaveLength(2);
        expect(
            next.state.players[0].board.some(
                (unit) => unit.defId === 'token-sun-spark',
            ),
        ).toBe(true);
    });

    it('blocks a player from acting on the opponent turn', () => {
        const game = setup();
        setHand(game, 1, ['sol']);
        setEnergy(game, 1, 5);
        expect(() =>
            dispatch(game, { type: 'play_card', player: 1, handIndex: 0 }),
        ).toThrow(GameError);
    });
});

describe('attack', () => {
    it('deals damage both ways and destroys the defender', () => {
        const game = setup();
        const attackerUid = placeUnit(game, 0, 'sol');
        const defenderUid = placeUnit(game, 1, 'neu1');
        const next = dispatch(game, {
            type: 'attack',
            player: 0,
            attackerUid,
            target: { kind: 'unit', uid: defenderUid },
        });
        expect(next.state.players[1].board).toHaveLength(0);
        expect(next.state.players[1].discard).toContain('neu1');
        const attacker = next.state.players[0].board[0];
        expect(attacker?.health).toBe(1);
        expect(attacker?.exhausted).toBe(true);
    });

    it('damages the enemy leader directly', () => {
        const game = setup();
        const attackerUid = placeUnit(game, 0, 'sol');
        const next = dispatch(game, {
            type: 'attack',
            player: 0,
            attackerUid,
            target: { kind: 'leader' },
        });
        expect(next.state.players[1].leader.health).toBe(27);
    });

    it('forces attacks onto bulwark units', () => {
        const game = setup();
        const attackerUid = placeUnit(game, 0, 'sol');
        placeUnit(game, 1, 'blw');
        expect(() =>
            dispatch(game, {
                type: 'attack',
                player: 0,
                attackerUid,
                target: { kind: 'leader' },
            }),
        ).toThrow(GameError);
        const wallUid = game.state.players[1].board[0]?.uid;
        expect(() =>
            dispatch(game, {
                type: 'attack',
                player: 0,
                attackerUid,
                target: { kind: 'unit', uid: wallUid },
            }),
        ).not.toThrow();
    });

    it('heals the owner leader via siphon', () => {
        const game = setup();
        game.state.players[0].leader.health = 20;
        const attackerUid = placeUnit(game, 0, 'sip');
        const next = dispatch(game, {
            type: 'attack',
            player: 0,
            attackerUid,
            target: { kind: 'leader' },
        });
        expect(next.state.players[0].leader.health).toBe(22);
        expect(next.state.players[1].leader.health).toBe(28);
    });

    it('ends the match when the enemy leader reaches zero', () => {
        const game = setup();
        game.state.players[1].leader.health = 2;
        const attackerUid = placeUnit(game, 0, 'sol');
        const next = dispatch(game, {
            type: 'attack',
            player: 0,
            attackerUid,
            target: { kind: 'leader' },
        });
        expect(next.state.winner).toBe(0);
        expect(next.state.phase).toBe('gameover');
    });
});

describe('endTurn', () => {
    it('switches players, grows energy and draws a card', () => {
        const game = setup();
        const next = dispatch(game, { type: 'end_turn', player: 0 });
        expect(next.state.currentPlayer).toBe(1);
        expect(next.state.players[1].maxEnergy).toBe(2);
        expect(next.state.players[1].energy).toBe(2);
        expect(next.state.players[1].hand).toHaveLength(5);
        expect(next.state.turnNumber).toBe(1);
    });

    it('readies units and clears temporary buffs', () => {
        const game = setup();
        placeUnit(game, 0, 'sol');
        const unit = game.state.players[0].board[0];

        if (!unit) {
            throw new Error('missing unit');
        }

        unit.exhausted = true;
        unit.summonedThisTurn = true;
        unit.tempPower = 2;
        unit.tempMaxHealth = 1;
        unit.health = 4;
        const next = dispatch(game, { type: 'end_turn', player: 0 });
        const reset = next.state.players[0].board[0];

        if (!reset) {
            throw new Error('missing unit');
        }

        expect(reset.exhausted).toBe(false);
        expect(reset.summonedThisTurn).toBe(false);
        expect(reset.tempPower).toBe(0);
        expect(reset.health).toBe(2);
    });

    it('applies fatigue damage when the deck is empty', () => {
        const game = setup();
        game.state.players[1].deck = [];
        const next = dispatch(game, { type: 'end_turn', player: 0 });
        expect(next.state.players[1].leader.health).toBe(28);
        expect(next.state.players[1].fatigue).toBe(1);
    });
});

describe('validation helpers', () => {
    it('reports why a card cannot be played', () => {
        const game = setup();
        setHand(game, 0, ['sol']);
        setEnergy(game, 0, 1);
        expect(canPlayCard(game, 0, 0)).toContain('energy');
        setEnergy(game, 0, 5);
        expect(canPlayCard(game, 0, 0)).toBeNull();
    });

    it('exposes valid attack targets including bulwark restrictions', () => {
        const game = setup();
        const attackerUid = placeUnit(game, 0, 'sol');
        expect(canAttackUnit(game, 0, attackerUid)).toBeNull();
        expect(getAttackTargets(game, 0).leaderAllowed).toBe(true);
        placeUnit(game, 1, 'blw');
        const targets = getAttackTargets(game, 0);
        expect(targets.leaderAllowed).toBe(false);
        expect(targets.unitUids).toHaveLength(1);
    });
});

describe('library', () => {
    it('merges token cards into the library', () => {
        const lib = makeLibrary();
        expect(lib['token-sun-spark']).toBeDefined();
        expect(lib['token-warp-entity']).toBeDefined();
        expect(TOKEN_CARDS.length).toBe(2);
    });
});
