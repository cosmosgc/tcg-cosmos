import { Head, Link, router } from '@inertiajs/react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RARITY_COLORS } from '@/lib/game/theme';
import admin from '@/routes/admin';

interface Props {
    cards: Array<{
        id: number;
        code: string;
        name: string;
        type: string;
        cost: number;
        rarity: string;
        faction: string | null;
        factionCode: string | null;
        set: string | null;
        setCode: string | null;
        power: number | null;
        health: number | null;
        hasArt: boolean;
        artUrl: string | null;
    }>;
}

export default function AdminCardsIndex({ cards }: Props) {
    const destroy = (card: Props['cards'][number]): void => {
        if (confirm(`Delete "${card.name}" (${card.code})?`)) {
            router.delete(admin.cards.destroy(card.id));
        }
    };

    return (
        <>
            <Head title="Admin · Cards" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">Cards</h2>
                        <p className="text-sm text-muted-foreground">
                            {cards.length} cards across the catalogue.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={admin.cards.create()}>
                            <Plus /> New card
                        </Link>
                    </Button>
                </div>

                {cards.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            No cards yet. Create the first one.
                        </p>
                        <Button asChild variant="outline">
                            <Link href={admin.cards.create()}>
                                Create a card
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-xs tracking-wider text-muted-foreground uppercase">
                                    <th className="px-3 py-2">Card</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Cost</th>
                                    <th className="px-3 py-2">Rarity</th>
                                    <th className="px-3 py-2">Faction</th>
                                    <th className="px-3 py-2">Stats</th>
                                    <th className="px-3 py-2">Art</th>
                                    <th className="px-3 py-2 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {cards.map((card) => (
                                    <tr
                                        key={card.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-3 py-2">
                                            <div className="font-medium">
                                                {card.name}
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {card.code}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 capitalize">
                                            {card.type}
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">
                                            {card.cost}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                                style={{
                                                    color: RARITY_COLORS[
                                                        card.rarity as keyof typeof RARITY_COLORS
                                                    ],
                                                    borderColor:
                                                        RARITY_COLORS[
                                                            card.rarity as keyof typeof RARITY_COLORS
                                                        ],
                                                }}
                                            >
                                                {card.rarity}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-2">
                                            {card.faction ?? (
                                                <span className="text-muted-foreground">
                                                    Neutral
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">
                                            {card.power !== null ||
                                            card.health !== null ? (
                                                `${card.power ?? '—'}/${card.health ?? '—'}`
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {card.hasArt ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                                    <ImagePlus className="size-3.5" />
                                                    Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    None
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={admin.cards.edit(
                                                            card.id,
                                                        )}
                                                    >
                                                        <Pencil /> Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        destroy(card)
                                                    }
                                                >
                                                    <Trash2 /> Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

AdminCardsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: admin.cards.index(),
        },
        {
            title: 'Cards',
            href: admin.cards.index(),
        },
    ],
};
