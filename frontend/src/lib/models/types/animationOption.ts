
export enum AnimationTrigger {
    None = "None",

    InGameGameCountdown = "Game Countdown",
    InGameCurrentPlayerPercent = "Current Player Percent Increase",
    InGamePlayer1Percent = "Player1 Percent Increase",
    InGamePlayer2Percent = "Player2 Percent Increase",
    InGameCurrentPlayerStockLost = "Current Player Stock Loss",
    InGamePlayer1StockLost = "Player1 Stock Loss",
    InGamePlayer2StockLost = "Player2 Stock Loss",
    InGameCurrentPlayerCharacterChange = "Current Player Character Change",
    InGamePlayer1CharacterChange = "Player1 Character Change",
    InGamePlayer2CharacterChange = "Player2 Character Change",

    MatchBestOfChange = "Match Best Of Change",
    MatchGameModeChange = "Match Game Mode Change",
    MatchPlayer1TagChange = "Player 1 Tag Change",
    MatchPlayer2TagChange = "Player 2 Tag Change",
    MatchPlayer1ScoreChange = "Player 1 Score Change",
    MatchPlayer2ScoreChange = "Player 2 Score Change",

    SlippiRankPlayer1ConnectCodeChange = "Player 1 Connect Code Change",
    SlippiRankPlayer2ConnectCodeChange = "Player 2 Connect Code Change",
    SlippiRankPlayer1RatingChange = "Player 1 Rating Change",
    SlippiRankPlayer2RatingChange = "Player 2 Rating Change",
    SlippiRankPlayer1RankChange = "Player 1 Rank Change",
    SlippiRankPlayer2RankChange = "Player 2 Rank Change",

    SlippiRankStatsWinsChange = "Slippi Stats Wins Change",
    SlippiRankStatsLossesChange = "Slippi Stats Losses Change",
    SlippiRankStatsRatingChange = "Slippi Stats Rating Change",
    SlippiRankStatsRatingDifferenceChange = "Slippi Stats Rating Difference Change",
    SlippiRankStatsRankChange = "Slippi Stats Rank Change",

    SessionWins = "Session Wins Change",
    SessionLosses = "Session Losses Change",
    SessionRating = "Session Rating Change",
    SessionGames = "Session Games Number Change",
}

export enum VisibilityOption {
    SessionPositiveWinRate = "Session Positive Win Rate",
    SessionPositiveNetRating = "Session Positive Net Rating",

    InGameRunning = "Game Running",
    InGamePaused = "Game Paused",
    InGameReady = "Game Ready",
    InGameGo = "Game Go",
    InGameCountdown = "Game Countdown",
    InGameEnd = "Game End",
    InGameTime = "Game Time",
    InGameTie = "Game Tie",
    InGamePlayer1OffStage = "Player 1 Off Stage",
    InGamePlayer2OffStage = "Player 2 Off Stage",

    InGamePlayer1Alive = "Player 1 Alive",
    InGamePlayer1Combo = "Player 1 Combo",
    InGamePlayer1EnteringHalo = "Player 1 Entering Halo",
    InGamePlayer1Stock1 = "Player 1 Stock 1",
    InGamePlayer1Stock2 = "Player 1 Stock 2",
    InGamePlayer1Stock3 = "Player 1 Stock 3",
    InGamePlayer1Stock4 = "Player 1 Stock 4",

    InGamePlayer2Alive = "Player 2 Alive",
    InGamePlayer2Combo = "Player 2 Combo",
    InGamePlayer2EnteringHalo = "Player 2 Entering Halo",
    InGamePlayer2Stock1 = "Player 2 Stock 1",
    InGamePlayer2Stock2 = "Player 2 Stock 2",
    InGamePlayer2Stock3 = "Player 2 Stock 3",
    InGamePlayer2Stock4 = "Player 2 Stock 4",

    MatchStatsPlayer1Score1 = "Player 1 Score 1",
    MatchStatsPlayer1Score2 = "Player 1 Score 2",
    MatchStatsPlayer1Score3 = "Player 1 Score 3",
    MatchStatsPlayer2Score1 = "Player 2 Score 1",
    MatchStatsPlayer2Score2 = "Player 2 Score 2",
    MatchStatsPlayer2Score3 = "Player 2 Score 3",

    PostGameCurrentPlayerWin = "Post Game Current Player Win",
    PostGamePlayer1Win = "Post Game Player 1 Win",
    PostGamePlayer2Win = "Post Game Player 2 Win",
    PostGamePlayer1Stock1 = "Post Game Player 1 Stock 1",
    PostGamePlayer1Stock2 = "Post Game Player 1 Stock 2",
    PostGamePlayer1Stock3 = "Post Game Player 1 Stock 3",
    PostGamePlayer1Stock4 = "Post Game Player 1 Stock 4",
    PostGamePlayer2Stock1 = "Post Game Player 2 Stock 1",
    PostGamePlayer2Stock2 = "Post Game Player 2 Stock 2",
    PostGamePlayer2Stock3 = "Post Game Player 2 Stock 3",
    PostGamePlayer2Stock4 = "Post Game Player 2 Stock 4",

    PostGame1SummaryCompleted = "Post Game 1 Summary Completed",
    PostGame1SummaryCurrentPlayerWin = "Post Game 1 Summary Current Player Win",
    PostGame1SummaryPlayer1Win = "Post Game 1 Summary Player 1 Win",
    PostGame1SummaryPlayer2Win = "Post Game 1 Summary Player 2 Win",
    PostGame1SummaryPlayer1Stock1 = "Post Game 1 Summary Player 1 Stock 1",
    PostGame1SummaryPlayer1Stock2 = "Post Game 1 Summary Player 1 Stock 2",
    PostGame1SummaryPlayer1Stock3 = "Post Game 1 Summary Player 1 Stock 3",
    PostGame1SummaryPlayer1Stock4 = "Post Game 1 Summary Player 1 Stock 4",
    PostGame1SummaryPlayer2Stock1 = "Post Game 1 Summary Player 2 Stock 1",
    PostGame1SummaryPlayer2Stock2 = "Post Game 1 Summary Player 2 Stock 2",
    PostGame1SummaryPlayer2Stock3 = "Post Game 1 Summary Player 2 Stock 3",
    PostGame1SummaryPlayer2Stock4 = "Post Game 1 Summary Player 2 Stock 4",

    PostGame2SummaryCompleted = "Post Game 2 Summary Completed",
    PostGame2SummaryCurrentPlayerWin = "Post Game 2 Summary Current Player Win",
    PostGame2SummaryPlayer1Win = "Post Game 2 Summary Player 1 Win",
    PostGame2SummaryPlayer2Win = "Post Game 2 Summary Player 2 Win",
    PostGame2SummaryPlayer1Stock1 = "Post Game 2 Summary Player 1 Stock 1",
    PostGame2SummaryPlayer1Stock2 = "Post Game 2 Summary Player 1 Stock 2",
    PostGame2SummaryPlayer1Stock3 = "Post Game 2 Summary Player 1 Stock 3",
    PostGame2SummaryPlayer1Stock4 = "Post Game 2 Summary Player 1 Stock 4",
    PostGame2SummaryPlayer2Stock1 = "Post Game 2 Summary Player 2 Stock 1",
    PostGame2SummaryPlayer2Stock2 = "Post Game 2 Summary Player 2 Stock 2",
    PostGame2SummaryPlayer2Stock3 = "Post Game 2 Summary Player 2 Stock 3",
    PostGame2SummaryPlayer2Stock4 = "Post Game 2 Summary Player 2 Stock 4",

    PostGame3SummaryCompleted = "Post Game 3 Summary Completed",
    PostGame3SummaryCurrentPlayerWin = "Post Game 3 Summary Current Player Win",
    PostGame3SummaryPlayer1Win = "Post Game 3 Summary Player 1 Win",
    PostGame3SummaryPlayer2Win = "Post Game 3 Summary Player 2 Win",
    PostGame3SummaryPlayer1Stock1 = "Post Game 3 Summary Player 1 Stock 1",
    PostGame3SummaryPlayer1Stock2 = "Post Game 3 Summary Player 1 Stock 2",
    PostGame3SummaryPlayer1Stock3 = "Post Game 3 Summary Player 1 Stock 3",
    PostGame3SummaryPlayer1Stock4 = "Post Game 3 Summary Player 1 Stock 4",
    PostGame3SummaryPlayer2Stock1 = "Post Game 3 Summary Player 2 Stock 1",
    PostGame3SummaryPlayer2Stock2 = "Post Game 3 Summary Player 2 Stock 2",
    PostGame3SummaryPlayer2Stock3 = "Post Game 3 Summary Player 2 Stock 3",
    PostGame3SummaryPlayer2Stock4 = "Post Game 3 Summary Player 2 Stock 4",

    PostGame4SummaryCompleted = "Post Game 4 Summary Completed",
    PostGame4SummaryCurrentPlayerWin = "Post Game 4 Summary Current Player Win",
    PostGame4SummaryPlayer1Win = "Post Game 4 Summary Player 1 Win",
    PostGame4SummaryPlayer2Win = "Post Game 4 Summary Player 2 Win",
    PostGame4SummaryPlayer1Stock1 = "Post Game 4 Summary Player 1 Stock 1",
    PostGame4SummaryPlayer1Stock2 = "Post Game 4 Summary Player 1 Stock 2",
    PostGame4SummaryPlayer1Stock3 = "Post Game 4 Summary Player 1 Stock 3",
    PostGame4SummaryPlayer1Stock4 = "Post Game 4 Summary Player 1 Stock 4",
    PostGame4SummaryPlayer2Stock1 = "Post Game 4 Summary Player 2 Stock 1",
    PostGame4SummaryPlayer2Stock2 = "Post Game 4 Summary Player 2 Stock 2",
    PostGame4SummaryPlayer2Stock3 = "Post Game 4 Summary Player 2 Stock 3",
    PostGame4SummaryPlayer2Stock4 = "Post Game 4 Summary Player 2 Stock 4",

    PostGame5SummaryCompleted = "Post Game 5 Summary Completed",
    PostGame5SummaryCurrentPlayerWin = "Post Game 5 Summary Current Player Win",
    PostGame5SummaryPlayer1Win = "Post Game 5 Summary Player 1 Win",
    PostGame5SummaryPlayer2Win = "Post Game 5 Summary Player 2 Win",
    PostGame5SummaryPlayer1Stock1 = "Post Game 5 Summary Player 1 Stock 1",
    PostGame5SummaryPlayer1Stock2 = "Post Game 5 Summary Player 1 Stock 2",
    PostGame5SummaryPlayer1Stock3 = "Post Game 5 Summary Player 1 Stock 3",
    PostGame5SummaryPlayer1Stock4 = "Post Game 5 Summary Player 1 Stock 4",
    PostGame5SummaryPlayer2Stock1 = "Post Game 5 Summary Player 2 Stock 1",
    PostGame5SummaryPlayer2Stock2 = "Post Game 5 Summary Player 2 Stock 2",
    PostGame5SummaryPlayer2Stock3 = "Post Game 5 Summary Player 2 Stock 3",
    PostGame5SummaryPlayer2Stock4 = "Post Game 5 Summary Player 2 Stock 4",

    RankStatsBeforeRankUpdated = "Rank Stats Pre Update",
    RankStatsAfterRankUpdated = "Rank Stats Post Update",
    RankStatsMatchWon = "Rank Stats Match Won",

}

export enum VisibilityCategory {
    CurrentPlayerState = "Current Player State",
    DolphinState = "Dolphin State",
    Player1State = "Player 1 State",
    Player2State = "Player 2 State",
    OngoingGame = "Ongoing Game",
    Session = "Session",
    InGameState = "Game State",
    MatchStats = "Match Stats",
    RecentGame = "Recent Game",
    RecentGame1Summary = "Recent Game 1 Summary",
    RecentGame2Summary = "Recent Game 2 Summary",
    RecentGame3Summary = "Recent Game 3 Summary",
    RecentGame4Summary = "Recent Game 4 Summary",
    RecentGame5Summary = "Recent Game 5 Summary",
    RankStats = "Rank Stats",
}

export enum AnimationTriggerCategory {
    CurrentPlayerState = "Current Player State",
    DolphinState = "Dolphin State",
    Player1State = "Player1 State",
    Player2State = "Player2 State",
    Player1Data = "Player1 Data",
    Player2Data = "Player2 Data",
    GameState = "Game State",
    MatchState = "Match State",
    RankStats = "Rank Stats",
    SessionStats = "Session Stats"
}

export type SelectedAnimationTriggerCondition = {
    [option in AnimationTrigger]: boolean;
};

export type SelectedVisibilityCondition = {
    [option in VisibilityOption]: VisibilityToggle;
};

export enum VisibilityToggle {
    Disabled = 0,
    True = 1,
    False = 2,
}