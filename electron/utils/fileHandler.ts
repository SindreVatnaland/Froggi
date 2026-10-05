import path from "path";
import fs from "fs"
import { ShareCustomFiles } from "../../frontend/src/lib/models/types/overlay";

function base64ToFile(base64String: string, filePath: string) {
    const fileBuffer = Buffer.from(base64String, 'base64');
    const dir = path.dirname(filePath);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, fileBuffer);
}

export const saveCustomFiles = (customFileDir: string, customFiles: ShareCustomFiles) => {
    Object.entries(customFiles).forEach((customFile) => {
        const [dir, files] = customFile;
        files.forEach(file => {
            const absoluteDir = path.join(customFileDir, dir, file.fileName)
            base64ToFile(file.base64, absoluteDir)
        })
    })
}

export function findFilesStartingWith(dir: string, prefix: string) {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Recurse into subdirectories
            results = results.concat(findFilesStartingWith(fullPath, prefix));
        } else {
            // Check if file name starts with the given prefix
            if (entry.name.startsWith(prefix)) {
                results.push(fullPath);
            }
        }
    }

    return results;
}