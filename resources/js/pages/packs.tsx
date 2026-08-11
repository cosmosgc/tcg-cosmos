import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CardBack } from '@/components/card/card-back';
import { CardVisual } from '@/components/card/card-visual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RARITY_COLORS } from '@/lib/game/theme';
import type { CardDef } from '@/lib/game/types';
import packs from '@/routes/packs';

interface Props {
    pack: {
        id: string;
        name: string;
        cost: number;
        size: number;
        dropRates: Array<{
            slot: string;
            rates: Array<{ rarity: string; chance: number }>;
        }>;
    };
    wallet: {
        gems: number;
        dust: number;
    };
    lastOpening: {
        cards: Array<{
            code: string;
            finish: string;
            rarity: string;
            quantity: number;
            new: boolean;
        }>;
        dust: number;
        openedAt: string;
    } | null;
}

const REVEAL_DELAY_MS = 450;

export default function Packs({ pack, wallet, lastOpening }: Props) {
    const [revealed, setRevealed] = useState(false);

    const openPack = (): void => {
        setRevealed(false);
        router.post(
            packs.open(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setRevealed(false),
            },
        );
    };

    const cards = lastOpening?.cards ?? [];
    const allRevealed = revealed && cards.length > 0;

    return (
        <>
            <Head title="Booster" />

            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">{pack.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {pack.size} cards per pack · {pack.cost} gems
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Gems {wallet.gems}</Badge>
                        <Badge variant="secondary">Dust {wallet.dust}</Badge>
                    </div>
                </div>

                {!lastOpening ? (
                    <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-8">
                        <CardBack className="h-48 w-36" />
                        <p className="max-w-md text-center text-sm text-muted-foreground">
                            Rewards are rolled and granted on the server before
                            the reveal. Cards you already own beyond the copy
                            limit convert to dust.
                        </p>
                        <Button
                            onClick={openPack}
                            disabled={wallet.gems < pack.cost}
                        >
                            Open booster ({pack.cost} gems)
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                            {cards.map((item, index) => (
                                <RevealSlot
                                    key={`${item.code}-${index}`}
                                    item={item}
                                    index={index}
                                    revealed={revealed}
                                />
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {!allRevealed && (
                                <Button
                                    onClick={() => setRevealed(true)}
                                    variant="outline"
                                    size="sm"
                                >
                                    Reveal all
                                </Button>
                            )}
                            {allRevealed && (
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    {lastOpening.dust > 0 && (
                                        <Badge variant="secondary">
                                            +{lastOpening.dust} dust from
                                            duplicates
                                        </Badge>
                                    )}
                                    <Button onClick={openPack}>
                                        Open another
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {pack.dropRates && <DropRates rates={pack.dropRates} />}
            </div>
        </>
    );
}

function RevealSlot({
    item,
    index,
    revealed,
}: {
    item: {
        code: string;
        finish: string;
        rarity: string;
        quantity: number;
        new: boolean;
    };
    index: number;
    revealed: boolean;
}) {
    const card: CardDef = {
        id: item.code,
        set: 'celestial-genesis',
        faction: 'neutral',
        name: '',
        type: 'unit',
        rarity: item.rarity as CardDef['rarity'],
        cost: 0,
        power: null,
        health: null,
        keywords: [],
        text: null,
        effects: [],
        finish: item.finish as CardDef['finish'],
        frameVariant: 'reveal',
        artUrl: null,
    };

    const isRevealed = revealed;
    const delay = index * REVEAL_DELAY_MS;
    const rarityColor =
        RARITY_COLORS[item.rarity as CardDef['rarity']] ?? '#94a3b8';

    if (!isRevealed) {
        return (
            <div className="flex flex-col items-center gap-1">
                <CardBack className="h-44 w-32" />
                <span className="text-xs text-muted-foreground">? ? ?</span>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col items-center gap-1"
            style={{
                animationDelay: `${delay}ms`,
            }}
        >
            <div
                className="animate-in duration-300 fade-in-0 zoom-in-95"
                style={{ animationDelay: `${delay}ms` }}
            >
                <CardVisual
                    card={card}
                    size="sm"
                    animated={false}
                    className="relative"
                />
            </div>
            <span
                className="text-xs font-semibold"
                style={{ color: rarityColor }}
            >
                {item.rarity}
                {item.new ? ' · NEW' : ''}
            </span>
        </div>
    );
}

function DropRates({
    rates,
}: {
    rates: Array<{
        slot: string;
        rates: Array<{ rarity: string; chance: number }>;
    }>;
}) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">Drop rates</h3>
            <div className="grid gap-3 sm:grid-cols-3">
                {rates.map(({ slot, rates: rows }) => (
                    <div key={slot}>
                        <div className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {slot}
                        </div>
                        <ul className="space-y-1 text-xs">
                            {rows.map((row) => (
                                <li
                                    key={row.rarity}
                                    className="flex items-center justify-between"
                                >
                                    <span className="capitalize">
                                        {row.rarity}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {row.chance}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

Packs.layout = {
    breadcrumbs: [
        {
            title: 'Booster',
            href: packs.index(),
        },
    ],
};
