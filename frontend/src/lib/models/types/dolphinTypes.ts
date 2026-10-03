
export interface DolphinSettingsMainline {
    Slippi: Slippi
}

interface Slippi {
    ForceNetplayPort: boolean
    NetplayPort: number
    ReplayDir?: string
}

export interface DolphinSettings {
    Core: Core | undefined
}

interface Core {
    SlippiForceNetplayPort: string | boolean | undefined
    SlippiNetplayPort: number | undefined
    SlippiReplayDir?: string
    GFXBackend: string | undefined
    Display: Display | undefined
}

interface Display {
    Fullscreen: boolean | undefined
}