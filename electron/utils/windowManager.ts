const { spawn } = require("child_process");

export function getWindowSize(pid: number): Promise<{ width: number, height: number }> {
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
        ps.stdout.on("data", (data: any) => {
            output += data.toString().trim();
        });

        ps.stderr.on("data", (data: any) => {
            reject(`Error: ${data.toString()}`);
        });

        ps.on("close", (code: number) => {
            if (code === 0 && output !== "Error") {
                const [width, height] = output.split("x").map(Number);
                resolve({ width, height });
            } else {
                reject({ width: 1920, height: 1080 });
            }
        });
    });
}

