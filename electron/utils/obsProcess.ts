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

const possibleWinConfigPaths
	= ['plugin_config/obs-websocket/config.json', 'plugin_config/obs-websocket/config.json'];

export const getObsWebsocketConfig = (): ObsWebsocketConfig | undefined => {
	const isWindows = os.platform() === 'win32';
	const isMac = os.platform() === 'darwin';
	const isLinux = os.platform() === 'linux';
	const appDataPath = getAppDataPath('obs-studio');
	if (isWindows) {
		for (const relativePath of possibleWinConfigPaths) {
			const configPath = path.join(appDataPath, relativePath);
			if (!fs.existsSync(configPath)) continue;
			try {
				const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as ObsWebsocketConfig;
				return config;
			} catch (err) {
				console.error(err);
				continue;
			}
		}
	}

	if (isMac || isLinux) {
		const configPath = path.join(appDataPath, 'global.ini');
		if (!fs.existsSync(configPath)) return;
		const iniContent = fs.readFileSync(configPath, 'utf8');
		const config = ini.parse(iniContent);

		if (config.OBSWebSocket) {
			return Object.entries(config.OBSWebSocket as ObsWebsocketConfig).reduce((acc, [key, value]) => {
				acc[snakeCase(key) as keyof ObsWebsocketConfig] = value as never;
				return acc;
			}, {} as ObsWebsocketConfig);
		}
	}
	return;
}
