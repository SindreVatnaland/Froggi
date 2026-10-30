export enum Animation {
	None = 'none',
	Blur = 'blur',
	Fade = 'fade',
	Fly = 'fly',
	FlyRandom = 'fly random',
	FlyAutomatic = 'fly automatic',
	Scale = 'scale',
	Slide = 'slide',
	Percent = 'percent',
	/** Trigger animations only: a number counts from its old to its new value (utils/countUp.ts). */
	Count = 'count',
}

export enum AutoUpdaterStatus {
	UpdateAvailable = 'Download',
	LookingForUpdate = 'Looking For Update',
	Downloading = 'Downloading',
	DownloadComplete = 'Install',
	Installing = 'Installing',
	UpToDate = 'Up To Date',
}

export enum BestOf {
	BestOf3 = 3,
	BestOf5 = 5,
	BestOf7 = 7,
	BestOf9 = 9,
}

export enum Character {
	Falcon = 0,
	DK = 1,
	Fox = 2,
	GW = 3,
	Kirby = 4,
	Bowser = 5,
	Link = 6,
	Luigi = 7,
	Mario = 8,
	Marth = 9,
	MewTwo = 10,
	Ness = 11,
	Peach = 12,
	Pikachu = 13,
	IceClimbers = 14,
	Jigglypuff = 15,
	Samus = 16,
	Yoshi = 17,
	Zelda = 18,
	Sheik = 19,
	Falco = 20,
	YoungLink = 21,
	DrMario = 22,
	Roy = 23,
	Pichu = 24,
	Ganondorf = 25,
}

export enum DashboardOption {
	Offline = 'Default',
}

export enum ConnectionState {
	None = 'None',
	Disconnected = 'Disconnected',
	Connected = 'Connected',
	Connecting = 'Connecting',
	Searching = 'Searching',
}

export enum ElementCategory {
	LiveGame = 'Live Game',
	GameCustomHud = 'Game HUD',
	PlayerHud = 'Player HUD',
	PlayerControllerInput = 'Player Controller Inputs',
	PlayerActionState = 'Player Action State',
	Doubles = 'Doubles & Ports',
	WinChance = 'Win Chance',
	CurrentMatchStats = 'Current Match',
	Session = 'Your Session',
	PlayerSlippiRank = 'Player Slippi Rank',
	PlayerPredictedRank = 'Player Rank Prediction',
	RankChangeData = 'Rank Change',
	PlayerOverallStats = 'Player Game Stats',
	PlayerAttackCount = 'Player Game Attacks',
	PlayerActionCount = 'Player Game Actions',
	PlayerMatchOverallStats = 'Player Set Stats',
	PlayerMatchAttackCount = 'Player Set Attacks',
	PlayerMatchActionCount = 'Player Set Actions',
	EdgeStats = 'Edge Cancels & Edgeguards',
	Highlights = 'Media & Highlights',
	PostSetStats = 'Post Set Stats',
	RecentGameSummary = 'Recent Game Summary',
	Game1Summary = 'Game 1 Summary',
	Game2Summary = 'Game 2 Summary',
	Game3Summary = 'Game 3 Summary',
	Game4Summary = 'Game 4 Summary',
	Game5Summary = 'Game 5 Summary',
	StageStriking = 'Stage Striking',
	Minigames = 'Minigames',
	Custom = 'Custom',
}

export enum InGameState {
	Inactive = 'Inactive',
	Running = 'Running',
	Paused = 'Paused',
	End = 'Game End',
	Time = 'Time',
	Tie = 'Tie',
}

export enum LiveStatsScene {
	WaitingForDolphin = "waitingForDolphin",
	Menu = "menu",
	InGame = "inGame",
	PostGame = "postGame",
	PostSet = "postSet",
	RankChange = "rankChange",
	StrikePhase = "strikePhase",
}

export enum NotificationType {
	Default = 'default',
	Danger = 'danger',
	Warning = 'warning',
	Info = 'info',
	Success = 'success',
}

export enum SceneBackground {
	None = 'None',
	Color = 'Color',
	Image = 'Image',
	ImageCustom = 'Custom Image',
	InGameImageStage = 'In Game Stage Image',
	PostGameImageStage = 'Post Game Stage Image',
}

export enum StyleSetting {
	CustomStringSettings = 'Custom String',
	CustomBoxSettings = 'Custom Box',
	CustomImageSettings = 'Custom Image',
	StringSettings = 'String',
	BoxSettings = 'Box',
	ImageSettings = 'Image',
}

export enum Transition {
	None = 0,
	Fade = 1,
	Scale = 2,
	Fly = 3,
	Slide = 4,
	Blur = 5,
	Draw = 6,
	CrossFade = 7,
}
