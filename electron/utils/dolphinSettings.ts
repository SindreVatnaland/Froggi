import path from "path";
import os from "os";
import fs from "fs";
import { app } from "electron";
import ini from 'ini';
import { DolphinSettings, DolphinSettingsMainline } from "../../frontend/src/lib/models/types/dolphinTypes";


export const getDolphinSettings = (isBeta: boolean): DolphinSettings | DolphinSettingsMainline | undefined => {
  const userFolder = getDolphinUserFolder(isBeta);
  const configPath = path.join(userFolder, 'Config', 'Dolphin.ini');

  if (!fs.existsSync(configPath)) {
    return;
  }
  const iniContent = fs.readFileSync(configPath, 'utf8');
  let config = ini.parse(iniContent) as DolphinSettings | DolphinSettingsMainline;
  config = fixMissingDolphinSettings(config, configPath);
  return config;
}

const getDolphinUserFolder = (isBeta: boolean): string => {
  const betaSuffix = isBeta ? "-beta" : "";
  const installationFolder = path.join(app.getPath("userData"), `netplay${betaSuffix}`);
  switch (process.platform) {
    case "win32": {
      return path.join(installationFolder, "User");
    }
    case "darwin": {
      const configPath = path.join(os.homedir(), "Library", "Application Support", `com.project-slippi.dolphin`);
      const userFolderName = `netplay${betaSuffix}/User`;

      return path.join(configPath, userFolderName);
    }
    case "linux": {
      const configPath = path.join(os.homedir(), ".config");
      const userFolderName =
        `slippi-dolphin/netplay${betaSuffix}`
      return path.join(configPath, userFolderName);
    }
    default:
      throw new Error(`Unsupported operating system: ${process.platform}`);
  }
}

const fixMissingDolphinSettings = (config: DolphinSettings | DolphinSettingsMainline, configPath: string): DolphinSettings | DolphinSettingsMainline => {
  if ("Slippi" in config) {
    if (!(JSON.parse(`${config.Slippi.ForceNetplayPort}`.toLocaleLowerCase()))) {
      config.Slippi.ForceNetplayPort = true;
    }
    if (!config.Slippi.NetplayPort) {
      config.Slippi.NetplayPort = 2626;
    }
  } else if ("Core" in config) {
    if (!(JSON.parse(`${config.Core.SlippiForceNetplayPort}`.toLocaleLowerCase()))) {
      config.Core.SlippiForceNetplayPort = true;
    }
    if (!config.Core.SlippiNetplayPort) {
      config.Core.SlippiNetplayPort = 2626;
    }
  }


  fs.writeFileSync(configPath, ini.stringify(config));
  return config;
}

export const getDolphinPort = (config: DolphinSettings | DolphinSettingsMainline): number | undefined => {
  if ("Slippi" in config) {
    return config.Slippi.NetplayPort;
  } else if ("Core" in config) {
    return config.Core.SlippiNetplayPort;
  }
  return;
}