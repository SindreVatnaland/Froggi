// Tailwind for the site viewer only: just the utilities the viewer's own files use, scoped under .viewer so they
// can't touch the rest of the GitHub Pages site (no preflight / base styles).
module.exports = {
	content: [
		'src/lib/components/viewer/**/*.svelte',
		'src/lib/components/obs/overlays/element/inGame/StageRender.svelte',
		'src/lib/utils/viewer/**/*.ts',
	],
	important: '.viewer',
	corePlugins: { preflight: false },
};
