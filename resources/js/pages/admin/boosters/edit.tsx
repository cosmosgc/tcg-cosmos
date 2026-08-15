import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import admin from '@/routes/admin';

interface Props {
    pack: {
        id: number;
        code: string;
        set_id: number | null;
        name: string;
        cost: number;
        size: number;
        drop_rates: {
            uncommon_or_better: Record<string, number>;
            rare_or_better: Record<string, number>;
        };
        enabled: boolean;
    } | null;
    sets: Array<{ id: number; code: string; name: string }>;
}

const DEFAULT_DROP_RATES = {
    uncommon_or_better: {
        uncommon: 60,
        rare: 30,
        epic: 8,
        legendary: 2,
    },
    rare_or_better: {
        rare: 65,
        epic: 28,
        legendary: 7,
    },
};

export default function AdminBoosterEdit({ pack, sets }: Props) {
    const editing = pack !== null;
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        code: pack?.code ?? '',
        set_id: pack?.set_id?.toString() ?? '',
        name: pack?.name ?? '',
        cost: pack?.cost.toString() ?? '100',
        size: pack?.size.toString() ?? '5',
        drop_rates: pack
            ? JSON.stringify(pack.drop_rates, null, 2)
            : JSON.stringify(DEFAULT_DROP_RATES, null, 2),
        enabled: pack?.enabled ?? true,
    });

    const set = (key: keyof typeof form, value: string | boolean): void => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const submit = (): void => {
        setProcessing(true);

        const payload = {
            code: form.code,
            set_id: form.set_id,
            name: form.name,
            cost: form.cost,
            size: form.size,
            drop_rates: form.drop_rates,
            enabled: form.enabled,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        if (editing && pack) {
            router.put(admin.boosters.update(pack.id), payload, options);
        } else {
            router.post(admin.boosters.store(), payload, options);
        }
    };

    return (
        <>
            <Head title={editing ? `Edit ${pack?.name}` : 'New booster'} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={admin.boosters.index()}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold">
                                {editing ? 'Edit booster' : 'New booster'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {editing
                                    ? `Editing ${pack?.code}`
                                    : 'Define a booster pack and its drop rates.'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={submit} disabled={processing}>
                        <Check /> Save booster
                    </Button>
                </div>

                <div className="max-w-2xl space-y-4">
                    <section className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Pack
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Code">
                                <Input
                                    value={form.code}
                                    onChange={(event) =>
                                        set('code', event.target.value)
                                    }
                                    placeholder="e.g. celestial-genesis"
                                />
                            </Field>
                            <Field label="Name">
                                <Input
                                    value={form.name}
                                    onChange={(event) =>
                                        set('name', event.target.value)
                                    }
                                    placeholder="Booster name"
                                />
                            </Field>
                            <Field label="Set">
                                <select
                                    value={form.set_id}
                                    onChange={(event) =>
                                        set('set_id', event.target.value)
                                    }
                                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                >
                                    <option value="">Any set</option>
                                    {sets.map((set) => (
                                        <option key={set.id} value={set.id}>
                                            {set.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Cost (gems)">
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.cost}
                                    onChange={(event) =>
                                        set('cost', event.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Cards per pack">
                                <Input
                                    type="number"
                                    min={3}
                                    max={12}
                                    value={form.size}
                                    onChange={(event) =>
                                        set('size', event.target.value)
                                    }
                                />
                            </Field>
                            <div className="flex items-end">
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.enabled}
                                        onChange={(event) =>
                                            set('enabled', event.target.checked)
                                        }
                                        className="size-4 rounded border-input accent-primary"
                                    />
                                    Enabled (used by the booster screen)
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border bg-card p-4 shadow-sm">
                        <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Drop rates (JSON)
                        </h3>
                        <p className="mb-2 text-xs text-muted-foreground">
                            Weighted rarity tables. The last two slots roll one
                            uncommon-or-better and one rare-or-better card; the
                            remaining slots are commons.
                        </p>
                        <textarea
                            value={form.drop_rates}
                            onChange={(event) =>
                                set('drop_rates', event.target.value)
                            }
                            rows={14}
                            spellCheck={false}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                        />
                    </section>
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            {children}
        </label>
    );
}

AdminBoosterEdit.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: admin.boosters.index(),
        },
        {
            title: 'Boosters',
            href: admin.boosters.index(),
        },
        {
            title: 'Booster editor',
            href: undefined,
        },
    ],
};
