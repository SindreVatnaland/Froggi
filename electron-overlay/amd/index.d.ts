/// <reference types="node" />
declare module "electron-overlay-amd" {
    interface IHotkey {
        name: string;
        keyCode: number;
        modifiers?: {
            alt?: boolean;
            ctrl?: boolean;
            shift?: boolean;
            meta?: boolean;
        };
        passthrough?: boolean;
    }

    interface IRectangle {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    interface IOverlayWindowDetails {
        name: string;
        transparent: boolean;
        resizable: boolean;
        maxWidth: number;
        maxHeight: number;
        minWidth: number;
        minHeight: number;
        rect: IRectangle;
        nativeHandle: number;
        dragBorderWidth?: number;
        caption?: {
            left: number;
            right: number;
            top: number;
            height: number;
        };
    }

    enum FpsPosition {
        TopLeft = "TopLeft",
        TopRight = "TopRight",
        BottomLeft = "BottomLeft",
        BottomRight = "BottomRight",
    }

    export interface IProcessThread {
        processId: number;
        threadId?: number;
    }

    export interface IWindow extends IProcessThread {
        windowId: number;
        title?: string;
    }

    export interface IInjectResult {
        injectHelper: string;
        injectDll: string;
        injectSucceed: boolean;
    }

    export interface IOverlayModule {
        getTopWindows(includeMinimized?: boolean): IWindow[];
        injectProcess(process: IWindow): IInjectResult;
        start(): void;
        stop(): void;
        setEventCallback(cb: (event: string, ...args: any[]) => void): void;
        setHotkeys(hotkeys: IHotkey[]): void;
        sendCommand(arg: { command: "cursor", cursor: string }): void;
        sendCommand(arg: { command: "fps", showfps: boolean, position: FpsPosition }): void;
        sendCommand(arg: { command: "input.intercept", intercept: boolean }): void;
        addWindow(windowId: number, details: IOverlayWindowDetails): void;
        closeWindow(windowId: number): void;
        sendWindowBounds(windowId: number, details: { rect: IRectangle }): void;
        sendFrameBuffer(windowId: number, buffer: Buffer, width: number, height: number): void;
        translateInputEvent(event: { windowId: number, msg: number, wparam: number, lparam: number }): any;
    }

    export function initialize(): IOverlayModule | null;
}
