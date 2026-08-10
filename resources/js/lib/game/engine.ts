import { buildStarterDeck } from './library';
import { randomInt, shuffle } from './rng';
import type {
    AttackAction,
    AttackTargets,
    CardDef,
    DevAction,
    EffectAction,
    EffectTargetScope,
    EndTurnAction,
    Game,
    GameState,
    PlayerIndex,
    PlayerState,
    PlayCardAction,
    RngState,
    Unit,
} from './types';

export const DECK_SIZE = 30;
export const HAND_SIZE = 4;
export const BOARD_LIMIT = 6;
export const MAX_ENERGY = 10;
export const LEADER_MAX_HEALTH = 30;
export const FATIGUE_DAMAGE = 2;

export class GameError extends Error {}

export interface GameOptions {
    playerOne: { name: string; faction: PlayerState['faction'] };
    playerTwo: { name: string; faction: PlayerState['faction'] };
    seed?: number;
}

export function createGame(
    library: Record<string, CardDef>,
    options: GameOptions,
): Game {
    const rng: RngState = { seed: options.seed ?? Date.now() >>> 0, count: 0 };
    const one = buildStarterDeck(library, options.playerOne.faction, rng);
    const two = buildStarterDeck(library, options.playerTwo.faction, rng);

    const players: [PlayerState, PlayerState] = [
        makePlayer(0, options.playerOne, one, rng),
        makePlayer(1, options.playerTwo, two, rng),
    ];

    const state: GameState = {
        players,
        currentPlayer: 0,
        turnNumber: 1,
        winner: null,
        phase: 'playing',
        log: [
            {
                player: 0,
                message: `Turn 1: ${players[0].name} (${players[0].faction}) goes first.`,
            },
        ],
        rng,
        uidCounter: 0,
    };

    return { state, library };
}

function makePlayer(
    index: PlayerIndex,
    options: GameOptions['playerOne'],
    deck: { leaderId: string; cards: string[] },
    rng: RngState,
): PlayerState {
    const player: PlayerState = {
        index,
        name: options.name,
        faction: options.faction,
        leader: {
            defId: deck.leaderId,
            name: deck.leaderId,
            health: LEADER_MAX_HEALTH,
            maxHealth: LEADER_MAX_HEALTH,
        },
        deck: shuffle(deck.cards, rng),
        hand: [],
        board: [],
        discard: [],
        maxEnergy: 1,
        energy: 1,
        fatigue: 0,
    };

    drawCardsTo(player, HAND_SIZE);

    return player;
}

function drawCardsTo(player: PlayerState, count: number): void {
    for (let i = 0; i < count; i++) {
        drawOne(player);
    }
}

function drawOne(player: PlayerState): boolean {
    const top = player.deck.pop();

    if (top === undefined) {
        player.fatigue += 1;
        player.leader.health = Math.max(
            0,
            player.leader.health - FATIGUE_DAMAGE,
        );

        return false;
    }

    player.hand.push(top);

    return true;
}

function drawCards(
    state: GameState,
    playerIndex: PlayerIndex,
    count: number,
): void {
    const player = state.players[playerIndex];

    for (let i = 0; i < count; i++) {
        drawOne(player);
    }

    if (player.fatigue > 0) {
        log(
            state,
            playerIndex,
            `${player.name} takes ${FATIGUE_DAMAGE} fatigue damage from an empty deck.`,
        );
    }
}

function cloneUnit(unit: Unit): Unit {
    return {
        ...unit,
        keywords: [...unit.keywords],
        equipment: unit.equipment.map((item) => ({
            ...item,
            keywords: [...item.keywords],
        })),
    };
}

function clonePlayer(player: PlayerState): PlayerState {
    return {
        ...player,
        deck: [...player.deck],
        hand: [...player.hand],
        discard: [...player.discard],
        board: player.board.map(cloneUnit),
        leader: { ...player.leader },
    };
}

function cloneState(state: GameState): GameState {
    return {
        ...state,
        players: [clonePlayer(state.players[0]), clonePlayer(state.players[1])],
        log: [...state.log],
        rng: { ...state.rng },
    };
}

function log(state: GameState, player: PlayerIndex, message: string): void {
    state.log.push({ player, message });
}

export function dispatch(
    game: Game,
    action: PlayCardAction | AttackAction | EndTurnAction | DevAction,
): Game {
    const next = { ...game, state: cloneState(game.state) };

    switch (action.type) {
        case 'play_card':
            return playCard(next, action);
        case 'attack':
            return attack(next, action);
        case 'end_turn':
            return endTurn(next, action);
        case 'dev_draw':
            drawCards(next.state, action.player, action.count);
            log(
                next.state,
                action.player,
                `${next.state.players[action.player].name} draws ${action.count} (dev).`,
            );

            return next;
        case 'dev_energy':
            next.state.players[action.player].energy = Math.min(
                MAX_ENERGY,
                next.state.players[action.player].energy + action.count,
            );

            return next;
    }
}

function ensureActive(state: GameState, player: PlayerIndex): void {
    if (state.winner !== null || state.phase === 'gameover') {
        throw new GameError('The match is over.');
    }

    if (state.currentPlayer !== player) {
        throw new GameError("It is not that player's turn.");
    }
}

function unitPower(unit: Unit): number {
    return unit.basePower + unit.tempPower;
}

function unitMaxHealth(unit: Unit): number {
    return unit.baseMaxHealth + unit.tempMaxHealth;
}

function newUid(state: GameState): string {
    state.uidCounter += 1;

    return `u${state.uidCounter}`;
}

function cardTargetScope(card: CardDef): EffectTargetScope | null {
    for (const effect of card.effects) {
        for (const action of effect.actions) {
            if (action.target?.kind === 'target_unit') {
                return action.target.scope;
            }
        }
    }

    return null;
}

export function cardNeedsTarget(card: CardDef): boolean {
    return card.type === 'equipment' || cardTargetScope(card) !== null;
}

export function getCardTargetScope(card: CardDef): EffectTargetScope | null {
    return cardTargetScope(card);
}

function playCard(game: Game, action: PlayCardAction): Game {
    const state = game.state;
    ensureActive(state, action.player);

    const player = state.players[action.player];
    const defId = player.hand[action.handIndex];

    if (defId === undefined) {
        throw new GameError('No card at that hand position.');
    }

    const card = game.library[defId];

    if (!card) {
        throw new GameError(`Unknown card "${defId}".`);
    }

    if (card.type === 'leader') {
        throw new GameError('Leaders are never played from the hand.');
    }

    const scope =
        card.type === 'equipment' ? 'friendly_unit' : cardTargetScope(card);
    let targetUnit: Unit | null = null;

    if (scope !== null) {
        if (action.targetUnit === undefined) {
            throw new GameError('This card needs a target.');
        }

        targetUnit = resolveTarget(
            state,
            action.player,
            action.targetUnit,
            scope,
        );
    }

    if (card.type === 'unit' && player.board.length >= BOARD_LIMIT) {
        throw new GameError('Your board is full.');
    }

    if (
        card.type === 'equipment' &&
        (targetUnit === null || targetUnit.owner !== action.player)
    ) {
        throw new GameError('Equipment must attach to one of your units.');
    }

    if (card.cost > player.energy) {
        throw new GameError(`Not enough energy (needs ${card.cost}).`);
    }

    player.energy -= card.cost;
    player.hand.splice(action.handIndex, 1);

    if (card.type === 'unit') {
        const unit = summonUnit(game, state, action.player, card.id);
        log(state, action.player, `${player.name} plays ${card.name}.`);
        resolveEffects(game, state, action.player, card, unit);
    } else if (card.type === 'action') {
        player.discard.push(card.id);
        log(state, action.player, `${player.name} casts ${card.name}.`);
        resolveEffects(game, state, action.player, card, targetUnit);
    } else if (card.type === 'equipment') {
        attachEquipment(targetUnit as Unit, card);
        player.discard.push(card.id);
        log(
            state,
            action.player,
            `${player.name} equips ${card.name} on ${(targetUnit as Unit).name}.`,
        );
    }

    cleanup(state);

    return game;
}

function resolveTarget(
    state: GameState,
    playerIndex: PlayerIndex,
    uid: string,
    scope: EffectTargetScope,
): Unit {
    const player = state.players[playerIndex];
    const enemy = state.players[1 - playerIndex];
    const target =
        player.board.find((unit) => unit.uid === uid) ??
        enemy.board.find((unit) => unit.uid === uid);

    if (!target) {
        throw new GameError('No such unit.');
    }

    if (scope === 'enemy_unit' && target.owner !== enemy.index) {
        throw new GameError('Choose an enemy unit.');
    }

    if (scope === 'friendly_unit' && target.owner !== player.index) {
        throw new GameError('Choose one of your units.');
    }

    return target;
}

function summonUnit(
    game: Game,
    state: GameState,
    playerIndex: PlayerIndex,
    defId: string,
): Unit {
    const def = game.library[defId];

    if (!def) {
        throw new GameError(`Unknown card "${defId}".`);
    }

    const unit: Unit = {
        uid: newUid(state),
        defId,
        name: def.name,
        owner: playerIndex,
        basePower: def.power ?? 0,
        tempPower: 0,
        baseMaxHealth: def.health ?? 1,
        tempMaxHealth: 0,
        health: def.health ?? 1,
        keywords: [...def.keywords],
        summonedThisTurn: true,
        exhausted: !def.keywords.includes('swift'),
        equipment: [],
    };

    state.players[playerIndex].board.push(unit);

    return unit;
}

function attachEquipment(unit: Unit, def: CardDef): void {
    const power = def.power ?? 0;
    const health = def.health ?? 0;

    unit.basePower += power;
    unit.baseMaxHealth += health;
    unit.health += health;

    for (const keyword of def.keywords) {
        if (!unit.keywords.includes(keyword)) {
            unit.keywords.push(keyword);
        }
    }

    unit.equipment.push({
        defId: def.id,
        name: def.name,
        power,
        health,
        keywords: [...def.keywords],
    });
}

function destroyUnit(state: GameState, unit: Unit): void {
    const owner = state.players[unit.owner];
    owner.board = owner.board.filter((candidate) => candidate.uid !== unit.uid);
    owner.discard.push(unit.defId);

    for (const item of unit.equipment) {
        owner.discard.push(item.defId);
    }
}

function resolveEffects(
    game: Game,
    state: GameState,
    playerIndex: PlayerIndex,
    card: CardDef,
    targetUnit: Unit | null,
): void {
    const player = state.players[playerIndex];
    const enemy = state.players[1 - playerIndex];

    for (const effect of card.effects) {
        if (effect.trigger !== 'on_play') {
            continue;
        }

        for (const action of effect.actions) {
            applyEffect(game, state, player, enemy, action, targetUnit);
        }
    }
}

function applyEffect(
    game: Game,
    state: GameState,
    player: PlayerState,
    enemy: PlayerState,
    action: EffectAction,
    targetUnit: Unit | null,
): void {
    const target = action.target;

    switch (action.kind) {
        case 'damage': {
            const amount = action.amount ?? 0;

            if (target?.kind === 'enemy_leader') {
                enemy.leader.health = Math.max(0, enemy.leader.health - amount);
            } else if (target?.kind === 'friendly_leader') {
                player.leader.health = Math.max(
                    0,
                    player.leader.health - amount,
                );
            } else if (target?.kind === 'all_enemy_units') {
                for (const unit of enemy.board) {
                    unit.health -= amount;
                }
            } else if (target?.kind === 'target_unit') {
                (targetUnit as Unit).health -= amount;
            }

            break;
        }
        case 'heal': {
            const amount = action.amount ?? 0;

            if (target?.kind === 'friendly_leader') {
                player.leader.health = Math.min(
                    player.leader.maxHealth,
                    player.leader.health + amount,
                );
            } else if (target?.kind === 'target_unit') {
                (targetUnit as Unit).health = Math.min(
                    unitMaxHealth(targetUnit as Unit),
                    (targetUnit as Unit).health + amount,
                );
            }

            break;
        }
        case 'buff': {
            const power = action.power ?? 0;
            const health = action.health ?? 0;
            const units: Unit[] = [];

            if (target?.kind === 'target_unit') {
                units.push(targetUnit as Unit);
            } else if (target?.kind === 'all_friendly_units') {
                units.push(...player.board);
            }

            for (const unit of units) {
                if (action.turns === 'this_turn') {
                    unit.tempPower += power;
                    unit.tempMaxHealth += health;
                    unit.health += health;
                } else {
                    unit.basePower += power;
                    unit.baseMaxHealth += health;
                    unit.health += health;
                }
            }

            break;
        }
        case 'draw':
            drawCards(state, player.index, action.count ?? 0);
            break;
        case 'summon': {
            if (action.defId === undefined) {
                break;
            }

            for (let i = 0; i < (action.count ?? 1); i++) {
                if (player.board.length >= BOARD_LIMIT) {
                    break;
                }

                summonUnit(game, state, player.index, action.defId);
            }

            break;
        }
        case 'gain_energy':
            player.energy = Math.min(
                MAX_ENERGY,
                player.energy + (action.count ?? 0),
            );
            break;
        case 'gain_max_energy':
            player.maxEnergy = Math.min(
                MAX_ENERGY,
                player.maxEnergy + (action.count ?? 0),
            );
            player.energy = player.maxEnergy;
            break;
        case 'destroy_unit': {
            if (target?.kind !== 'target_unit') {
                break;
            }

            const unit = targetUnit as Unit;

            if (
                action.maxPower === undefined ||
                unitPower(unit) <= action.maxPower
            ) {
                destroyUnit(state, unit);
            }

            break;
        }
        case 'return_to_hand': {
            if (target?.kind !== 'target_unit') {
                break;
            }

            const unit = targetUnit as Unit;
            const owner = state.players[unit.owner];
            owner.board = owner.board.filter(
                (candidate) => candidate.uid !== unit.uid,
            );
            owner.hand.push(unit.defId);
            break;
        }
    }
}

function attack(game: Game, action: AttackAction): Game {
    const state = game.state;
    ensureActive(state, action.player);

    const player = state.players[action.player];
    const enemy = state.players[1 - action.player];
    const attacker = player.board.find(
        (unit) => unit.uid === action.attackerUid,
    );

    if (!attacker) {
        throw new GameError('No such unit.');
    }

    if (attacker.exhausted) {
        throw new GameError('That unit has already acted this turn.');
    }

    if (attacker.summonedThisTurn && !attacker.keywords.includes('swift')) {
        throw new GameError(
            'That unit cannot attack on the turn it was played.',
        );
    }

    const target = action.target;

    const bulwarks = enemy.board.filter((unit) =>
        unit.keywords.includes('bulwark'),
    );

    if (bulwarks.length > 0) {
        if (target.kind !== 'unit') {
            throw new GameError('An enemy Bulwark unit blocks your attack.');
        }

        const defender = enemy.board.find((unit) => unit.uid === target.uid);

        if (!defender || !defender.keywords.includes('bulwark')) {
            throw new GameError('You must attack a Bulwark unit.');
        }
    }

    const power = unitPower(attacker);
    let damageDealt = 0;

    if (target.kind === 'leader') {
        damageDealt = Math.min(enemy.leader.health, power);
        enemy.leader.health = Math.max(0, enemy.leader.health - power);
        log(
            state,
            action.player,
            `${player.name}'s ${attacker.name} strikes the enemy leader for ${power}.`,
        );
    } else {
        const defender = enemy.board.find((unit) => unit.uid === target.uid);

        if (!defender) {
            throw new GameError('No such target.');
        }

        damageDealt = Math.min(defender.health, power);
        defender.health -= power;
        attacker.health -= unitPower(defender);
        log(
            state,
            action.player,
            `${player.name}'s ${attacker.name} attacks ${enemy.name}'s ${defender.name} for ${power}.`,
        );
    }

    attacker.exhausted = true;

    if (attacker.keywords.includes('siphon') && damageDealt > 0) {
        player.leader.health = Math.min(
            player.leader.maxHealth,
            player.leader.health + damageDealt,
        );
    }

    cleanup(state);

    return game;
}

function endTurn(game: Game, action: EndTurnAction): Game {
    const state = game.state;
    ensureActive(state, action.player);

    const player = state.players[action.player];

    for (const unit of player.board) {
        unit.tempPower = 0;
        unit.tempMaxHealth = 0;
        unit.health = Math.min(unit.baseMaxHealth, unit.health);
        unit.exhausted = false;
        unit.summonedThisTurn = false;
    }

    state.currentPlayer = (1 - action.player) as PlayerIndex;

    if (state.currentPlayer === 0) {
        state.turnNumber += 1;
    }

    const next = state.players[state.currentPlayer];
    next.maxEnergy = Math.min(MAX_ENERGY, next.maxEnergy + 1);
    next.energy = next.maxEnergy;
    drawCards(state, state.currentPlayer, 1);
    log(
        state,
        state.currentPlayer,
        `Turn ${state.turnNumber}: ${next.name}'s turn.`,
    );

    cleanup(state);

    return game;
}

function cleanup(state: GameState): void {
    for (const player of state.players) {
        const survivors: Unit[] = [];

        for (const unit of player.board) {
            if (unit.health <= 0) {
                player.discard.push(unit.defId);

                for (const item of unit.equipment) {
                    player.discard.push(item.defId);
                }

                log(state, player.index, `${unit.name} is destroyed.`);
            } else {
                survivors.push(unit);
            }
        }

        player.board = survivors;
    }

    checkWinner(state);
}

function checkWinner(state: GameState): void {
    if (state.winner !== null) {
        return;
    }

    for (const player of state.players) {
        if (player.leader.health <= 0) {
            const winner = (1 - player.index) as PlayerIndex;
            state.winner = winner;
            state.phase = 'gameover';
            log(
                state,
                winner,
                `${player.name}'s leader has fallen. ${state.players[winner].name} wins!`,
            );

            return;
        }
    }
}

export function canPlayCard(
    game: Game,
    player: PlayerIndex,
    handIndex: number,
): string | null {
    const state = game.state;
    const active = state.players[player];

    if (state.winner !== null) {
        return 'The match is over.';
    }

    if (state.currentPlayer !== player) {
        return 'It is not your turn.';
    }

    const defId = active.hand[handIndex];

    if (defId === undefined) {
        return null;
    }

    const card = game.library[defId];

    if (!card) {
        return 'Unknown card.';
    }

    if (card.type === 'leader') {
        return 'Leaders are not played.';
    }

    if (card.cost > active.energy) {
        return `Needs ${card.cost} energy.`;
    }

    if (card.type === 'unit' && active.board.length >= BOARD_LIMIT) {
        return 'Your board is full.';
    }

    if (card.type === 'equipment' && active.board.length === 0) {
        return 'No unit to attach to.';
    }

    return null;
}

export function canAttackUnit(
    game: Game,
    player: PlayerIndex,
    uid: string,
): string | null {
    const state = game.state;
    const active = state.players[player];

    if (state.winner !== null) {
        return 'The match is over.';
    }

    if (state.currentPlayer !== player) {
        return 'It is not your turn.';
    }

    const attacker = active.board.find((unit) => unit.uid === uid);

    if (!attacker) {
        return 'No such unit.';
    }

    if (attacker.exhausted) {
        return 'Already acted this turn.';
    }

    if (attacker.summonedThisTurn && !attacker.keywords.includes('swift')) {
        return 'Cannot attack on the turn it was played.';
    }

    return null;
}

export function getAttackTargets(
    game: Game,
    player: PlayerIndex,
): AttackTargets {
    const state = game.state;
    const enemy = state.players[1 - player];
    const bulwarks = enemy.board.filter((unit) =>
        unit.keywords.includes('bulwark'),
    );

    return {
        leaderAllowed: bulwarks.length === 0,
        unitUids:
            bulwarks.length > 0
                ? bulwarks.map((unit) => unit.uid)
                : enemy.board.map((unit) => unit.uid),
    };
}

/**
 * Select a random card index from a player's hand, or -1 if the hand is empty.
 */
export function randomHandIndex(state: GameState, player: PlayerIndex): number {
    const hand = state.players[player].hand;

    if (hand.length === 0) {
        return -1;
    }

    return randomInt(state.rng, hand.length);
}

export { unitPower, unitMaxHealth };
