import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

// The app is served under this subdirectory by nginx
// (see /AppName/public/ handling in nginx.conf). Wayfinder generates
// root-relative route URLs, so we re-prefix them at build time.
const appBasePath = '/tcg-cosmos/public';

function listTsFiles(dir: string, files: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            listTsFiles(full, files);
        } else if (entry.name.endsWith('.ts')) {
            files.push(full);
        }
    }

    return files;
}

function prefixWayfinderRoutes(): void {
    const root = resolve(process.cwd());
    const files = [
        join(root, 'resources/js/routes/index.ts'),
        ...listTsFiles(join(root, 'resources/js/actions')),
    ];

    for (const file of files) {
        let content = readFileSync(file, 'utf8');

        content = content.replace(/url: '(\/[^']*)'/g, (match, path: string) =>
            path.startsWith(appBasePath) ? match : `url: '${appBasePath}${path}'`,
        );

        writeFileSync(file, content);
    }
}

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        {
            name: 'tcg-wayfinder-prefix',
            enforce: 'post',
            buildStart() {
                prefixWayfinderRoutes();
            },
        },
    ],
});
