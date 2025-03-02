// @ts-ignore
import { OBSRequestTypes } from "obs-websocket-js/dist/types" // Wont compile without this
import { LiveStatsScene } from "../enum"
import { ControllerButtons } from "./controller"



export enum CommandType {
    Obs = "Obs",
    ObsCustom = "ObsCustom",
    Overlay = "Overlay",
}

export interface Command {
    id: string,
    type: CommandType,
    requestType: RequestType
    payload: PayloadType,
}

export type RequestType = OverlayRequest | ObsCustomRequest | keyof OBSRequestTypes
export type PayloadType = OverlayPayload<OverlayRequest> | ObsCustomPayload<ObsCustomRequest> | OBSRequestTypes[keyof OBSRequestTypes] | undefined

export interface Controller {
    enabled: boolean,
    inputCommands: ControllerCommand[],
}

export interface ControllerCommand {
    id: string,
    inputs: ControllerButtons,
    command: Command
}

export interface SceneSwitchCommands {
    enabled: boolean,
    [LiveStatsScene.WaitingForDolphin]: Command[]
    [LiveStatsScene.Menu]: Command[]
    [LiveStatsScene.InGame]: Command[]
    [LiveStatsScene.PostGame]: Command[]
    [LiveStatsScene.PostSet]: Command[]
    [LiveStatsScene.RankChange]: Command[]
}


export const ObsRequestOptions = {
    SaveReplayBuffer: undefined,
    SetCurrentProgramScene: {
        sceneName: ""
    },
    SetInputVolume: {
        inputName: "",
        inputVolumeMul: 0,
    },
}

export const ObsCustomRequestOptions = {
    ToggleSceneItem: {
        itemName: "",
    }
}
export type ObsCustomRequest = keyof typeof ObsCustomRequestOptions
export type ObsCustomPayload<T extends ObsCustomRequest> = typeof ObsCustomRequestOptions[T]


export const OverlayRequestOptions = {
    // ChangeScene: {
    //     liveStatsScene: LiveStatsScene.WaitingForDolphin
    // }, // This is unnecessary, but keeping it as reference
}
export type OverlayRequest = keyof typeof OverlayRequestOptions
export type OverlayPayload<T extends OverlayRequest> = typeof OverlayRequestOptions[T]