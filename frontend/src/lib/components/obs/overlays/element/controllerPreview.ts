import { writable, type Writable } from 'svelte/store';

/** Context key: the style window (ElementModal) shares a store so its preview can show the pressed look. */
export const CONTROLLER_PREVIEW = 'controllerPreviewPressed';
export type ControllerPreview = Writable<boolean>;
export const controllerPreviewStore = (): ControllerPreview => writable(false);
