
export interface DolphinSettings {
    Core: Core
}

export interface DolphinSettingsMainline {
    Slippi: Slippi
}

interface Core {
    SlippiForceNetplayPort: boolean
    SlippiNetplayPort: number
}

interface Slippi {
    ForceNetplayPort: boolean
    NetplayPort: number
}