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
	Offline = 'Offline',
	SmashGG = 'SmashGG',
}

export enum ConnectionState {
	None = 'None',
	Disconnected = 'Disconnected',
	Connected = 'Connected',
	Connecting = 'Connecting',
	Searching = 'Searching',
}

export enum ElementCategory {
	Session = 'Current Player Session',
	GameCustomUi = 'Custom UI',
	CurrentPlayerCustomUi = 'Current Player Custom UI',
	Player1CustomUi = 'Player1 Custom UI',
	Player2CustomUi = 'Player2 Custom UI',
	CurrentPlayerPostGameAttackCount = 'Current Player Attack Count',
	Player1PostGameAttackCount = 'Player1 Attack Count',
	Player2PostGameAttackCount = 'Player2 Attack Count',
	CurrentPlayerPostGameActionCount = 'Current Player Action Count',
	Player1PostGameActionCount = 'Player1 Action Count',
	Player2PostGameActionCount = 'Player2 Action Count',
	CurrentPlayerPostGameOverallStats = 'Current Player Overall Stats',
	Player1PostGameOverallStats = 'Player1 Overall Stats',
	Player2PostGameOverallStats = 'Player2 Overall Stats',

	CurrentPlayerPostGameMatchAttackCount = 'Current Player Match Attack Count',
	Player1PostGameMatchAttackCount = 'Player1 Match Attack Count',
	Player2PostGameMatchAttackCount = 'Player2 Match Attack Count',
	CurrentPlayerPostGameMatchActionCount = 'Current Player Match Action Count',
	Player1PostGameMatchActionCount = 'Player1 Match Action Count',
	Player2PostGameMatchActionCount = 'Player2 Match Action Count',
	CurrentPlayerPostGameMatchOverallStats = 'Current Player Overall Match Stats',
	Player1PostGameMatchOverallStats = 'Player1 Overall Match Stats',
	Player2PostGameMatchOverallStats = 'Player2 Overall Match Stats',

	PostSetStats = 'Post Set Stats',
	CurrentMatchStats = 'Current Match Stats',
	Custom = 'Custom',
	CurrentPlayerSlippiData = 'Current Player Slippi Data',
	Player1SlippiData = 'Player1 Slippi Data',
	Player2SlippiData = 'Player2 Slippi Data',
	CurrentPlayerControllerInput = 'Current Player Controller Inputs',
	Player1ControllerInput = 'Player1 Controller Input',
	Player2ControllerInput = 'Player2 Controller Input',
	RankChangeData = 'Rank Change Data',

	RecentGameSummary = 'Recent Game Summary',
	Game1Summary = 'Game 1 Summary',
	Game2Summary = 'Game 2 Summary',
	Game3Summary = 'Game 3 Summary',
	Game4Summary = 'Game 4 Summary',
	Game5Summary = 'Game 5 Summary',
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
	WaitingForDolphin = 'Waiting',
	Menu = 'Menu',
	InGame = 'In Game',
	PostGame = 'Post Game',
	PostSet = 'Post Set',
	RankChange = 'Rank Change',
}

export enum NotificationType {
	Default = 'Defalut',
	Danger = 'Danger',
	Warning = 'Warning',
	Info = 'Info',
	Success = 'Success',
}

export enum PlayerActionState {
	Dead = 0,
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
