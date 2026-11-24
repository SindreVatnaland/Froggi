import { writable } from 'svelte/store';

// The site viewer always passes frames in; StageRender only falls back to the app's live gameFrame store, so the
// standalone build gets this stand-in instead of the whole app store (which needs SvelteKit).
export const gameFrame = writable(null);
