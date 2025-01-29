import { GameStartType } from "@slippi/slippi-js";
import { GameStartMode } from "../../frontend/src/lib/models/types/slippiData";

export const newId = () => `e${Math.random().toString(36).slice(-8)}`;

export const dateTimeNow = (): Date => {
    var utcSeconds = Date.now() / 1000;
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(utcSeconds);
    return d;
}

export const getHoursDifference = (date1: Date, date2: Date): number => {
    const timeDifference = date1.getTime() - date2.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    return Math.abs(hoursDifference);
}

export const getGameMode = (settings: GameStartType | null): GameStartMode => {
    const regex = /mode\.(\w+)/;
    if (!settings) return "local"
    return settings.matchInfo?.matchId?.match(regex)?.at(1) as GameStartMode ?? "local"
}
