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
    console.log("Listening on port", port);
    this.server.on('message', this.handleMessage);
    this.server.bind(port, "0.0.0.0");
  }

  stopPacketCapture(): void {
    this.log.info("Stopping Packet Capture");
    this.server.off("message", this.handleMessage);
  }

  private handleMessage(message: Buffer, rinfo: dgram.RemoteInfo): void {
    this.log.info(`Received message from ${rinfo.address}:${rinfo.port}`);
    this.log.info(`Message: ${message}`);
  }

  // For testing purposes
  public close(): void {
    this.server.close();
  }
}
