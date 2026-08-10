import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CardVisual } from '@/components/card/card-visual';
import { Button } from '@/components/ui/button';
import {
    canAttackUnit,
    canPlayCard,
    cardNeedsTarget,
    createGame,
    dispatch,
    GameError,
    getAttackTargets,
    getCardTargetScope,
} from '@/lib/game/engine';
import { buildLibrary } from '@/lib/game/library';
import { FACTION_COLORS } from '@/lib/game/theme';
import type {
    CardDef,
    Faction,
    FactionId,
    Game,
    GameAction,
    PlayerIndex,
    PlayerState,
    Unit,
} from '@/lib/game/types';
import { cn } from '@/lib/utils';
import { match } from '@/routes';

type Selection =
    | { kind: 'play'; handIndex: number }
    | { kind: 'attack'; uid: string }
    | null;

interface Props {
    factions: Faction[];
    cards: CardDef[];
}

interface SetupState {
    p1Name: string;
    p1Faction: FactionId;
    p2Name: string;
    p2Faction: FactionId;
}

const FACTION_SWATCHES: Record<string, string> = {
    dawnspire: '#f0b429',
    voidmire: '#2dd4bf',
    starforge: '#38bdf8',
    neutral: '#94a3b8',
};

function findUnit(game: Game, uid: string): Unit | undefined {
    return (
        game.state.players[0].board.find((unit) => unit.uid === uid) ??
        game.state.players[1].board.find((unit) => unit.uid === uid)
    );
}

function scopeMatches(
    scope: string,
    owner: PlayerIndex,
    player: PlayerIndex,
): boolean {
    if (scope === 'any_unit') {
        return true;
    }

    if (scope === 'enemy_unit') {
        return owner !== player;
    }

    return owner === player;
}

export default function Match({ factions, cards }: Props) {
    const library = useMemo(() => buildLibrary(cards), [cards]);
    const factionColors = useMemo(
        () =>
            Object.fromEntries(
                factions.map((faction) => [faction.id, faction.color]),
            ),
        [factions],
    );
    const [setup, setSetup] = useState<SetupState>({
        p1Name: 'Player 1',
        p1Faction: 'dawnspire',
        p2Name: 'Player 2',
        p2Faction: 'voidmire',
    });
    const [game, setGame] = useState<Game | null>(null);
    const [selection, setSelection] = useState<Selection>(null);

    const act = (action: GameAction): void => {
        if (!game) {
            return;
        }

        try {
            setGame(dispatch(game, action));
            setSelection(null);
        } catch (error) {
            if (error instanceof GameError) {
                toast.error(error.message);
            } else {
                console.error(error);
            }
        }
    };

    const cardAt = (
        player: PlayerIndex,
        handIndex: number,
    ): CardDef | undefined => {
        if (!game) {
            return undefined;
        }

        const defId = game.state.players[player].hand[handIndex];

        return defId === undefined ? undefined : game.library[defId];
    };

    const handleHandClick = (handIndex: number): void => {
        if (!game) {
            return;
        }

        const player = game.state.currentPlayer;
        const error = canPlayCard(game, player, handIndex);

        if (error) {
            toast.error(error);

            return;
        }

        const card = cardAt(player, handIndex);

        if (!card) {
            return;
        }

        if (cardNeedsTarget(card)) {
            setSelection({ kind: 'play', handIndex });

            return;
        }

        act({ type: 'play_card', player, handIndex });
    };

    const handleUnitClick = (unit: Unit): void => {
        if (!game) {
            return;
        }

        const player = game.state.currentPlayer;

        if (selection) {
            handleTarget(unit.uid);

            return;
        }

        if (
            unit.owner === player &&
            canAttackUnit(game, player, unit.uid) === null
        ) {
            setSelection({ kind: 'attack', uid: unit.uid });
        }
    };

    const handleLeaderClick = (owner: PlayerIndex): void => {
        if (!game || !selection) {
            return;
        }

        if (selection.kind === 'play') {
            toast.error('That card needs a unit target.');

            return;
        }

        if (selection.kind === 'attack' && owner !== game.state.currentPlayer) {
            const targets = getAttackTargets(game, game.state.currentPlayer);

            if (targets.leaderAllowed) {
                act({
                    type: 'attack',
                    player: game.state.currentPlayer,
                    attackerUid: selection.uid,
                    target: { kind: 'leader' },
                });
            } else {
                toast.error('An enemy Bulwark unit blocks this attack.');
            }
        }
    };

    const handleTarget = (uid: string): void => {
        if (!game || !selection) {
            return;
        }

        const player = game.state.currentPlayer;
        const unit = findUnit(game, uid);

        if (!unit) {
            return;
        }

        if (selection.kind === 'play') {
            const card = cardAt(player, selection.handIndex);

            if (!card) {
                setSelection(null);

                return;
            }

            const scope =
                getCardTargetScope(card) ??
                (card.type === 'equipment' ? 'friendly_unit' : null);

            if (scope && scopeMatches(scope, unit.owner, player)) {
                act({
                    type: 'play_card',
                    player,
                    handIndex: selection.handIndex,
                    targetUnit: uid,
                });
            } else {
                toast.error('Not a valid target.');
            }

            return;
        }

        const targets = getAttackTargets(game, player);

        if (targets.unitUids.includes(uid)) {
            act({
                type: 'attack',
                player,
                attackerUid: selection.uid,
                target: { kind: 'unit', uid },
            });
        } else {
            toast.error('Not a valid target.');
        }
    };

    const isUnitTargetable = (unit: Unit): boolean => {
        if (!game || !selection) {
            return false;
        }

        const player = game.state.currentPlayer;

        if (selection.kind === 'play') {
            const card = cardAt(player, selection.handIndex);

            if (!card) {
                return false;
            }

            const scope =
                getCardTargetScope(card) ??
                (card.type === 'equipment' ? 'friendly_unit' : null);

            return scope !== null && scopeMatches(scope, unit.owner, player);
        }

        if (unit.owner === player) {
            return canAttackUnit(game, player, unit.uid) === null;
        }

        return getAttackTargets(game, player).unitUids.includes(unit.uid);
    };

    const isLeaderTargetable = (owner: PlayerIndex): boolean => {
        if (!game || !selection || selection.kind !== 'attack') {
            return false;
        }

        return (
            owner !== game.state.currentPlayer &&
            getAttackTargets(game, game.state.currentPlayer).leaderAllowed
        );
    };

    const startMatch = (): void => {
        setGame(
            createGame(library, {
                playerOne: {
                    name: setup.p1Name || 'Player 1',
                    faction: setup.p1Faction,
                },
                playerTwo: {
                    name: setup.p2Name || 'Player 2',
                    faction: setup.p2Faction,
                },
                seed: Date.now() >>> 0,
            }),
        );
        setSelection(null);
    };

    const current = game?.state.currentPlayer;

    return (
        <>
            <Head title="Hot-Seat Match" />

            <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4">
                {game && current !== undefined ? (
                    <MatchScreen
                        game={game}
                        selection={selection}
                        factionColors={factionColors}
                        onHandClick={handleHandClick}
                        onUnitClick={handleUnitClick}
                        onLeaderClick={handleLeaderClick}
                        isUnitTargetable={isUnitTargetable}
                        isLeaderTargetable={isLeaderTargetable}
                        onEndTurn={() =>
                            act({ type: 'end_turn', player: current })
                        }
                        onDevDraw={() =>
                            act({ type: 'dev_draw', player: current, count: 1 })
                        }
                        onDevEnergy={() =>
                            act({
                                type: 'dev_energy',
                                player: current,
                                count: 1,
                            })
                        }
                        onCancel={() => setSelection(null)}
                        onRematch={startMatch}
                        onNewSetup={() => setGame(null)}
                    />
                ) : (
                    <SetupScreen
                        factions={factions}
                        setup={setup}
                        setSetup={setSetup}
                        onStart={startMatch}
                    />
                )}
            </div>
        </>
    );
}

Match.layout = {
    breadcrumbs: [
        {
            title: 'Match',
            href: match(),
        },
    ],
};

function SetupScreen({
    factions,
    setup,
    setSetup,
    onStart,
}: {
    factions: Faction[];
    setup: SetupState;
    setSetup: (setup: SetupState) => void;
    onStart: () => void;
}) {
    const update = (field: keyof SetupState, value: string): void => {
        setSetup({ ...setup, [field]: value });
    };

    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-xl space-y-6 rounded-xl border bg-card p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold">Hot-seat match</h2>
                    <p className="text-sm text-muted-foreground">
                        Pick two factions, then pass the device between turns.
                        Turn order is Player 1 first.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <PlayerSetup
                        label="Player 1 (goes first)"
                        name={setup.p1Name}
                        faction={setup.p1Faction}
                        factions={factions}
                        onName={(name) => update('p1Name', name)}
                        onFaction={(faction) => update('p1Faction', faction)}
                    />
                    <PlayerSetup
                        label="Player 2"
                        name={setup.p2Name}
                        faction={setup.p2Faction}
                        factions={factions}
                        onName={(name) => update('p2Name', name)}
                        onFaction={(faction) => update('p2Faction', faction)}
                    />
                </div>

                <Button onClick={onStart} className="w-full">
                    Start match
                </Button>
            </div>
        </div>
    );
}

function PlayerSetup({
    label,
    name,
    faction,
    factions,
    onName,
    onFaction,
}: {
    label: string;
    name: string;
    faction: FactionId;
    factions: Faction[];
    onName: (name: string) => void;
    onFaction: (faction: FactionId) => void;
}) {
    return (
        <div className="space-y-3 rounded-lg border p-4">
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </label>
            <input
                type="text"
                value={name}
                onChange={(event) => onName(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            />
            <select
                value={faction}
                onChange={(event) => onFaction(event.target.value as FactionId)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            >
                {factions.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name} — {item.playStyle}
                    </option>
                ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                    className="size-3 rounded-full"
                    style={{
                        background:
                            FACTION_SWATCHES[faction] ??
                            FACTION_COLORS[faction],
                    }}
                />
                <span>
                    {factions.find((item) => item.id === faction)
                        ?.description ?? ''}
                </span>
            </div>
        </div>
    );
}

function MatchScreen({
    game,
    selection,
    factionColors,
    onHandClick,
    onUnitClick,
    onLeaderClick,
    isUnitTargetable,
    isLeaderTargetable,
    onEndTurn,
    onDevDraw,
    onDevEnergy,
    onCancel,
    onRematch,
    onNewSetup,
}: {
    game: Game;
    selection: Selection;
    factionColors: Record<string, string>;
    onHandClick: (handIndex: number) => void;
    onUnitClick: (unit: Unit) => void;
    onLeaderClick: (owner: PlayerIndex) => void;
    isUnitTargetable: (unit: Unit) => boolean;
    isLeaderTargetable: (owner: PlayerIndex) => boolean;
    onEndTurn: () => void;
    onDevDraw: () => void;
    onDevEnergy: () => void;
    onCancel: () => void;
    onRematch: () => void;
    onNewSetup: () => void;
}) {
    const state = game.state;
    const current = state.currentPlayer;
    const active = state.players[current];
    const enemy = state.players[(1 - current) as PlayerIndex];
    const enemyFactionColor =
        (factionColors ?? FACTION_COLORS)[enemy.faction] ??
        FACTION_COLORS.neutral;
    const activeFactionColor =
        (factionColors ?? FACTION_COLORS)[active.faction] ??
        FACTION_COLORS.neutral;
    const recentLog = state.log.slice(-25).reverse();

    return (
        <div className="flex flex-1 flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <span
                        className="size-2.5 rounded-full"
                        style={{ background: activeFactionColor }}
                    />
                    Turn {state.turnNumber} — {active.name}&apos;s turn
                </div>
                {selection && (
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>

            <PlayerPanel
                player={enemy}
                isEnemy
                factionColor={enemyFactionColor}
                onLeaderClick={() => onLeaderClick(enemy.index)}
                leaderTargetable={isLeaderTargetable(enemy.index)}
                onUnitClick={onUnitClick}
                isUnitTargetable={isUnitTargetable}
                game={game}
            />

            <div className="min-h-24 rounded-lg border bg-muted/40 p-3">
                <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Battle log
                </div>
                <ul className="space-y-1 text-xs">
                    {recentLog.map((entry, index) => (
                        <li
                            key={`${entry.message}-${state.log.length - index}`}
                        >
                            <span
                                className="mr-1 font-bold"
                                style={{
                                    color:
                                        entry.player === current
                                            ? activeFactionColor
                                            : enemyFactionColor,
                                }}
                            >
                                {entry.player === current
                                    ? active.name
                                    : enemy.name}
                                :
                            </span>
                            {entry.message}
                        </li>
                    ))}
                </ul>
            </div>

            <PlayerPanel
                player={active}
                isEnemy={false}
                factionColor={activeFactionColor}
                onLeaderClick={() => onLeaderClick(active.index)}
                leaderTargetable={isLeaderTargetable(active.index)}
                onUnitClick={onUnitClick}
                isUnitTargetable={isUnitTargetable}
                showHand
                game={game}
                selection={selection}
                onHandClick={onHandClick}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button onClick={onEndTurn} size="sm">
                        End turn
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDevDraw}
                        title="Developer: draw a card"
                    >
                        Draw
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDevEnergy}
                        title="Developer: gain 1 energy"
                    >
                        +Energy
                    </Button>
                </div>

                {state.winner !== null && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                            {state.players[state.winner].name} wins!
                        </span>
                        <Button size="sm" onClick={onRematch}>
                            Rematch
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNewSetup}
                        >
                            New setup
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlayerPanel({
    player,
    isEnemy,
    factionColor,
    onLeaderClick,
    leaderTargetable,
    onUnitClick,
    isUnitTargetable,
    showHand = false,
    game,
    selection,
    onHandClick,
}: {
    player: PlayerState;
    isEnemy: boolean;
    factionColor: string;
    onLeaderClick: () => void;
    leaderTargetable: boolean;
    onUnitClick: (unit: Unit) => void;
    isUnitTargetable: (unit: Unit) => boolean;
    showHand?: boolean;
    game: Game;
    selection?: Selection;
    onHandClick?: (handIndex: number) => void;
}) {
    const hpPercent = Math.max(
        0,
        (player.leader.health / player.leader.maxHealth) * 100,
    );

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span
                        className="size-2.5 rounded-full"
                        style={{ background: factionColor }}
                    />
                    <span className="text-sm font-semibold">{player.name}</span>
                    {isEnemy && (
                        <span className="text-xs text-muted-foreground">
                            (enemy)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-sm border px-1.5 py-0.5">
                        Energy {player.energy}/{player.maxEnergy}
                    </span>
                    <span className="rounded-sm border px-1.5 py-0.5">
                        Deck {player.deck.length}
                    </span>
                    <span className="rounded-sm border px-1.5 py-0.5">
                        Hand {player.hand.length}
                    </span>
                    <span className="rounded-sm border px-1.5 py-0.5">
                        Discard {player.discard.length}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={onLeaderClick}
                className={cn(
                    'mb-3 flex w-full items-center gap-3 rounded-lg border p-2 text-left transition',
                    leaderTargetable
                        ? 'cursor-pointer ring-2 ring-emerald-400 ring-offset-2'
                        : 'cursor-default',
                )}
                style={{ borderColor: factionColor }}
            >
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${hpPercent}%`,
                            background:
                                hpPercent > 25 ? factionColor : '#ef4444',
                        }}
                    />
                </div>
                <span className="text-xs font-semibold tabular-nums">
                    {player.leader.health}/{player.leader.maxHealth}
                </span>
            </button>

            {player.board.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                    No units in play
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {player.board.map((unit) => (
                        <button
                            key={unit.uid}
                            type="button"
                            onClick={() => onUnitClick(unit)}
                            className={cn(
                                'rounded-lg transition',
                                isUnitTargetable(unit) &&
                                    'cursor-pointer ring-2 ring-emerald-400 ring-offset-2',
                            )}
                        >
                            <CardVisual
                                card={unitToCard(game, unit)}
                                size="sm"
                                dimmed={unit.exhausted}
                            />
                        </button>
                    ))}
                </div>
            )}

            {showHand && onHandClick && (
                <div className="mt-3 border-t pt-3">
                    <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Your hand
                    </div>
                    {player.hand.length === 0 ? (
                        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                            No cards in hand
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {player.hand.map((defId, handIndex) => {
                                const card = game.library[defId];

                                if (!card) {
                                    return null;
                                }

                                const playError = canPlayCard(
                                    game,
                                    player.index,
                                    handIndex,
                                );
                                const isSelected =
                                    selection?.kind === 'play' &&
                                    selection.handIndex === handIndex;

                                return (
                                    <button
                                        key={`${defId}-${handIndex}`}
                                        type="button"
                                        onClick={() => onHandClick(handIndex)}
                                        className="rounded-lg transition"
                                        disabled={playError !== null}
                                        title={playError ?? undefined}
                                    >
                                        <CardVisual
                                            card={card}
                                            size="sm"
                                            interactive
                                            selected={isSelected}
                                            dimmed={playError !== null}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function unitToCard(game: Game, unit: Unit): CardDef {
    const def = game.library[unit.defId];

    if (!def) {
        return unitAsCard(unit);
    }

    const equipped =
        unit.equipment.length > 0
            ? `Equipped: ${unit.equipment.map((item) => item.name).join(', ')}`
            : null;

    return {
        ...def,
        power: unit.basePower + unit.tempPower,
        health: unit.health,
        keywords: unit.keywords,
        text: equipped
            ? [def.text, equipped].filter(Boolean).join(' ')
            : def.text,
    };
}

function unitAsCard(unit: Unit): CardDef {
    return {
        id: unit.defId,
        set: 'runtime',
        faction: 'neutral',
        name: unit.name,
        type: 'unit',
        rarity: 'common',
        cost: 0,
        power: unit.basePower + unit.tempPower,
        health: unit.health,
        keywords: unit.keywords,
        text: null,
        effects: [],
        finish: 'standard',
        frameVariant: 'neutral-common',
        artUrl: null,
    };
}
