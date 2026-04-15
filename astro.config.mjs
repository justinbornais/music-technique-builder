// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    integrations: [react()],
    vite: {
        optimizeDeps: {
            exclude: [
                '@myriaddreamin/typst.ts',
                '@myriaddreamin/typst.ts/contrib/snippet',
                '@myriaddreamin/typst-ts-renderer',
                '@myriaddreamin/typst-ts-web-compiler',
            ],
        },
        worker: {
            format: 'es',
        },
    },
});
