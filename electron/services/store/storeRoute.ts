import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import type { BrowserWindow, IpcMain } from 'electron';
import { scopedLog } from '../../utils/logger';

/**
 * Tracks which route the desktop app's main window is currently showing, for the local
 * MCP server's route-awareness. Deliberately bypasses MessageEvents/clientEmitter — that
 * pipeline conflates trusted local IPC with untrusted remote WebSocket clients (both feed
 * the same clientEmitter.emit()), so a remote viewer could otherwise spoof "user is on the
 * overlay editor" and hijack write-tool targeting. This channel is IPC-only, and further
 * checked against the DI-registered main window's webContents id as defense-in-depth
 * (the update window shares the same preload and could technically reach this channel too).
 */
@singleton()
export class ElectronRouteStore {
	private currentRoute = '/';

	constructor(
		@inject('IpcMain') private ipcMain: IpcMain,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject('ElectronLog') private log: ElectronLog,
	) {
		this.log = scopedLog(this.log, 'Route');
		this.ipcMain.on('route-change', (event, path: unknown) => {
			if (event.sender.id !== this.mainWindow.webContents.id) {
				this.log.warn('route-change: rejected message from unexpected sender', event.sender.id);
				return;
			}
			if (typeof path === 'string') this.currentRoute = path;
		});
	}

	getCurrentRoute(): string {
		return this.currentRoute;
	}
}
