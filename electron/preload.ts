import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
	send: (channel: string, data: any) => {
		ipcRenderer.send(channel, data);
	},
	sendSync: (channel: string, data: any) => {
		ipcRenderer.sendSync(channel, data);
	},
	receive: (channel: string, func: any) => {
		ipcRenderer.on(channel, (_, ...args) => func(...args));
	},
	message: (topic: string, payload: any) => ipcRenderer.invoke('message', topic, payload),

	autoUpdater: {
		checkForUpdates: () => ipcRenderer.send('autoUpdater:check'),
		downloadUpdate: () => ipcRenderer.send('autoUpdater:download'),
		skipUpdate: () => ipcRenderer.send('autoUpdater:skipUpdate'),
		onStatus: (callback: (status: string) => void) =>
			ipcRenderer.on('autoUpdater:status', (_, status) => callback(status)),
		onProgress: (callback: (progress: number) => void) =>
			ipcRenderer.on('autoUpdater:progress', (_, progress) => callback(progress)),
	},

});
