import { Head, Link } from '@inertiajs/react';
import { Layers, PackageOpen, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard, match } from '@/routes';
import collection from '@/routes/collection';
import decks from '@/routes/decks';
import packs from '@/routes/packs';

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

export default function Dashboard() {
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
            </div>
        </>
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
