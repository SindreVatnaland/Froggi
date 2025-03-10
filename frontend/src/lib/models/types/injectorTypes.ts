// Define the possible events and their payloads
export interface InjectorPayload {
    ["graphics.window.event.resize"]: GraphicWindowEventResize,
    ["game.window.focused"]: GameWindowEventFocus,
}

export interface GraphicWindowEventResize {
    pid: number,
    nativeHandle: number,
    width: number,
    height: number
}

export interface GameWindowEventFocus {
    focusWindowId: number,
}

export type InjectorEvent = keyof InjectorPayload;