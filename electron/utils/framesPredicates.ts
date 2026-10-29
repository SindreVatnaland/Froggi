import type { FrameEntryType } from '../../frontend/src/lib/models/types/slippiTypes';
import { STAGE_DATA } from "../../frontend/src/lib/models/constants/stageData"

export function isGrabbed(
    playerIndex: number,
    frame: FrameEntryType,
): boolean {
    const actionStateId = frame.players?.[playerIndex]?.post.actionStateId;
    if (!actionStateId) {
        return false;
    }
    return actionStateId >= 0xdf && actionStateId <= 0xe8;
}

export function isGroundedControl(
    playerIndex: number,
    frame: FrameEntryType,
): boolean {
    const actionStateId = frame.players?.[playerIndex]?.post.actionStateId;
    if (!actionStateId) {
        return false;
    }
    const ground = actionStateId >= 0x0e && actionStateId <= 0x18;
    const squat = actionStateId >= 0x27 && actionStateId <= 0x29;
    const groundAttack = actionStateId >= 0x2c && actionStateId <= 0x40;
    const grab = actionStateId === 0xd4;
    return ground || squat || groundAttack || grab;
}

export function isInHitStun(
    playerIndex: number,
    frame: FrameEntryType,
): boolean {
    const actionStateId = frame.players?.[playerIndex]?.post.actionStateId;
    if (!actionStateId) {
        return false;
    }
    return (actionStateId >= 0x4b && actionStateId <= 0x5b) || actionStateId === 0x26
}

export const isOffStage = (stageId: number, frame: FrameEntryType, playerIndex: number): boolean => {
    const postFrame = frame.players?.[playerIndex]?.post
    if (!postFrame) return false;
    const positionX = (postFrame.positionX ?? 0)
    const positionY = postFrame.positionY ?? 0
    const { leftLedgeX, rightLedgeX, mainPlatformHeight } = STAGE_DATA[stageId]
    return (
        positionY <= mainPlatformHeight - 10 ||
        positionX <= leftLedgeX ||
        positionX >= rightLedgeX
    );
}