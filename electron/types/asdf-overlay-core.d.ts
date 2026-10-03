// Ambient declarations for @asdf-overlay/core + @asdf-overlay/electron 2.1.x (Windows-only optional
// packages). Lets TypeScript type-check on macOS/Linux, where npm skips them. Only what we use.
declare module '@asdf-overlay/core' {
	export type GpuLuid = { low: number; high: number };

	export type SurfaceType =
		| { type: 'Opengl'; windowId: number }
		| { type: 'Direct3D9'; windowId: number }
		| { type: 'Direct3D11'; windowId?: number }
		| { type: 'Direct3D12'; windowId?: number }
		| { type: 'Vulkan'; windowId: number };

	export interface SurfaceInfo {
		ty: SurfaceType;
		gpuId: GpuLuid;
		keyedMutex: boolean;
	}

	export type UpdateSharedHandle = { type: 'Kmt'; field0: number } | { type: 'Nt'; field0: number } | { type: 'None' };

	export interface OverlayEvents {
		on(event: 'surface_added', listener: (id: bigint, width: number, height: number, info: SurfaceInfo) => void): this;
		on(event: 'surface_resized', listener: (id: bigint, width: number, height: number) => void): this;
		on(event: 'surface_destroyed', listener: (id: bigint) => void): this;
		on(event: 'error', listener: (err: unknown) => void): this;
		on(event: 'disconnected', listener: () => void): this;
	}

	export declare class Overlay {
		static attach(dllDir: string, pid: number, timeout?: number | null): Promise<Overlay>;
		get event(): OverlayEvents;
		updateHandle(id: bigint, update: UpdateSharedHandle): Promise<void>;
		/** Overlay offset in physical pixels, no clamping. */
		setPosition(id: bigint, x: number, y: number): Promise<void>;
		detach(): void;
	}

	export function defaultDllDir(): string;
}

declare module '@asdf-overlay/electron/surface' {
	import type { WebContents } from 'electron';
	import type { Overlay, SurfaceInfo } from '@asdf-overlay/core';

	export declare class ElectronOverlaySurface {
		readonly events: { on(event: 'error', listener: (e: unknown) => void): void };
		static connect(surface: { overlay: Overlay; id: bigint; info: SurfaceInfo }, contents: WebContents, autoClose?: boolean): ElectronOverlaySurface;
		disconnect(): Promise<void>;
	}
}
