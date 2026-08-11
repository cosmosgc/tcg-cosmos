import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FACTION_COLORS } from '@/lib/game/theme';
import decksRoute from '@/routes/decks';

interface Props {
    decks: Array<{
        id: number;
        name: string;
        leaderCode: string;
        leaderName: string;
        cardCount: number;
    }>;
}

export default function DeckIndex({ decks }: Props) {
    const destroy = (id: number, name: string): void => {
        if (confirm(`Delete deck "${name}"?`)) {
            router.delete(decksRoute.destroy(id));
        }
    };

    return (
        <>
            <Head title="Decks" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">Decks</h2>
                        <p className="text-sm text-muted-foreground">
                            Build and save 30-card decks around a faction
                            leader.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={decksRoute.create()}>
                            <Plus /> New deck
                        </Link>
                    </Button>
                </div>

                {decks.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            No decks yet. Build your first one.
                        </p>
                        <Button asChild variant="outline">
                            <Link href={decksRoute.create()}>
                                Create a deck
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {decks.map((deck) => {
                            const leader = deck.leaderName ?? deck.leaderCode;

                            return (
                                <div
                                    key={deck.id}
                                    className="rounded-xl border bg-card p-4 shadow-sm"
                                >
                                    <div className="mb-1 flex items-center gap-2">
                                        <span
                                            className="size-2.5 rounded-full"
                                            style={{
                                                background:
                                                    FACTION_COLORS[
                                                        deck.leaderCode.replace(
                                                            'leader-',
                                                            '',
                                                        )
                                                    ] ?? '#94a3b8',
                                            }}
                                        />
                                        <span className="truncate font-semibold">
                                            {deck.name}
                                        </span>
                                    </div>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        {leader} · {deck.cardCount}/30 cards
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link
                                                href={decksRoute.edit(deck.id)}
                                            >
                                                <Pencil /> Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive"
                                            onClick={() =>
                                                destroy(deck.id, deck.name)
                                            }
                                        >
                                            <Trash2 /> Delete
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

DeckIndex.layout = {
    breadcrumbs: [
        {
            title: 'Decks',
            href: decksRoute.index(),
        },
    ],
};
