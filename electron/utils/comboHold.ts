/**
 * Fires a button combo only after it has been HELD for `holdMs` (input arrives only when buttons
 * change, so a timer checks the combo is still held), then waits `cooldownMs` before anything can
 * fire again. Feed it the currently pressed combo (key) on every input change; null = nothing held.
 */
export class ComboHold {
	private current: string | null = null;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private cooldownUntil = 0;

	constructor(private holdMs = 500, private cooldownMs = 1000) {}

	update(key: string | null, fire: () => void) {
		if (key === this.current) return; // same combo still held — the pending timer decides
		this.current = key;
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
		if (!key || Date.now() < this.cooldownUntil) return;
		this.timer = setTimeout(() => {
			this.timer = null;
			if (this.current !== key) return;
			this.cooldownUntil = Date.now() + this.cooldownMs;
			fire();
		}, this.holdMs);
	}
}

/** Stable key for the pressed buttons ("isLPressed+isRPressed"), or null when none are pressed. */
export const comboKey = (buttons: Record<string, boolean> | undefined): string | null => {
	const pressed = Object.entries(buttons ?? {}).filter(([, on]) => on).map(([k]) => k).sort();
	return pressed.length ? pressed.join('+') : null;
};
