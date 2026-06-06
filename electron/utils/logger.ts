import type { ElectronLog } from 'electron-log';

/**
 * Returns a scoped logger that prefixes every line with `[label]`, so a flat
 * multi-service log file is readable per-service. `log.scope()` returns electron-log's
 * `LogFunctions`, which exposes the same info/warn/error/debug/verbose methods services
 * use — the cast keeps the existing `ElectronLog`-typed fields working without churn.
 */
export function scopedLog(log: ElectronLog, label: string): ElectronLog {
	// Guard against loggers without scope support (e.g. test mocks) — fall back to the raw logger.
	if (typeof (log as { scope?: unknown })?.scope !== 'function') return log;
	return log.scope(label) as unknown as ElectronLog;
}
