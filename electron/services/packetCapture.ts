import { ElectronLog } from "electron-log";
import { inject, singleton } from "tsyringe";
import dgram from "dgram";
import { ElectronSettingsStore } from "./store/storeSettings";
import { getDolphinPort } from "./../utils/dolphinSettings";

@singleton()
export class PacketCapture {
  private server = dgram.createSocket('udp4');
  constructor(
    @inject("ElectronLog") private log: ElectronLog,
    @inject(ElectronSettingsStore) private settingsStore: ElectronSettingsStore
  ) {
    this.startPacketCapture();
  }

  startPacketCapture(): void {
    this.log.info("Starting Packet Capture");

    const dolphinSettings = this.settingsStore.getDolphinSettings();
    if (!dolphinSettings) return;

    const port = getDolphinPort(dolphinSettings);

    this.server.on('message', (msg, rinfo) => {
      this.log.info(`Received message from ${rinfo.address}:${rinfo.port}`);
      this.log.info(`Message: ${msg}`);
    });

    this.server.bind(port);
  }

  stopPacketCapture(): void {
    this.log.info("Stopping Packet Capture");
    this.server.close();
  }
}
