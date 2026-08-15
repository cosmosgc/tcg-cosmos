import { Head, Link, router } from '@inertiajs/react';
import { Layers, PackageOpen, Sparkles, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard, match } from '@/routes';
import collection from '@/routes/collection';
import decks from '@/routes/decks';
import packs from '@/routes/packs';
import questsRoute from '@/routes/quests';

interface Quest {
    key: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    complete: boolean;
    claimed: boolean;
    gems: number;
    dust: number;
}

interface Props {
    quests: Quest[];
    wallet: {
        gems: number;
        dust: number;
    };
}

const actions = [
    {
        title: 'Collection',
        description: 'Browse your cards, filter by faction or rarity.',
        href: collection.index(),
        icon: Layers,
    },
    {
        title: 'Decks',
        description: 'Build and save 30-card decks.',
        href: decks.index(),
        icon: PackageOpen,
    },
    {
        title: 'Booster',
        description: 'Open a booster and grow your collection.',
        href: packs.index(),
        icon: PackageOpen,
    },
    {
        title: 'Match',
        description: 'Start a hot-seat match.',
        href: match(),
        icon: Swords,
    },
];

export default function Dashboard({ quests, wallet }: Props) {
    const claim = (quest: Quest): void => {
        router.post(
            questsRoute.claim(quest.key),
            {},
            {
                preserveScroll: true,
                onSuccess: () => undefined,
            },
        );
    };

    const totalQuests = quests.length;
    const claimedCount = quests.filter((quest) => quest.claimed).length;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h2 className="text-lg font-semibold">Welcome back</h2>
                    <p className="text-sm text-muted-foreground">
                        Collect cards, build decks, and battle.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-sm border px-1.5 py-0.5">
                        Gems {wallet.gems}
                    </span>
                    <span className="rounded-sm border px-1.5 py-0.5">
                        Dust {wallet.dust}
                    </span>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {actions.map((action) => (
                        <div
                            key={action.title}
                            className="flex flex-col justify-between gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
                            <div className="flex items-start gap-3">
                                <action.icon className="size-5 shrink-0 text-muted-foreground" />
                                <div>
                                    <div className="font-semibold">
                                        {action.title}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={action.href}>Open</Link>
                            </Button>
                        </div>
                    ))}
                </div>

                <QuestBoard
                    quests={quests}
                    claimedCount={claimedCount}
                    totalQuests={totalQuests}
                    onClaim={claim}
                />
            </div>
        </>
    );
}

function QuestBoard({
    quests,
    claimedCount,
    totalQuests,
    onClaim,
}: {
    quests: Quest[];
    claimedCount: number;
    totalQuests: number;
    onClaim: (quest: Quest) => void;
}) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Quests</h3>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {claimedCount}/{totalQuests} claimed
                </span>
            </div>

            {quests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No quests available right now.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                    {quests.map((quest) => (
                        <QuestCard
                            key={quest.key}
                            quest={quest}
                            onClaim={() => onClaim(quest)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: () => void }) {
    const pct = Math.min(
        100,
        Math.round((quest.progress / quest.target) * 100),
    );

    return (
        <div className="flex flex-col justify-between gap-2 rounded-lg border p-3">
            <div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{quest.name}</span>
                    {quest.claimed && (
                        <span className="rounded-sm bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                            Claimed
                        </span>
                    )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {quest.description}
                </p>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                    {quest.progress}/{quest.target}
                </span>
                <span className="tabular-nums">
                    {quest.gems > 0 && `+${quest.gems}g `}
                    {quest.dust > 0 && `+${quest.dust}d`}
                </span>
            </div>

            <Button
                size="sm"
                variant={
                    quest.complete && !quest.claimed ? 'default' : 'outline'
                }
                disabled={!quest.complete || quest.claimed}
                onClick={onClaim}
                title={
                    !quest.complete
                        ? 'Finish this quest to claim its reward.'
                        : quest.claimed
                          ? 'Reward already claimed.'
                          : 'Claim reward'
                }
            >
                {quest.claimed
                    ? 'Claimed'
                    : quest.complete
                      ? 'Claim reward'
                      : 'In progress'}
            </Button>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
