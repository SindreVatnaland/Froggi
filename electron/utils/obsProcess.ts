import os from 'os';
import child_process, { ExecException } from 'child_process';
import getAppDataPath from 'appdata-path';
import path from 'path';
import fs from 'fs';
import { ObsWebsocketConfig } from '../../frontend/src/lib/models/types/obsTypes';
import ini from 'ini';
import { snakeCase } from 'lodash';


export const isObsRunning = async () => {
	const isWindows = os.platform() === 'win32';
	const validProcesses = ['obs64.exe', 'obs64', 'obs'];
	const exec = child_process.exec;
	const command = isWindows
		? `tasklist /FO CSV`
		: `ps -e -o comm=`;
	const shell = isWindows ? 'powershell.exe' : '/bin/bash';

	return await new Promise((resolve) => {
		exec(command, { shell: shell }, (_: ExecException | null, stdout: string) => {
			if (stdout) {
				const lines = stdout.split('\n').map(line => line.toLowerCase());
				for (const process of validProcesses) {
					if (lines.some(line => line.includes(process.toLowerCase()))) {
						return resolve(true);
					}
				}
			}
			resolve(false);
		});
	});
};

const JSON_CONFIG_RELATIVE = 'plugin_config/obs-websocket/config.json';

const readJsonConfig = (basePath: string): ObsWebsocketConfig | undefined => {
	const configPath = path.join(basePath, JSON_CONFIG_RELATIVE);
	if (!fs.existsSync(configPath)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf8')) as ObsWebsocketConfig;
	} catch { return undefined; }
};

const writeJsonConfig = (basePath: string, config: ObsWebsocketConfig): boolean => {
	const configPath = path.join(basePath, JSON_CONFIG_RELATIVE);
	if (!fs.existsSync(configPath)) return false;
	try {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
		return true;
	} catch { return false; }
};

const readIniConfig = (basePath: string): ObsWebsocketConfig | undefined => {
	const configPath = path.join(basePath, 'global.ini');
	if (!fs.existsSync(configPath)) return undefined;
	try {
		const config = ini.parse(fs.readFileSync(configPath, 'utf8'));
		if (!config.OBSWebSocket) return undefined;
		return Object.entries(config.OBSWebSocket as Record<string, unknown>).reduce((acc, [key, value]) => {
			acc[snakeCase(key) as keyof ObsWebsocketConfig] = value as never;
			return acc;
		}, {} as ObsWebsocketConfig);
	} catch { return undefined; }
};

const writeIniConfig = (basePath: string, enabled: boolean): boolean => {
	const configPath = path.join(basePath, 'global.ini');
	if (!fs.existsSync(configPath)) return false;
	try {
		const config = ini.parse(fs.readFileSync(configPath, 'utf8'));
		if (!config.OBSWebSocket) config.OBSWebSocket = {};
		config.OBSWebSocket.ServerEnabled = enabled;
		fs.writeFileSync(configPath, ini.stringify(config));
		return true;
	} catch { return false; }
};

const getObsBasePaths = (): string[] => {
	const appDataPath = getAppDataPath('obs-studio');
	if (os.platform() === 'darwin') {
		return [
			appDataPath,
			path.join(os.homedir(), 'Library/Containers/com.obsproject.obs-studio/Data/Library/Application Support/obs-studio'),
		];
	}
	return [appDataPath];
};

export const enableObsWebsocket = (): boolean => {
	for (const basePath of getObsBasePaths()) {
		// prefer JSON config (used by obs-websocket plugin and OBS 28+ on all platforms)
		const jsonCfg = readJsonConfig(basePath);
		if (jsonCfg !== undefined) {
			return writeJsonConfig(basePath, { ...jsonCfg, server_enabled: true });
		}
		// fall back to global.ini (some Linux/Mac setups)
		if (writeIniConfig(basePath, true)) return true;
	}
	return false;
};

export const getObsWebsocketConfig = (): ObsWebsocketConfig | undefined => {
	for (const basePath of getObsBasePaths()) {
		const jsonCfg = readJsonConfig(basePath);
		if (jsonCfg !== undefined) return jsonCfg;

		const iniCfg = readIniConfig(basePath);
		if (iniCfg !== undefined) return iniCfg;
	}
	return undefined;
}
