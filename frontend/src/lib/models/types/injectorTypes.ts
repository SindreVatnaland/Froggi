import { IWindow as IWindowAmd } from 'electron-overlay-amd';
import { IWindow as IWindowIntel } from 'electron-overlay-intel';

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


export interface ProcessInfo {
    Id: number;
    ProcessName: string;
    MainWindowTitle: string;
}

export type IWindow = IWindowAmd | IWindowIntel;