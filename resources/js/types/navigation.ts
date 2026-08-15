import type { InertiaLinkProps } from '@inertiajs/react';
import { Layers, PackageOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import admin from '@/routes/admin';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

/**
 * Admin-only navigation links. These are rendered in the sidebar only for
 * accounts with `is_admin` enabled.
 */
export const adminNavItems: NavItem[] = [
    {
        title: 'Cards',
        href: admin.cards.index(),
        icon: Layers,
    },
    {
        title: 'Boosters',
        href: admin.boosters.index(),
        icon: PackageOpen,
    },
];
