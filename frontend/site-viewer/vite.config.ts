import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Standalone build of the site viewer (site-viewer/main.ts) → docs/viewer/viewer.js. Run via `npm run site:viewer`.
const lib = path.resolve(__dirname, '../src/lib');
export default defineConfig({
	plugins: [svelte({ emitCss: false })],
	// The viewer's Tailwind classes (e.g. -scale-y-100 flips the game's y axis) → docs/viewer/style.css.
	css: { postcss: { plugins: [tailwindcss({ config: path.resolve(__dirname, 'tailwind.config.cjs') }), autoprefixer()] } },
	resolve: {
		alias: [
			{ find: /^\$lib\/utils\/store\.svelte$/, replacement: path.resolve(__dirname, 'storeShim.ts') },
			{ find: '$lib', replacement: lib },
		],
	},
	build: {
		outDir: path.resolve(__dirname, '../../docs/viewer'),
		emptyOutDir: true,
		lib: { entry: path.resolve(__dirname, 'main.ts'), formats: ['es'], fileName: () => 'viewer.js' },
		minify: true,
	},
});
