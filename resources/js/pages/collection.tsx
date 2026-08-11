import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CardVisual } from '@/components/card/card-visual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CardDef, Faction } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import collection from '@/routes/collection';

interface Props {
    cards: CardDef[];
    owned: Record<string, number>;
    factions: Faction[];
    wallet: {
        gems: number;
        dust: number;
    };
}

const RARITIES: Array<CardDef['rarity']> = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
];

const TYPES: Array<CardDef['type']> = ['unit', 'action', 'equipment', 'leader'];

const COST_FILTERS: Array<{ label: string; value: string }> = [
    { label: 'Any cost', value: 'all' },
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4+', value: '4' },
];

export default function Collection({ cards, owned, factions, wallet }: Props) {
    const [query, setQuery] = useState('');
    const [faction, setFaction] = useState('all');
    const [type, setType] = useState('all');
    const [rarity, setRarity] = useState('all');
    const [cost, setCost] = useState('all');
    const [ownedOnly, setOwnedOnly] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return cards.filter((card) => {
            if (faction !== 'all' && card.faction !== faction) {
                return false;
            }

            if (type !== 'all' && card.type !== type) {
                return false;
            }

            if (rarity !== 'all' && card.rarity !== rarity) {
                return false;
            }

            if (cost !== 'all') {
                const value = cost === '4' ? 4 : Number(cost);
                const matches =
                    cost === '4' ? card.cost >= 4 : card.cost === value;

                if (!matches) {
                    return false;
                }
            }

            if (ownedOnly && (owned[card.id] ?? 0) === 0) {
                return false;
            }

            if (
                q &&
                !`${card.name} ${card.text ?? ''}`.toLowerCase().includes(q)
            ) {
                return false;
            }

            return true;
        });
    }, [cards, owned, ownedOnly, query, faction, type, rarity, cost]);

    const totalOwned = useMemo(
        () => cards.reduce((sum, card) => sum + (owned[card.id] ?? 0), 0),
        [cards, owned],
    );

    return (
        <>
            <Head title="Collection" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">Collection</h2>
                        <p className="text-sm text-muted-foreground">
                            {cards.length} cards · {totalOwned} copies owned
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Gems {wallet.gems}</Badge>
                        <Badge variant="secondary">Dust {wallet.dust}</Badge>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="search"
                        placeholder="Search cards..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-52"
                    />

                    <SelectControl
                        label="Faction"
                        value={faction}
                        onChange={setFaction}
                        options={[
                            { value: 'all', label: 'All factions' },
                            ...factions.map((item) => ({
                                value: item.id,
                                label: item.name,
                            })),
                            { value: 'neutral', label: 'Neutral' },
                        ]}
                    />

                    <SelectControl
                        label="Type"
                        value={type}
                        onChange={setType}
                        options={[
                            { value: 'all', label: 'All types' },
                            ...TYPES.map((item) => ({
                                value: item,
                                label: item,
                            })),
                        ]}
                    />

                    <SelectControl
                        label="Rarity"
                        value={rarity}
                        onChange={setRarity}
                        options={[
                            { value: 'all', label: 'All rarities' },
                            ...RARITIES.map((item) => ({
                                value: item,
                                label: item,
                            })),
                        ]}
                    />

                    <SelectControl
                        label="Cost"
                        value={cost}
                        onChange={setCost}
                        options={COST_FILTERS}
                    />

                    <Button
                        variant={ownedOnly ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOwnedOnly((value) => !value)}
                    >
                        Owned only
                    </Button>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                        No cards match those filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {filtered.map((card) => (
                            <div
                                key={card.id}
                                className={cn(
                                    'relative',
                                    (owned[card.id] ?? 0) === 0 && 'opacity-50',
                                )}
                            >
                                <CardVisual
                                    card={card}
                                    size="sm"
                                    animated={false}
                                />
                                <OwnedBadge
                                    owned={owned[card.id] ?? 0}
                                    newCard={card.type === 'leader'}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function SelectControl({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function OwnedBadge({ owned, newCard }: { owned: number; newCard?: boolean }) {
    if (owned === 0) {
        return (
            <span className="absolute top-1 right-1 rounded-sm bg-black/70 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white/70 uppercase">
                Missing
            </span>
        );
    }

    return (
        <span className="absolute top-1 right-1 rounded-sm bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
            ×{owned}
            {newCard ? ' · New' : ''}
        </span>
    );
}

Collection.layout = {
    breadcrumbs: [
        {
            title: 'Collection',
            href: collection.index(),
        },
    ],
};
