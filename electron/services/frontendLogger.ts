import { ElectronLog } from "electron-log";
import { inject, singleton } from "tsyringe";
import { TypedEmitter } from "../../frontend/src/lib/utils/customEventEmitter";

@singleton()
export class FrontendLogger {
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
	) {
		this.log.info('Initializing Frontend Logger');
		this.initListeners();

	}
	initListeners() {
		this.log.info('Init frontend logging');
		this.clientEmitter.on("Log", (message: string, severity: "info" | "warn" | "error") => {
			this.log[severity](`Frontend Log: ${message}`)
		})
	}
}
