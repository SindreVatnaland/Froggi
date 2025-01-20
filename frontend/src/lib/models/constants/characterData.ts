interface CharacterMap {
    [key: string | number]: string | number
}

export const CHARACTERS: CharacterMap = {
    "captain falcon": 0,
    0: "captain falcon",
    "donkey kong": 1,
    1: "Donkey Kong",
    "fox": 2,
    2: "Fox",
    "game and watch": 3,
    3: "Mr. Game & Watch",
    "kirby": 4,
    4: "Kirby",
    "bowser": 5,
    5: "Bowser",
    "link": 6,
    6: "Link",
    "luigi": 7,
    7: "Luigi",
    "mario": 8,
    8: "Mario",
    "marth": 9,
    9: "Marth",
    "mewtwo": 10,
    10: "Mewtwo",
    "ness": 11,
    11: "Ness",
    "peach": 12,
    12: "Peach",
    "pikachu": 13,
    13: "Pikachu",
    "ice climbers": 14,
    14: "Ice Climbers",
    "jigglypuff": 15,
    15: "Jigglypuff",
    "samus": 16,
    16: "Samus",
    "yoshi": 17,
    17: "Yoshi",
    "zelda": 18,
    18: "Zelda",
    "sheik": 19,
    19: "Sheik",
    "falco": 20,
    20: "Falco",
    "young link": 21,
    21: "Young Link",
    "dr mario": 22,
    22: "Dr. Mario",
    "roy": 23,
    23: "Roy",
    "pichu": 24,
    24: "Pichu",
    "ganondorf": 25,
    25: "Ganondorf"
}

export enum Character {
    "Captain Falcon" = 0,
    "Donkey kong" = 1,
    "Fox" = 2,
    "Game and Watch" = 3,
    "Kirby" = 4,
    "Bowser" = 5,
    "Link" = 6,
    "Luigi" = 7,
    "Mario" = 8,
    "Marth" = 9,
    "Mewtwo" = 10,
    "Ness" = 11,
    "Peach" = 12,
    "Pikachu" = 13,
    "Ice climbers" = 14,
    "Jigglypuff" = 15,
    "Samus" = 16,
    "Yoshi" = 17,
    "Zelda" = 18,
    "Sheik" = 19,
    "Falco" = 20,
    "Young Link" = 21,
    "Dr Mario" = 22,
    "Roy" = 23,
    "Pichu" = 24,
    "Ganondorf" = 25,
}

export const VISUAL_CHARACTER_MAP: { [key: string]: number } = {
    // Falcon
    "C.F": 0,
    "C F": 0,
    "CON": 0,
    // DK
    "DK": 1,
    "D K": 1,
    "D.K": 1,
    // Fox
    "FOX": 2,
    "F O X": 2,
    "F O": 2,
    "O X": 2,
    // Mr. Game & Watch
    "MR": 3,
    "GAME": 3,
    "WAT": 3,
    // Kirby
    "KIR": 4,
    "IRB": 4,
    // Bowser
    "BOW": 5,
    "OWS": 5,
    "SER": 5,
    // Young Link
    "UNG": 21,
    "NGL": 21,
    // Link
    "LIN": 6,
    "INK": 6,
    // Luigi
    "LUI": 7,
    // Dr. Mario
    "DR": 22,
    "R.M": 22,
    // Mario
    "MARI": 8,
    // Marth
    "MARTH": 9,
    // Mewtwo
    "MEW": 10,
    // Ness
    "NES": 11,
    // Peach
    "PEACH": 12,
    // Pikachu
    "PIK": 13,
    "KAC": 13,
    // Ice Climbers
    "ICE": 14,
    "CLIMBERS": 14,
    "CLIM": 14,
    "IMB": 14,
    // Jigglypuff
    "JIG": 15,
    "IGG": 15,
    "GLY": 15,
    "PUF": 15,
    // Samus
    "SAM": 16,
    "AMU": 16,
    "MUS": 16,
    // Yoshi
    "YOS": 17,
    "SHI": 17,
    "OSH": 17,
    // Zelda
    "ZEL": 18,
    "ELD": 18,
    // Sheik
    "SHE": 19,
    "HEI": 19,
    // Falco
    "FAL": 20,
    "ALC": 20,
    // Roy
    "OY": 23,
    "RO": 20,
    // Pichu
    "PIC": 24,
    "ICH": 24,
    // Ganondorf
    "GAN": 25,
    "DOR": 25,
    "NON": 25,
}


interface CharacterExternalSeriesMap {
    [key: number]: string
}
export const CHARACTERS_SERIES: CharacterExternalSeriesMap = {
    0: "FZero",
    1: "DK",
    2: "StarFox",
    3: "Game&Watch",
    4: "Kirby",
    5: "Mario",
    6: "Zelda",
    7: "Mario",
    8: "Mario",
    9: "FireEmblem",
    10: "Pokemon",
    11: "Earthbound",
    12: "Mario",
    13: "Pokemon",
    14: "IceClimbers",
    15: "Pokemon",
    16: "Metroid",
    17: "Yoshi",
    18: "Zelda",
    19: "Zelda",
    20: "StarFox",
    21: "Zelda",
    22: "Mario",
    23: "FireEmblem",
    24: "Pokemon",
    25: "Zelda"
}

interface CharacterInternalExternalMap {
    [key: number]: number
}

export const CHARACTERS_EXTERNAL_INTERNAL: CharacterInternalExternalMap = {
    0x00: 0x02,
    0x01: 0x03,
    0x02: 0x01,
    0x03: 0x18,
    0x04: 0x04,
    0x05: 0x05,
    0x06: 0x06,
    0x07: 0x11,
    0x08: 0x00,
    0x09: 0x12,
    0x0A: 0x10,
    0x0B: 0x08,
    0x0C: 0x09,
    0x0D: 0x0C,
    0x0E: 0x0A,
    0x0F: 0x0F,
    0x10: 0x0D,
    0x11: 0x0E,
    0x12: 0x13,
    0x13: 0x07,
    0x14: 0x16,
    0x15: 0x14,
    0x16: 0x15,
    0x17: 0x1A,
    0x18: 0x17,
    0x19: 0x19
}

export const CHARACTERS_INTERNAL_EXTERNAL: CharacterInternalExternalMap = {
    0x00: 0x08,
    0x01: 0x02,
    0x02: 0x00,
    0x03: 0x01,
    0x04: 0x04,
    0x05: 0x05,
    0x06: 0x06,
    0x07: 0x13,
    0x08: 0x0B,
    0x09: 0x0C,
    0x0A: 0x0E,
    0x0C: 0x0D,
    0x0D: 0x10,
    0x0E: 0x11,
    0x0F: 0x0F,
    0x10: 0x0A,
    0x11: 0x07,
    0x12: 0x09,
    0x13: 0x12,
    0x14: 0x15,
    0x15: 0x16,
    0x16: 0x14,
    0x17: 0x18,
    0x18: 0x03,
    0x19: 0x19,
    0x1A: 0x17,
}

