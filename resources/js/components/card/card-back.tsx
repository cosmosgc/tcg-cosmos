import { cn } from '@/lib/utils';

interface CardBackProps {
    className?: string;
}

export function CardBack({ className }: CardBackProps) {
    return (
        <div
            className={cn(
                'flex aspect-[5/7] w-20 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-indigo-950 via-[#16151a] to-purple-950',
                className,
            )}
        >
            <span className="text-xs font-black tracking-[0.25em] text-white/40 uppercase">
                Cosmos
            </span>
        </div>
    );
}
