export interface InjectorPayload {
    ["graphics.window.event.resize"]: GraphicWindowEventResize,
}

export interface GraphicWindowEventResize { 
    pid: number,
    nativeHandle: number,
    width: number,
    height: number
}

export type InjectorEvent = keyof InjectorPayload;