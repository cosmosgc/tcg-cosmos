import { useCallback, useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import {
    FACTION_COLORS,
    KEYWORD_LABELS,
    RARITY_COLORS,
} from '@/lib/game/theme';
import type { CardDef } from '@/lib/game/types';
import { cn } from '@/lib/utils';

export type CardVisualSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<CardVisualSize, string> = {
    xs: 'w-24',
    sm: 'w-32',
    md: 'w-44',
    lg: 'w-64',
};

const TYPE_LABELS: Record<CardDef['type'], string> = {
    unit: 'Unit',
    action: 'Action',
    equipment: 'Equipment',
    leader: 'Leader',
};

interface CardVisualProps {
    card: CardDef;
    size?: CardVisualSize;
    interactive?: boolean;
    animated?: boolean;
    selected?: boolean;
    dimmed?: boolean;
    factionColors?: Record<string, string>;
    className?: string;
}

export function CardVisual({
    card,
    size = 'md',
    interactive = false,
    animated = true,
    selected = false,
    dimmed = false,
    factionColors,
    className,
}: CardVisualProps) {
    const ref = useRef<HTMLElement>(null);
    const rarityColor = RARITY_COLORS[card.rarity];
    const factionColor =
        (factionColors ?? FACTION_COLORS)[card.faction] ??
        FACTION_COLORS.neutral;

    const handlePointerMove = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            const el = ref.current;

            if (!el) {
                return;
            }

            const rect = el.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            el.style.setProperty('--pointer-x', `${x * 100}%`);
            el.style.setProperty('--pointer-y', `${y * 100}%`);
            el.style.setProperty('--rotate-y', `${(x - 0.5) * 8}deg`);
            el.style.setProperty('--rotate-x', `${(0.5 - y) * 8}deg`);
        },
        [],
    );

    const handlePointerLeave = useCallback(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        el.style.setProperty('--pointer-x', '50%');
        el.style.setProperty('--pointer-y', '50%');
        el.style.setProperty('--rotate-x', '0deg');
        el.style.setProperty('--rotate-y', '0deg');
    }, []);

    return (
        <article
            ref={ref}
            className={cn('tcg-card', SIZE_CLASSES[size], className)}
            style={
                {
                    '--rarity-color': rarityColor,
                    '--faction-color': factionColor,
                } as CSSProperties
            }
            data-finish={card.finish}
            data-interactive={interactive ? 'true' : undefined}
            data-animated={animated ? 'true' : undefined}
            data-selected={selected ? 'true' : undefined}
            data-dimmed={dimmed ? 'true' : undefined}
            onPointerMove={interactive ? handlePointerMove : undefined}
            onPointerLeave={interactive ? handlePointerLeave : undefined}
        >
            <header className="flex items-center gap-1 border-b border-white/10 bg-black/40 px-1.5 py-1">
                <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                    style={{ background: rarityColor }}
                    aria-label={
                        card.type === 'leader' ? 'Leader' : `Cost ${card.cost}`
                    }
                >
                    {card.type === 'leader' ? 'L' : card.cost}
                </span>
                <span className="truncate text-[11px] leading-none font-semibold tracking-wide text-white">
                    {card.name}
                </span>
            </header>

            <div className="tcg-card__art aspect-[7/4]">
                {card.artUrl ? (
                    <img
                        src={card.artUrl}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : (
                    <div
                        className="flex size-full items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${factionColor}33, ${factionColor}66 45%, ${factionColor}dd)`,
                        }}
                    >
                        <span
                            className="text-4xl font-black uppercase opacity-50"
                            style={{ color: factionColor }}
                            aria-hidden="true"
                        >
                            {card.name.charAt(0)}
                        </span>
                    </div>
                )}
                <div className="tcg-card__foil" aria-hidden="true" />
            </div>

            <div className="flex flex-1 flex-col gap-1 p-1.5">
                <div className="flex items-center justify-between text-[9px] font-semibold tracking-wider text-white/55 uppercase">
                    <span>
                        {TYPE_LABELS[card.type]} · {card.rarity}
                    </span>
                    {card.faction !== 'neutral' && (
                        <span
                            className="truncate"
                            style={{ color: factionColor }}
                        >
                            {card.faction}
                        </span>
                    )}
                </div>

                {card.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {card.keywords.map((keyword) => (
                            <span
                                key={keyword}
                                className="rounded-sm px-1 py-px text-[8px] font-bold tracking-wider uppercase"
                                style={{
                                    background: `${factionColor}2b`,
                                    color: factionColor,
                                }}
                            >
                                {KEYWORD_LABELS[keyword] ?? keyword}
                            </span>
                        ))}
                    </div>
                )}

                {card.text && (
                    <p className="text-[9px] leading-snug text-white/80">
                        {card.text}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-end gap-1.5 pt-1">
                    {card.type === 'unit' && (
                        <>
                            <span className="rounded-sm bg-red-500/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {card.power}
                            </span>
                            <span className="rounded-sm bg-emerald-600/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {card.health}
                            </span>
                        </>
                    )}
                    {card.type === 'equipment' && (
                        <>
                            <span className="rounded-sm bg-red-500/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                +{card.power ?? 0}
                            </span>
                            <span className="rounded-sm bg-emerald-600/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                +{card.health ?? 0}
                            </span>
                        </>
                    )}
                    {card.type === 'leader' && (
                        <span className="rounded-sm bg-emerald-600/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {card.health}
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
