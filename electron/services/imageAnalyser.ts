import { inject, singleton } from "tsyringe";
import { createWorker } from "tesseract.js";
import * as fs from "fs";
import { ElectronLog } from "electron-log";
import { desktopCapturer, screen } from "electron";
import path from "path";
import { VISUAL_CHARACTER_MAP } from "../../frontend/src/lib/models/constants/characterData";
import sharp from "sharp";

@singleton()
export class ImageAnalyser {
  constructor(
    @inject("AppDir") private appDir: string,
    @inject("ElectronLog") private log: ElectronLog
  ) {
    this.initAnalysis();
  }

  private initAnalysis(): void {
    this.log.info("Initialize Image Analysis");
    return;
    this.analyzeWindow();
  }

  private async analyzeWindow(): Promise<void> {
    try {
      const cursorPoint = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(cursorPoint);

      if (!display) {
        this.log.error("No display found under the cursor.");
        return;
      }

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: display.bounds.width, height: display.bounds.height },
      });

      const targetSource = sources.find((source) =>
        source.display_id === display.id.toString()
      );

      if (!targetSource) {
        this.log.error("Target window not found");
        return;
      }

      this.log.info("Target window found:", targetSource.name);

      const thumbnailSize = targetSource.thumbnail.getSize();

      const meleeSize = { height: thumbnailSize.height, width: thumbnailSize.height * 73 / 60 };
      const cropX = (thumbnailSize.width - meleeSize.width) / 2;

      const meleeWindow = targetSource.thumbnail
        .crop({ x: cropX, y: 0, width: meleeSize.width, height: meleeSize.height })

      const player1Crop: Electron.Rectangle = {
        x: Math.round(meleeSize.width * 0.035),
        y: Math.round(meleeSize.height * 0.05),
        width: Math.round(meleeSize.width * 0.33),
        height: Math.round(meleeSize.height * 0.15)
      }
      const p1ConnectCodeThumbnail = meleeWindow.crop(player1Crop)

      const player2Crop: Electron.Rectangle = {
        x: Math.round(meleeSize.width * 0.63),
        y: Math.round(meleeSize.height * 0.05),
        width: Math.round(meleeSize.width * 0.33),
        height: Math.round(meleeSize.height * 0.15)
      }
      const p2ConnectCodeThumbnail = meleeWindow.crop(player2Crop)

      // Before match start - Your character
      // Remaining time - Banned stage icon
      const stageStrikeIcon1Crop: Electron.Rectangle = {
        x: Math.round(meleeSize.width * 0.042),
        y: Math.round(meleeSize.height * 0.78),
        width: Math.round(meleeSize.width * 0.116),
        height: Math.round(meleeSize.height * 0.2)
      }
      const stageStrikeIcon1Thumbnail = meleeWindow.crop(stageStrikeIcon1Crop)

      // Before match start - Opponent character
      // Remaining time - Selected stage
      const stageStrikeIcon2Crop: Electron.Rectangle = {
        x: Math.round(meleeSize.width * 0.197),
        y: Math.round(meleeSize.height * 0.78),
        width: Math.round(meleeSize.width * 0.116),
        height: Math.round(meleeSize.height * 0.2)
      }
      const stageStrikeIcon2Thumbnail = meleeWindow.crop(stageStrikeIcon2Crop)

      // Before match start - Banned stage 1
      // Remaining time - Losing player character
      const stageStrikeIcon3Crop: Electron.Rectangle = {
        x: Math.round(meleeSize.width * 0.352),
        y: Math.round(meleeSize.height * 0.78),
        width: Math.round(meleeSize.width * 0.116),
        height: Math.round(meleeSize.height * 0.2)
      }
      const stageStrikeIcon3Thumbnail = meleeWindow.crop(stageStrikeIcon3Crop)


      const imageAnalysisDir = path.join(this.appDir, "imageAnalysis");
      if (!fs.existsSync(imageAnalysisDir)) {
        fs.mkdirSync(imageAnalysisDir, { recursive: true });
      }

      const p1ConnectCodeBuffer: Buffer = p1ConnectCodeThumbnail.toPNG();
      const p1ConnectCodePath = path.join(imageAnalysisDir, "p1Buffer.png");
      this.convertToGrayScale(p1ConnectCodeBuffer, p1ConnectCodePath, 70);


      const p2ConnectCodeBuffer: Buffer = p2ConnectCodeThumbnail.toPNG();
      const p2ConnectCodePath = path.join(imageAnalysisDir, "p2Buffer.png");
      this.convertToGrayScale(p2ConnectCodeBuffer, p2ConnectCodePath, 70);


      const stageStrikeIcon1Buffer: Buffer = stageStrikeIcon1Thumbnail.toPNG();
      const stageStrikeIcon1Path = path.join(imageAnalysisDir, "stageStrikeIcon1.png");
      this.convertToGrayScale(stageStrikeIcon1Buffer, stageStrikeIcon1Path, 95);

      const stageStrikeIcon2Buffer: Buffer = stageStrikeIcon2Thumbnail.toPNG();
      const stageStrikeIcon2Path = path.join(imageAnalysisDir, "stageStrikeIcon2.png");
      this.convertToGrayScale(stageStrikeIcon2Buffer, stageStrikeIcon2Path, 95);

      const stageStrikeIcon3Buffer: Buffer = stageStrikeIcon3Thumbnail.toPNG();
      const stageStrikeIcon3Path = path.join(imageAnalysisDir, "stageStrikeIcon3.png");
      this.convertToGrayScale(stageStrikeIcon3Buffer, stageStrikeIcon3Path, 95);

      const [p1connectCodeExtracted, p2connectCodeExtracted, stageStrikeIcon1Extracted, stageStrikeIcon2Extracted, stageStrikeIcon3Extracted]: [string, string, string, string, string] = await Promise.all([
        this.extractText(p1ConnectCodePath, 5000),
        this.extractText(p2ConnectCodePath, 5000),
        this.extractText(stageStrikeIcon1Path, 5000),
        this.extractText(stageStrikeIcon2Path, 5000),
        this.extractText(stageStrikeIcon3Path, 5000)
      ]);

      const p1ConnectCode = this.extractConnectCode(p1connectCodeExtracted);
      this.log.info("Extracted Text:", p1connectCodeExtracted);
      this.log.info("Connect Code:", p1ConnectCode);

      const p2ConnectCode = this.extractConnectCode(p2connectCodeExtracted);
      this.log.info("Extracted Text:", p2connectCodeExtracted);
      this.log.info("Connect Code:", p2ConnectCode);

      const stageStrikeIcon1 = this.extractCharacterId(stageStrikeIcon1Extracted);
      this.log.info("Extracted Text:", stageStrikeIcon1Extracted);
      this.log.info("Character ID:", stageStrikeIcon1);

      const stageStrikeIcon2 = this.extractCharacterId(stageStrikeIcon2Extracted);
      this.log.info("Extracted Text:", stageStrikeIcon2Extracted);
      this.log.info("Character ID:", stageStrikeIcon2);

      const stageStrikeIcon3 = this.extractCharacterId(stageStrikeIcon3Extracted);
      this.log.info("Extracted Text:", stageStrikeIcon3Extracted);
      this.log.info("Character ID:", stageStrikeIcon3);

    } catch (error) {
      this.log.error("Error in analysis:", error);
    }
  }

  private async convertToGrayScale(imagePathInput: string | Buffer, imagePathOutput: string, threshold: number = 100) {
    await sharp(imagePathInput)
      .blur(1.1)
      .threshold(threshold)
      .toFile(imagePathOutput);
  }

  private extractConnectCode(text: string): string {
    // Connect code can have any letter or number and up to 5 characters to the left of the # and only digits to the right. Max length is 8 characters.
    const connectCodeRegex = /([a-zA-Z0-9]{1,5})#(\d{1,3})/g;
    text = text.trim();
    const matches = text.match(connectCodeRegex);
    if (matches) {
      return matches[0];
    }
    return "";
  }

  private extractCharacterId(text: string): number {
    for (const key of Object.keys(VISUAL_CHARACTER_MAP)) {
      if (!isNaN(Number(key))) continue;
      if (text.toUpperCase().includes(key.toUpperCase())) {
        return VISUAL_CHARACTER_MAP[key] as number;
      }
    }
    return -1;
  }

  private async extractText(imagePath: string, timeoutMs: number): Promise<string> {
    const worker = await createWorker();
    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      worker.load();

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(async () => {
          await worker.terminate(); // Explicitly terminate the worker
          reject(new Error("Text extraction timed out"));
        }, timeoutMs);
      });

      const tesseractPromise = worker.recognize(imagePath);
      const result = await Promise.race([tesseractPromise, timeoutPromise]);

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      // Return the extracted text
      return result.data.text;
    } catch (error) {
      this.log.error("Error extracting text:", error);
      return "";
    } finally {
      // Ensure the worker is terminated to free resources
      await worker.terminate();
    }
  }
}
