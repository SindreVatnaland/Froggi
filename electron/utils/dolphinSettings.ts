import path from "path";
import os from "os";
import fs from "fs";
import ini from 'ini';
import { DolphinSettings, DolphinSettingsMainline } from "../../frontend/src/lib/models/types/dolphinTypes";
import getAppDataPath from "appdata-path";


export const getDolphinSettings = (isBeta: boolean): DolphinSettings | DolphinSettingsMainline | undefined => {
  const userFolder = getDolphinUserFolder(isBeta);
  const configPath = path.join(userFolder, 'Config', 'Dolphin.ini');

  if (!fs.existsSync(configPath)) {
    console.log("Dolphin settings not found at", configPath);
    return;
  }
  const iniContent = fs.readFileSync(configPath, 'utf8');
  let config = ini.parse(iniContent) as DolphinSettings | DolphinSettingsMainline;
  //config = fixMissingDolphinSettings(config, configPath);
  return config;
}

const getDolphinUserFolder = (isBeta: boolean): string => {
  const betaSuffix = isBeta ? "-beta" : "";
  const installationFolder = path.join(getAppDataPath('Slippi Launcher'), `netplay${betaSuffix}`);
  switch (process.platform) {
    case "win32": {
      return path.join(installationFolder, "User");
    }
    case "darwin": {
      const configPath = getAppDataPath(`com.project-slippi.dolphin`);
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

// Using forced port could help with packet capturing in the future.
// @ts-ignore
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