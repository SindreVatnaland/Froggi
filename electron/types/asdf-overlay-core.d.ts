// Ambient declarations for @asdf-overlay/core (Windows-only optional package).
// Allows TypeScript to type-check on non-Windows platforms without the package installed.
declare module '@asdf-overlay/core' {
	export type PercentLength = {
		ty: 'percent' | 'length';
		value: number;
	};

	export type GpuLuid = {
		low: number;
		high: number;
	};

	export declare class Overlay {
		static attach(dllDir: string, pid: number, timeout?: number): Promise<Overlay>;
		destroy(): void;
		setPosition(id: number, x: PercentLength, y: PercentLength): Promise<void>;
		setAnchor(id: number, x: PercentLength, y: PercentLength): Promise<void>;
		event: {
			once(event: 'added', listener: (id: number, width: number, height: number, luid: GpuLuid) => void): void;
			on(event: 'resized', listener: (id: number, width: number, height: number) => void): void;
			on(event: 'disconnected', listener: () => void): void;
		};
	}

	export function defaultDllDir(): string;
	export function percent(value: number): PercentLength;
	export function length(value: number): PercentLength;
}
