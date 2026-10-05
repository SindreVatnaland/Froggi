/**
 * Melee characters (external ids 0–25, Slippi order) and their costume (skin) names by skin id —
 * generated from @slippi/slippi-js. Skin id = the in-game costume index (characterColor). Used by
 * asset packs (one image per character per skin) and the AI assistant to explain which slot is which.
 */
export interface MeleeCharacterSkins {
	id: number;
	name: string;
	/** Costume names; index = skin id. 0 = default. */
	skins: string[];
}

export const MELEE_CHARACTER_SKINS: MeleeCharacterSkins[] = [
	{ id: 0, name: "Captain Falcon", skins: ["Default","Black","Red","White","Green","Blue"] },
	{ id: 1, name: "Donkey Kong", skins: ["Default","Black","Red","Blue","Green"] },
	{ id: 2, name: "Fox", skins: ["Default","Red","Blue","Green"] },
	{ id: 3, name: "Mr. Game & Watch", skins: ["Default","Red","Blue","Green"] },
	{ id: 4, name: "Kirby", skins: ["Default","Yellow","Blue","Red","Green","White"] },
	{ id: 5, name: "Bowser", skins: ["Default","Red","Blue","Black"] },
	{ id: 6, name: "Link", skins: ["Default","Red","Blue","Black","White"] },
	{ id: 7, name: "Luigi", skins: ["Default","White","Blue","Red"] },
	{ id: 8, name: "Mario", skins: ["Default","Yellow","Black","Blue","Green"] },
	{ id: 9, name: "Marth", skins: ["Default","Red","Green","Black","White"] },
	{ id: 10, name: "Mewtwo", skins: ["Default","Red","Blue","Green"] },
	{ id: 11, name: "Ness", skins: ["Default","Yellow","Blue","Green"] },
	{ id: 12, name: "Peach", skins: ["Default","Daisy","White","Blue","Green"] },
	{ id: 13, name: "Pikachu", skins: ["Default","Red","Party Hat","Cowboy Hat"] },
	{ id: 14, name: "Ice Climbers", skins: ["Default","Green","Orange","Red"] },
	{ id: 15, name: "Jigglypuff", skins: ["Default","Red","Blue","Headband","Crown"] },
	{ id: 16, name: "Samus", skins: ["Default","Pink","Black","Green","Purple"] },
	{ id: 17, name: "Yoshi", skins: ["Default","Red","Blue","Yellow","Pink","Cyan"] },
	{ id: 18, name: "Zelda", skins: ["Default","Red","Blue","Green","White"] },
	{ id: 19, name: "Sheik", skins: ["Default","Red","Blue","Green","White"] },
	{ id: 20, name: "Falco", skins: ["Default","Red","Blue","Green"] },
	{ id: 21, name: "Young Link", skins: ["Default","Red","Blue","White","Black"] },
	{ id: 22, name: "Dr. Mario", skins: ["Default","Red","Blue","Green","Black"] },
	{ id: 23, name: "Roy", skins: ["Default","Red","Blue","Green","Yellow"] },
	{ id: 24, name: "Pichu", skins: ["Default","Red","Blue","Green"] },
	{ id: 25, name: "Ganondorf", skins: ["Default","Red","Blue","Green","Purple"] },
];
