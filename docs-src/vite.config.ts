import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(__dirname);

export default defineConfig({
    root,
    base: '/a-sandbox/',
    build: {
        outDir: resolve(root, '../docs'),
        emptyOutDir: true,
    },
});
