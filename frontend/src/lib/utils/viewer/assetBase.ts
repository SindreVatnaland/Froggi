/**
 * Where the replay / live viewer loads its files from (animations, stock icons). '' = the app's own server — the
 * app never changes it. The GitHub Pages embed (frontend/site-viewer) points it at its own folder.
 */
let base = '';
export const setViewerAssetBase = (url: string) => (base = url.replace(/\/$/, ''));
export const viewerAsset = (path: string) => base + path;
