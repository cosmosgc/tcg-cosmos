import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CardVisual } from '@/components/card/card-visual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DECK_SIZE, COPY_LIMIT } from '@/lib/game/library';
import { FACTION_COLORS } from '@/lib/game/theme';
import type { CardDef } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import decks from '@/routes/decks';

interface Props {
    cards: CardDef[];
    owned: Record<string, number>;
    deck: {
        id: number;
        name: string;
        leaderCode: string;
        cards: string[];
    } | null;
}

const TYPES: Array<CardDef['type']> = ['unit', 'action', 'equipment'];

export default function DeckEditor({ cards, owned, deck }: Props) {
    const [name, setName] = useState(deck?.name ?? '');
    const [leaderCode, setLeaderCode] = useState<string | null>(
        deck?.leaderCode ?? null,
    );
    const [selection, setSelection] = useState<string[]>(deck?.cards ?? []);
    const [typeFilter, setTypeFilter] = useState('all');

    const leaders = useMemo(
        () =>
            cards.filter(
                (card) => card.type === 'leader' && (owned[card.id] ?? 0) > 0,
            ),
        [cards, owned],
    );

    const library = useMemo(
        () => Object.fromEntries(cards.map((card) => [card.id, card])),
        [cards],
    );

    const [formError, setFormError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const leader = leaderCode ? library[leaderCode] : undefined;
    const leaderFaction = leader?.faction ?? null;

    const counts = useMemo(() => {
        const map: Record<string, number> = {};

        for (const code of selection) {
            map[code] = (map[code] ?? 0) + 1;
        }

        return map;
    }, [selection]);

    const totalCards = selection.length + (leaderCode ? 1 : 0);

    const issues = useMemo(() => {
        const list: string[] = [];

        if (!leaderCode) {
            list.push('Choose a leader.');
        }

        if (totalCards !== DECK_SIZE) {
            list.push(
                `Must contain exactly ${DECK_SIZE} cards (now ${totalCards}).`,
            );
        }

        for (const [code, count] of Object.entries(counts)) {
            if (count > COPY_LIMIT) {
                list.push(
                    `Too many copies of "${library[code]?.name ?? code}" (${count}/${COPY_LIMIT}).`,
                );
            }

            if ((owned[code] ?? 0) < count) {
                list.push(
                    `You do not own enough copies of "${library[code]?.name ?? code}".`,
                );
            }
        }

        return list;
    }, [leaderCode, totalCards, counts, owned, library]);

    const legal = issues.length === 0;

    const availablePool = useMemo(() => {
        return cards.filter(
            (card) =>
                card.type !== 'leader' &&
                (typeFilter === 'all' || card.type === typeFilter) &&
                (leaderFaction === null ||
                    card.faction === 'neutral' ||
                    card.faction === leaderFaction),
        );
    }, [cards, typeFilter, leaderFaction]);

    const addCard = (code: string): void => {
        setFormError(null);
        const count = counts[code] ?? 0;

        if (count >= COPY_LIMIT) {
            return;
        }

        if (totalCards >= DECK_SIZE) {
            setFormError(`Decks are limited to ${DECK_SIZE} cards.`);

            return;
        }

        setSelection((current) => [...current, code]);
    };

    const removeCard = (code: string): void => {
        setSelection((current) => {
            const index = current.lastIndexOf(code);

            if (index === -1) {
                return current;
            }

            return current.filter((_, i) => i !== index);
        });
    };

    const save = (): void => {
        if (!legal) {
            setFormError(issues[0] ?? 'Deck is not legal yet.');

            return;
        }

        setProcessing(true);

        const payload = {
            name,
            leaderCardCode: leaderCode,
            cards: selection,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        if (deck) {
            router.put(decks.update(deck.id), payload, options);
        } else {
            router.post(decks.store(), payload, options);
        }
    };

    return (
        <>
            <Head title={deck ? `Edit ${deck.name}` : 'New deck'} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={decks.index()}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold">
                                {deck ? 'Edit deck' : 'New deck'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Pick a leader, then add owned cards up to the
                                limits.
                            </p>
                        </div>
                    </div>
                    <Button onClick={save} disabled={processing || !legal}>
                        <Check /> Save deck
                    </Button>
                </div>

                {formError && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {formError}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-4">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <label
                                htmlFor="deck-name"
                                className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                            >
                                Deck name
                            </label>
                            <Input
                                id="deck-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="My deck"
                                maxLength={60}
                            />

                            <label className="mt-4 mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Leader
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {leaders.map((card) => (
                                    <button
                                        key={card.id}
                                        type="button"
                                        onClick={() => setLeaderCode(card.id)}
                                        className={cn(
                                            'rounded-lg border p-1 transition',
                                            leaderCode === card.id
                                                ? 'border-ring ring-2 ring-ring/50'
                                                : 'border-border hover:border-ring/50',
                                        )}
                                    >
                                        <CardVisual
                                            card={card}
                                            size="xs"
                                            animated={false}
                                        />
                                    </button>
                                ))}
                            </div>
                            {leaders.length === 0 && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    You do not own any leaders yet. Open
                                    boosters to earn more.
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Card pool
                                </label>
                                <div className="flex gap-1">
                                    {(['all', ...TYPES] as const).map(
                                        (value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    setTypeFilter(value)
                                                }
                                                className={cn(
                                                    'rounded-md px-2 py-1 text-xs capitalize transition',
                                                    typeFilter === value
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground hover:bg-accent',
                                                )}
                                            >
                                                {value}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {leaderFaction === null ? (
                                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                                    Choose a leader to see available cards.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {availablePool.map((card) => {
                                        const count = counts[card.id] ?? 0;
                                        const maxed = count >= COPY_LIMIT;
                                        const ownedCount = owned[card.id] ?? 0;
                                        const canAdd =
                                            !maxed &&
                                            totalCards < DECK_SIZE &&
                                            count < ownedCount;

                                        return (
                                            <div
                                                key={card.id}
                                                className="relative"
                                            >
                                                <CardVisual
                                                    card={card}
                                                    size="xs"
                                                    animated={false}
                                                    dimmed={!canAdd}
                                                />
                                                <div className="pointer-events-none absolute top-1 left-1 rounded-sm bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                    {count}/
                                                    {Math.min(
                                                        COPY_LIMIT,
                                                        ownedCount,
                                                    )}{' '}
                                                    in deck
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addCard(card.id)
                                                    }
                                                    disabled={!canAdd}
                                                    title={
                                                        !canAdd
                                                            ? maxed
                                                                ? `Copy limit (${COPY_LIMIT}) reached`
                                                                : totalCards >=
                                                                    DECK_SIZE
                                                                  ? `Deck is full (${DECK_SIZE})`
                                                                  : 'Not enough owned copies'
                                                            : `Add ${card.name}`
                                                    }
                                                    className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow disabled:cursor-not-allowed disabled:bg-black/40"
                                                >
                                                    <Plus className="size-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="h-fit rounded-xl border bg-card p-4 shadow-sm lg:sticky lg:top-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Your deck</h3>
                            <Badge variant={legal ? 'default' : 'destructive'}>
                                {totalCards}/{DECK_SIZE}
                            </Badge>
                        </div>

                        {leader && (
                            <div className="mb-3 rounded-lg border bg-muted/40 p-2">
                                <div className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Leader
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span
                                        className="truncate text-sm font-semibold"
                                        style={{
                                            color:
                                                FACTION_COLORS[
                                                    leader.faction
                                                ] ?? undefined,
                                        }}
                                    >
                                        {leader.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {leader.faction}
                                    </span>
                                </div>
                            </div>
                        )}

                        {selection.length === 0 ? (
                            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                                Click cards to add them.
                            </div>
                        ) : (
                            <ul className="max-h-96 space-y-1 overflow-y-auto">
                                {Object.entries(counts)
                                    .sort(
                                        (a, b) =>
                                            (library[a[0]]?.cost ?? 0) -
                                            (library[b[0]]?.cost ?? 0),
                                    )
                                    .map(([code, count]) => {
                                        const card = library[code];

                                        if (!card) {
                                            return null;
                                        }

                                        return (
                                            <li
                                                key={code}
                                                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm"
                                            >
                                                <span className="truncate">
                                                    <span className="mr-2 inline-block w-4 text-center text-muted-foreground">
                                                        {card.cost}
                                                    </span>
                                                    {card.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        ×{count}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeCard(code)
                                                        }
                                                        title={`Remove ${card.name}`}
                                                        className="flex size-5 items-center justify-center rounded-full bg-black/30 text-white hover:bg-destructive"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}

                        {issues.length > 0 && (
                            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                                {issues.map((issue) => (
                                    <li key={issue} className="flex gap-1">
                                        <span className="text-destructive">
                                            •
                                        </span>
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {legal && (
                            <p className="mt-3 text-xs text-emerald-500">
                                This deck is legal.
                            </p>
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

DeckEditor.layout = {
    breadcrumbs: [
        {
            title: 'Decks',
            href: decks.index(),
        },
    ],
};
