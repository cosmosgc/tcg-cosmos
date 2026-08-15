import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, Trash, Upload, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CardVisual } from '@/components/card/card-visual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CardDef } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';

interface Props {
    card: {
        id: number;
        code: string;
        set_id: number | null;
        faction_id: number | null;
        name: string;
        type: CardDef['type'];
        cost: number;
        rarity: CardDef['rarity'];
        power: number | null;
        health: number | null;
        keywords: string[];
        text: string | null;
        effects: CardEffect[];
        finish: CardDef['finish'];
        frame_variant: string | null;
        sort: number;
        art_url: string | null;
        artUrl: string | null;
    } | null;
    sets: Array<{ id: number; code: string; name: string }>;
    factions: Array<{ id: number; code: string; name: string; color: string }>;
}

type CardEffect = {
    trigger: string;
    actions: Array<Record<string, unknown>>;
};

const TYPES: Array<CardDef['type']> = ['unit', 'action', 'equipment', 'leader'];
const RARITIES: Array<CardDef['rarity']> = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
];
const FINISHES: Array<CardDef['finish']> = [
    'standard',
    'foil',
    'prismatic',
    'aurora',
    'etched',
];

export default function AdminCardEdit({ card, sets, factions }: Props) {
    const editing = card !== null;
    const [processing, setProcessing] = useState(false);
    const [artFile, setArtFile] = useState<File | null>(null);
    const [removeArt, setRemoveArt] = useState(false);

    const [form, setForm] = useState({
        code: card?.code ?? '',
        name: card?.name ?? '',
        set_id: card?.set_id?.toString() ?? '',
        faction_id: card?.faction_id?.toString() ?? '',
        type: card?.type ?? 'unit',
        cost: card?.cost.toString() ?? '0',
        rarity: card?.rarity ?? 'common',
        power: card?.power?.toString() ?? '',
        health: card?.health?.toString() ?? '',
        keywords: card?.keywords.join(', ') ?? '',
        text: card?.text ?? '',
        effects: card ? JSON.stringify(card.effects, null, 2) : '[]',
        finish: card?.finish ?? 'standard',
        frame_variant: card?.frame_variant ?? '',
        sort: card?.sort.toString() ?? '0',
    });

    const set = (key: keyof typeof form, value: string): void => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const previewUrl = useMemo(() => {
        if (artFile) {
            return URL.createObjectURL(artFile);
        }

        if (removeArt) {
            return null;
        }

        return card?.artUrl ?? null;
    }, [artFile, removeArt, card]);

    const previewDef: CardDef | null = useMemo(() => {
        if (!form.name) {
            return null;
        }

        return {
            id: form.code || 'preview',
            set: 'admin',
            faction: 'neutral',
            name: form.name,
            type: form.type,
            rarity: form.rarity,
            cost: Number(form.cost) || 0,
            power: form.power === '' ? null : Number(form.power),
            health: form.health === '' ? null : Number(form.health),
            keywords: [],
            text: form.text || null,
            effects: [],
            finish: form.finish,
            frameVariant: 'admin',
            artUrl: previewUrl ?? null,
        };
    }, [
        form.name,
        form.type,
        form.rarity,
        form.cost,
        form.power,
        form.health,
        form.text,
        form.finish,
        previewUrl,
        form.code,
    ]);

    const submit = (): void => {
        const payload = new FormData();

        payload.append('code', form.code);
        payload.append('name', form.name);
        payload.append('set_id', form.set_id);
        payload.append('faction_id', form.faction_id);
        payload.append('type', form.type);
        payload.append('cost', form.cost);
        payload.append('rarity', form.rarity);
        payload.append('power', form.power);
        payload.append('health', form.health);
        payload.append('text', form.text);
        payload.append('effects', form.effects);
        payload.append('finish', form.finish);
        payload.append('frame_variant', form.frame_variant);
        payload.append('sort', form.sort);

        for (const keyword of form.keywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)) {
            payload.append('keywords[]', keyword);
        }

        if (artFile) {
            payload.append('art', artFile);
        }

        payload.append('remove_art', removeArt ? '1' : '0');

        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        if (editing && card) {
            router.put(admin.cards.update(card.id), payload, options);
        } else {
            router.post(admin.cards.store(), payload, options);
        }
    };

    return (
        <>
            <Head title={editing ? `Edit ${card?.name}` : 'New card'} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={admin.cards.index()}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold">
                                {editing ? 'Edit card' : 'New card'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {editing
                                    ? `Editing ${card?.code}`
                                    : 'Create a card definition.'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={submit} disabled={processing}>
                        <Check /> Save card
                    </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-4">
                        <section className="rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Identity
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Code">
                                    <Input
                                        value={form.code}
                                        onChange={(event) =>
                                            set('code', event.target.value)
                                        }
                                        placeholder="e.g. daw-sentinel"
                                    />
                                </Field>
                                <Field label="Name">
                                    <Input
                                        value={form.name}
                                        onChange={(event) =>
                                            set('name', event.target.value)
                                        }
                                        placeholder="Card name"
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
                                        <option value="">No set</option>
                                        {sets.map((set) => (
                                            <option key={set.id} value={set.id}>
                                                {set.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Faction">
                                    <select
                                        value={form.faction_id}
                                        onChange={(event) =>
                                            set(
                                                'faction_id',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                    >
                                        <option value="">Neutral</option>
                                        {factions.map((faction) => (
                                            <option
                                                key={faction.id}
                                                value={faction.id}
                                            >
                                                {faction.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </section>

                        <section className="rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Gameplay
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Field label="Type">
                                    <select
                                        value={form.type}
                                        onChange={(event) =>
                                            set('type', event.target.value)
                                        }
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                    >
                                        {TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Cost">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={form.cost}
                                        onChange={(event) =>
                                            set('cost', event.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="Rarity">
                                    <select
                                        value={form.rarity}
                                        onChange={(event) =>
                                            set('rarity', event.target.value)
                                        }
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                    >
                                        {RARITIES.map((rarity) => (
                                            <option key={rarity} value={rarity}>
                                                {rarity}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Power (units)">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={999}
                                        value={form.power}
                                        onChange={(event) =>
                                            set('power', event.target.value)
                                        }
                                        placeholder="—"
                                    />
                                </Field>
                                <Field label="Health (units)">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={999}
                                        value={form.health}
                                        onChange={(event) =>
                                            set('health', event.target.value)
                                        }
                                        placeholder="—"
                                    />
                                </Field>
                                <Field label="Sort order">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.sort}
                                        onChange={(event) =>
                                            set('sort', event.target.value)
                                        }
                                    />
                                </Field>
                            </div>

                            <Field label="Keywords" className="mt-3">
                                <Input
                                    value={form.keywords}
                                    onChange={(event) =>
                                        set('keywords', event.target.value)
                                    }
                                    placeholder="swift, bulwark, siphon (comma separated)"
                                />
                            </Field>

                            <Field label="Card text" className="mt-3">
                                <textarea
                                    value={form.text}
                                    onChange={(event) =>
                                        set('text', event.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                    placeholder="Rules text shown on the card."
                                />
                            </Field>

                            <Field label="Effects (JSON)" className="mt-3">
                                <textarea
                                    value={form.effects}
                                    onChange={(event) =>
                                        set('effects', event.target.value)
                                    }
                                    rows={8}
                                    spellCheck={false}
                                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                    placeholder='[{"trigger":"on_play","actions":[]}]'
                                />
                            </Field>
                        </section>

                        <section className="rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Appearance
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Finish">
                                    <select
                                        value={form.finish}
                                        onChange={(event) =>
                                            set('finish', event.target.value)
                                        }
                                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                                    >
                                        {FINISHES.map((finish) => (
                                            <option key={finish} value={finish}>
                                                {finish}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Frame variant">
                                    <Input
                                        value={form.frame_variant}
                                        onChange={(event) =>
                                            set(
                                                'frame_variant',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. dawnspire-legendary"
                                    />
                                </Field>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <Field label="Card art">
                                    <div className="flex items-center gap-2">
                                        <Label className="cursor-pointer rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
                                            <Upload className="mr-1 inline size-4" />
                                            {artFile ? 'Replace' : 'Upload'}
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file =
                                                        event.target.files?.[0];
                                                    setArtFile(file ?? null);

                                                    if (file) {
                                                        setRemoveArt(false);
                                                    }
                                                }}
                                            />
                                        </Label>
                                        {artFile && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setArtFile(null)}
                                            >
                                                <X /> Clear
                                            </Button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        PNG, JPG or WebP, up to 5 MB.
                                    </p>
                                </Field>

                                {editing && card?.art_url ? (
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() =>
                                                setRemoveArt((value) => !value)
                                            }
                                        >
                                            <Trash />
                                            {removeArt
                                                ? 'Keep current art'
                                                : 'Remove current art'}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-3">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Preview
                            </h3>
                            <div className="flex justify-center">
                                {previewDef ? (
                                    <CardVisual
                                        card={previewDef}
                                        size="sm"
                                        animated={false}
                                    />
                                ) : (
                                    <div className="flex h-44 w-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                                        Fill in a name
                                    </div>
                                )}
                            </div>
                            {previewDef?.artUrl && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {removeArt
                                        ? 'Art will be removed on save.'
                                        : 'Current uploaded art is shown on the card.'}
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    className,
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={cn('block', className)}>
            <span className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            {children}
        </label>
    );
}

AdminCardEdit.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: admin.cards.index(),
        },
        {
            title: 'Cards',
            href: admin.cards.index(),
        },
        {
            title: 'Card editor',
            href: undefined,
        },
    ],
};
