import { CurrentPlayerEntity } from "services/sqlite/entities/currentPlayer/currentPlayerEntity";
import { Player, RankedNetplayProfile } from "../../frontend/src/lib/models/types/slippiData";

export const createPlayer = (playerIndex: number, rank: RankedNetplayProfile | undefined = undefined): Player => {
  return {
    playerIndex: playerIndex,
    port: playerIndex + 1,
    connectCode: rank?.connectCode ?? "",
    displayName: rank?.displayName ?? "",
    userId: rank?.userId ?? "",
    rank: { current: rank },
  } as Player;
}

export const fixCurrentPlayer = (currentPlayer: CurrentPlayerEntity | null, rank: RankedNetplayProfile | undefined) => {
  if (!currentPlayer) {
    console.log(`Player with connectCode ${rank?.connectCode} not found. Creating a new one.`);
    currentPlayer = createPlayer(0, rank) as CurrentPlayerEntity;
    currentPlayer = {
      connectCode: rank?.connectCode ?? "",
      displayName: rank?.displayName ?? "",
    } as CurrentPlayerEntity;
  }

  return currentPlayer;
}