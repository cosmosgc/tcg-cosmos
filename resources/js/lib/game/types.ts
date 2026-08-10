export type FactionId = 'dawnspire' | 'voidmire' | 'starforge';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type CardFinish =
    'standard' | 'foil' | 'prismatic' | 'aurora' | 'etched';

export type CardType = 'unit' | 'action' | 'equipment' | 'leader';

export type Keyword = 'swift' | 'bulwark' | 'siphon';

export type PlayerIndex = 0 | 1;

export interface Faction {
    id: FactionId;
    name: string;
    color: string;
    description: string;
    playStyle: string;
}

export type EffectTargetScope = 'enemy_unit' | 'friendly_unit' | 'any_unit';

export type EffectTarget =
    | { kind: 'target_unit'; scope: EffectTargetScope }
    | { kind: 'enemy_leader' }
    | { kind: 'friendly_leader' }
    | { kind: 'all_enemy_units' }
    | { kind: 'all_friendly_units' };

export interface EffectAction {
    kind:
        | 'damage'
        | 'heal'
        | 'buff'
        | 'draw'
        | 'summon'
        | 'gain_energy'
        | 'gain_max_energy'
        | 'destroy_unit'
        | 'return_to_hand';
    amount?: number;
    count?: number;
    defId?: string;
    power?: number;
    health?: number;
    turns?: 'this_turn';
    maxPower?: number;
    target?: EffectTarget;
}

export interface CardEffect {
    trigger: 'on_play';
    actions: EffectAction[];
}

export interface CardDef {
    id: string;
    set: string;
    faction: FactionId | 'neutral';
    name: string;
    type: CardType;
    rarity: CardRarity;
    cost: number;
    power?: number | null;
    health?: number | null;
    keywords: Keyword[];
    text: string | null;
    effects: CardEffect[];
    finish: CardFinish;
    frameVariant: string;
    artUrl?: string | null;
}

export interface EquipmentInstance {
    defId: string;
    name: string;
    power: number;
    health: number;
    keywords: Keyword[];
}

export interface Unit {
    uid: string;
    defId: string;
    name: string;
    owner: PlayerIndex;
    basePower: number;
    tempPower: number;
    baseMaxHealth: number;
    tempMaxHealth: number;
    health: number;
    keywords: Keyword[];
    summonedThisTurn: boolean;
    exhausted: boolean;
    equipment: EquipmentInstance[];
}

export interface LeaderState {
    defId: string;
    name: string;
    health: number;
    maxHealth: number;
}

export interface PlayerState {
    index: PlayerIndex;
    name: string;
    faction: FactionId;
    leader: LeaderState;
    deck: string[];
    hand: string[];
    board: Unit[];
    discard: string[];
    maxEnergy: number;
    energy: number;
    fatigue: number;
}

export interface GameLogEntry {
    player: PlayerIndex;
    message: string;
}

export interface RngState {
    seed: number;
    count: number;
}

export interface GameState {
    players: [PlayerState, PlayerState];
    currentPlayer: PlayerIndex;
    turnNumber: number;
    winner: PlayerIndex | null;
    phase: 'playing' | 'gameover';
    log: GameLogEntry[];
    rng: RngState;
    uidCounter: number;
}

export interface Game {
    state: GameState;
    library: Record<string, CardDef>;
}

export type PlayCardAction = {
    type: 'play_card';
    player: PlayerIndex;
    handIndex: number;
    targetUnit?: string;
};

export type AttackAction = {
    type: 'attack';
    player: PlayerIndex;
    attackerUid: string;
    target: { kind: 'unit'; uid: string } | { kind: 'leader' };
};

export type EndTurnAction = {
    type: 'end_turn';
    player: PlayerIndex;
};

export type DevAction =
    | { type: 'dev_draw'; player: PlayerIndex; count: number }
    | { type: 'dev_energy'; player: PlayerIndex; count: number };

export type GameAction =
    PlayCardAction | AttackAction | EndTurnAction | DevAction;

export interface AttackTargets {
    leaderAllowed: boolean;
    unitUids: string[];
}
