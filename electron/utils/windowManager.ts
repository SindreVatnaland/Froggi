import { spawn } from "child_process";
import { ProcessInfo } from "../../frontend/src/lib/models/types/injectorTypes";

export function getWindowSizeByPid(pid: number): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
        const psScript = `
        $hWnd = (Get-Process -Id ${pid}).MainWindowHandle;
        if ($hWnd -eq 0) { Write-Output "Error"; exit }
        Add-Type -Name User32 -Namespace WinAPI -MemberDefinition '
            [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
            public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
        ';
        $rect = New-Object WinAPI.User32+RECT;
        if ([WinAPI.User32]::GetWindowRect($hWnd, [ref]$rect)) {
            Write-Output "$(($rect.Right - $rect.Left))x$(($rect.Bottom - $rect.Top))"
        } else {
            Write-Output "Error"
        }`;

        const ps = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript]);

        let output = "";
        ps.stdout.on("data", (data) => {
            output += data.toString().trim();
        });

        ps.stderr.on("data", (data) => {
            reject(`Error: ${data.toString()}`);
        });

        ps.on("close", (code: number) => {
            if (code === 0 && output !== "Error") {
                const [width, height] = output.split("x").map(Number);
                resolve({ width, height });
            } else {
                reject(`Failed to get window size. Code: ${code} Output: ${output}`);
            }
        });
    });
}

export function getProcessByPid(pid: number): Promise<ProcessInfo | null> {
    return new Promise((resolve, reject) => {
        try {
            const psScript = `Get-Process -Id ${pid} | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json`;
            const ps = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript]);

            let output = "";
            ps.stdout.on("data", (data) => {
                output += data.toString();
            });

            ps.stderr.on("data", (data) => {
                const errorMessage = data.toString();
                reject("PowerShell Error:" + errorMessage);
            });

            ps.on("close", (code) => {
                if (code === 0 && output) {
                    try {
                        const processInfo: ProcessInfo = JSON.parse(output.trim());
                        resolve(processInfo);
                    } catch (err) {
                        reject("Failed to parse process info" + err);
                    }
                } else {
                    reject("Failed to parse process info. Code: " + code + " Output: " + output);
                }
            });

        } catch (error) {
            reject("Unexpected error:" + error);
        }
    });
}


export function getProcessByName(name: string): Promise<ProcessInfo | null> {
    return new Promise((resolve, reject) => {
        try {
            const psScript = `Get-Process | Where-Object { $_.ProcessName -match "(?i)${name}" } | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json`;
            const ps = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript]);

            let output = "";
            ps.stdout.on("data", (data) => {
                output += data.toString();
            });

            ps.stderr.on("data", (data) => {
                const errorMessage = data.toString();
                reject("PowerShell Error:" + errorMessage);
            });

            ps.on("close", (code) => {
                if (code === 0 && output) {
                    try {
                        const processInfo: ProcessInfo = JSON.parse(output.trim());
                        resolve(processInfo);
                    } catch (err) {
                        reject("Failed to parse process info" + err);
                    }
                } else {
                    reject("Failed to parse process info. Code: " + code + " Output: " + output);
                }
            });

        } catch (error) {
            reject("Unexpected error:" + error);
        }
    });
}
