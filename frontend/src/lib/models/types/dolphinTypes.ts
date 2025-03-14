
export interface DolphinSettingsMainline {
    Slippi: Slippi
}

interface Slippi {
    ForceNetplayPort: boolean
    NetplayPort: number
}

export interface DolphinSettings {
    Core: Core | undefined
}

interface Core {
    SlippiForceNetplayPort: string | boolean | undefined
    SlippiNetplayPort: number | undefined
    GFXBackend: string | undefined
    Display: Display | undefined
}

interface Display {
    Fullscreen: boolean | undefined
}