import os from 'os';
import find from 'find-process';
import child_process, { ExecException } from 'child_process';

export const getProcessPid = async (): Promise<number | undefined> => {
	const validProcesses = getValidProcesses();

	for (const processName of validProcesses) {
		const processes = await find('name', processName);

		if (processes.length > 0) {
			return processes[0].pid;
		}
	}

	return undefined;
};

export const isDolphinRunning = async () => {
	const isWindows = os.platform() === 'win32';
	const validProcesses = getValidProcesses();
	const exec = child_process.exec;
	const shell = isWindows ? 'powershell.exe' : '/bin/bash';

	const windowsCommand = `
		try { 
			Get-CimInstance Win32_Process | Select-Object -ExpandProperty Name
		} catch { 
			tasklist /FO CSV | ForEach-Object { $_ -split ',' } | ForEach-Object { $_ -replace '"', '' }
		}
	`;
	const linuxCommand = `ps -e -o comm=`;

	const command = isWindows ? windowsCommand : linuxCommand;

	return new Promise((resolve) => {
		exec(command, { shell }, (_: ExecException | null, stdout: string) => {
			if (!stdout.trim()) {
				console.log("stdout:", stdout);
				console.log("Dolphin is not running");
				return resolve(false);
			}

			const runningProcesses = stdout
				.split('\n')
				.map(line => line.trim().toLowerCase())
				.filter(Boolean);

			for (const process of validProcesses) {
				if (runningProcesses.some(p => p.includes(process.toLowerCase()))) {
					console.log(`Dolphin is running: ${process}`);
					return resolve(true);
				}
			}

			console.log("Dolphin is not running");
			resolve(false);
		});
	});
};

const getValidProcesses = (): string[] => {
	if (os.platform() === 'win32')
		return [
			'Dolphin.exe',
			'Slippi_Dolphin.exe',
			'Slippi Dolphin.exe',
			'Citrus Dolphin.exe',
			'DolphinWx.exe',
			'DolphinQt2.exe',
		];
	if (os.platform() === 'linux')
		return [
			'AppRun',
			'AppRun.wrapped',
			'dolphin-emu',
			'dolphin-emu-qt2',
			'dolphin-emu-wx',
			'launch-fm',
			'slippi-r18-netplay',
			'slippi-r16-netplay',
			'slippi-r11-netplay',
			'slippi-r10-netplay',
		];
	if (os.platform() === 'darwin')
		return [
			'Slippi Dolphin.app',
			'Slippi Dolphin',
			'Slippi_Dolphin.app',
			'Slippi_Dolphin',
		];
	return [];
};
