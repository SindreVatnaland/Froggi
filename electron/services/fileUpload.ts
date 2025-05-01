import { delay, inject, singleton } from "tsyringe";
import { TypedEmitter } from "../../frontend/src/lib/utils/customEventEmitter";
import { MessageHandler } from "./messageHandler";
import { ElectronLog } from "electron-log";
import { BrowserWindow, clipboard, dialog } from "electron";
import fs from "fs";
import path from "path";
import { NotificationType } from "../../frontend/src/lib/models/enum";

@singleton()
export class FileHandler {
	constructor(
		@inject('AppDir') private appDir: string,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.initEventListeners();
		this.log.info("Initializing File Upload listeners")
	}

	uploadFile = async (overlayId: string, directory: string, fileName: string, acceptedExtensions: string[]) => {
		const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
			properties: ['openFile'],
			filters: [{ name: '', extensions: acceptedExtensions }],
		});
		if (canceled) {
			this.log.warn("Uploading custom file canceled")
			return
		};
		const fileExtension = path.extname(filePaths[0]);
		const saveDir = path.join(this.appDir, "public", "custom", overlayId, directory)
		if (!fs.existsSync(saveDir)) {
			fs.mkdirSync(saveDir, { recursive: true });
		}
		const newFileName = `${fileName}${fileExtension}`
		const filePath = path.join(saveDir, newFileName);
		this.log.info("Uploading custom file to: ", filePath)
		fs.copyFileSync(filePaths[0], filePath)
		this.messageHandler.sendMessage("ImportCustomFileComplete", newFileName)
	};

	async saveLogs() {
		const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
			filters: [{ name: 'main', extensions: ['log'] }],
		});

		if (canceled) return;

		const logPath = path.join(this.appDir, "main.log");

		fs.copyFileSync(logPath, filePath)
	}

	async copyLogs() {
		const logPath = path.join(this.appDir, "main.log");

		fs.readFile(logPath, 'utf8', (err, data) => {
			if (err) {
				console.error("Error reading the log file:", err);
				return;
			}
			clipboard.writeText(data);
		});

		this.messageHandler.sendMessage("Notification", "Logs copied to clipboard", NotificationType.Success)
	}

	private initEventListeners() {
		this.clientEmitter.on("ImportCustomFile", (overlayId: string, directory: string, fileName: string, acceptedExtensions: string[]) => {
			this.uploadFile(overlayId, directory, fileName, acceptedExtensions)
		});
		this.clientEmitter.on("LogsCopy", this.copyLogs.bind(this));
		this.clientEmitter.on("LogsSave", this.saveLogs.bind(this));
	}
}
