import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import admin from '@/routes/admin';

interface Props {
    packs: Array<{
        id: number;
        code: string;
        name: string;
        set: string | null;
        cost: number;
        size: number;
        enabled: boolean;
        updated_at: string | null;
    }>;
}

export default function AdminBoostersIndex({ packs }: Props) {
    const destroy = (pack: Props['packs'][number]): void => {
        if (confirm(`Delete booster "${pack.name}" (${pack.code})?`)) {
            router.delete(admin.boosters.destroy(pack.id));
        }
    };

    return (
        <>
            <Head title="Admin · Boosters" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">Boosters</h2>
                        <p className="text-sm text-muted-foreground">
                            Configure booster packs, costs and drop rates.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={admin.boosters.create()}>
                            <Plus /> New booster
                        </Link>
                    </Button>
                </div>

                {packs.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            No boosters configured. The default launch booster
                            is still used.
                        </p>
                        <Button asChild variant="outline">
                            <Link href={admin.boosters.create()}>
                                Create a booster
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {packs.map((pack) => (
                            <div
                                key={pack.id}
                                className="rounded-xl border bg-card p-4 shadow-sm"
                            >
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className="truncate font-semibold">
                                        {pack.name}
                                    </span>
                                    <Badge
                                        variant={
                                            pack.enabled
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {pack.enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                                <p className="mb-3 font-mono text-xs text-muted-foreground">
                                    {pack.code}
                                </p>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {pack.set ?? 'Any set'} · {pack.cost} gems ·{' '}
                                    {pack.size} cards
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={admin.boosters.edit(pack.id)}
                                        >
                                            <Pencil /> Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive"
                                        onClick={() => destroy(pack)}
                                    >
                                        <Trash2 /> Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

AdminBoostersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: admin.boosters.index(),
        },
        {
            title: 'Boosters',
            href: admin.boosters.index(),
        },
    ],
};
