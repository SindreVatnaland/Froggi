import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import type { FrameEntryType, GameStartType, PostFrameUpdateType } from '@slippi/slippi-js';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import {
	getActionStateName,
	STATE_AIR_DODGE,
	STATE_LANDING_FALL_SPECIAL,
	STATE_CLIFF_WAIT,
	STATE_GUARD_START,
	STATE_GUARD_END,
	STATE_TECH_START,
	STATE_TECH_END,
} from '../../frontend/src/lib/models/constants/actionStates';
import type {
	FrameSnapshot,
	TechniqueId,
	TechniqueDetectedPayload,
	ActionStateHistoryEntry,
} from '../../frontend/src/lib/models/types/actionState';
import { MessageHandler } from './messageHandler';

const STATE_JUMP_SQUAT = 24;
const STATE_JUMP_F = 25;
const STATE_JUMP_B = 26;
const STATE_PASS = 244;
const LEDGE_WINDOW = 45;
const AIRDODGE_WINDOW = 12;
const BUFFER_SIZE = 120;
const HISTORY_SIZE = 10;

function getStateCategory(stateId: number): string {
	if (stateId <= 10) return 'Dead';
	if (stateId <= 13) return 'Respawning';
	if (stateId <= 17) return 'Idle';
	if (stateId === 18) return 'Walking';
	if (stateId === 19) return 'Turning';
	if (stateId <= 23) return 'Dashing';
	if (stateId === 24) return 'Jumping';
	if (stateId <= 30) return 'Jumping';
	if (stateId <= 34) return 'Falling';
	if (stateId === 38) return 'Tumbling';
	if (stateId <= 41) return 'Crouching';
	if (stateId === 43) return 'Special Landing';
	if (stateId <= 47) return 'Landing';
	if (stateId <= 64) return 'Attacking';
	if (stateId <= 74) return 'Attacking';
	if (stateId <= 91) return 'Hitstun';
	if (stateId <= 112) return 'Hitstun';
	if (stateId <= 177) return 'Other';
	if (stateId <= 182) return 'Shielding';
	if (stateId <= 198) return 'Down';
	if (stateId <= STATE_TECH_END) return 'Tech';
	if (stateId <= 214) return 'Shield Break';
	if (stateId <= 222) return 'Grabbing';
	if (stateId <= 232) return 'Grabbed';
	if (stateId <= 236) return 'Dodging';
	if (stateId === STATE_PASS) return 'Platform Drop';
	if (stateId <= 251) return 'Teetering';
	if (stateId <= 263) return 'Ledge';
	return 'Other';
}

@singleton()
export class ActionStateService {
	private frameBuffers = new Map<number, FrameSnapshot[]>();
	private stateHistories = new Map<number, ActionStateHistoryEntry[]>();
	private lastStateIds = new Map<number, number>();
	private playerConnectCodes = new Map<number, string>();
	private lastLCancelFrame = new Map<number, number>();

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing ActionState Service');
		this.initEventListeners();
	}

	private initEventListeners() {
		this.localEmitter.on('GameSettings', (settings: GameStartType | undefined) => {
			this.reset();
			if (!settings) return;
			settings.players?.forEach((p) => {
				if (p.playerIndex != null && p.connectCode) {
					this.playerConnectCodes.set(p.playerIndex, p.connectCode);
				}
			});
		});

		this.localEmitter.on('GameFrame', (frame: FrameEntryType | undefined | null) => {
			if (!frame?.players) return;
			for (const [idxStr, player] of Object.entries(frame.players)) {
				const playerIndex = Number(idxStr);
				if (!player?.post) continue;
				this.processFrame(playerIndex, frame.frame ?? 0, player.post);
			}
		});
	}

	private reset() {
		this.frameBuffers.clear();
		this.stateHistories.clear();
		this.lastStateIds.clear();
		this.playerConnectCodes.clear();
		this.lastLCancelFrame.clear();
	}

	private processFrame(
		playerIndex: number,
		frame: number,
		post: PostFrameUpdateType,
	) {
		if (!post) return;

		const stateId = post.actionStateId ?? 0;
		const snapshot: FrameSnapshot = {
			frame,
			actionStateId: stateId,
			isAirborne: post.isAirborne ?? false,
			groundX: post.selfInducedSpeeds?.groundX ?? 0,
			airX: post.selfInducedSpeeds?.airX ?? 0,
			jumpsRemaining: post.jumpsRemaining ?? 0,
			lCancelStatus: post.lCancelStatus ?? null,
			joystickX: 0,
			joystickY: 0,
		};

		if (!this.frameBuffers.has(playerIndex)) {
			this.frameBuffers.set(playerIndex, []);
		}
		const buffer = this.frameBuffers.get(playerIndex)!;
		buffer.push(snapshot);
		if (buffer.length > BUFFER_SIZE) buffer.shift();

		// L-cancel fires on the frame the status is set, not tied to state changes
		const lCancel = post.lCancelStatus;
		if (lCancel === 1 || lCancel === 2) {
			const lastFrame = this.lastLCancelFrame.get(playerIndex) ?? -999;
			if (frame - lastFrame > 10) {
				this.lastLCancelFrame.set(playerIndex, frame);
				this.emitTechnique(playerIndex, frame, lCancel === 1 ? 'l_cancel_success' : 'l_cancel_miss');
			}
		}

		const prevStateId = this.lastStateIds.get(playerIndex);
		if (prevStateId !== stateId) {
			this.lastStateIds.set(playerIndex, stateId);
			this.onStateChange(playerIndex, stateId, frame, buffer, snapshot);
		}
	}

	private onStateChange(
		playerIndex: number,
		stateId: number,
		frame: number,
		buffer: FrameSnapshot[],
		current: FrameSnapshot,
	) {
		this.updateHistory(playerIndex, stateId, frame);

		if (stateId === STATE_LANDING_FALL_SPECIAL) {
			this.detectLandingTechnique(playerIndex, frame, buffer, current);
			return;
		}

		if (stateId >= STATE_TECH_START && stateId <= STATE_TECH_START + 2) {
			this.emitTechnique(playerIndex, frame, 'ground_tech');
			return;
		}

		if (stateId === STATE_TECH_START + 3 || stateId === STATE_TECH_START + 4) {
			this.emitTechnique(playerIndex, frame, 'wall_tech');
			return;
		}

		if (stateId === STATE_PASS) {
			const recent = buffer.slice(-5);
			const wasShielding = recent.some(
				(s) => s.actionStateId >= STATE_GUARD_START && s.actionStateId <= STATE_GUARD_END,
			);
			if (wasShielding) this.emitTechnique(playerIndex, frame, 'shield_drop');
		}
	}

	private detectLandingTechnique(
		playerIndex: number,
		frame: number,
		buffer: FrameSnapshot[],
		current: FrameSnapshot,
	) {
		const recentAirDodge = buffer.slice(-AIRDODGE_WINDOW);
		const hadAirDodge = recentAirDodge.some((s) => s.actionStateId === STATE_AIR_DODGE);
		if (!hadAirDodge) return;

		const ledgeWindow = buffer.slice(-LEDGE_WINDOW);
		const hadLedge = ledgeWindow.some((s) => s.actionStateId === STATE_CLIFF_WAIT);
		if (hadLedge) {
			this.emitTechnique(playerIndex, frame, 'ledgedash');
			return;
		}

		const hadJump = recentAirDodge.some(
			(s) => s.actionStateId === STATE_JUMP_F || s.actionStateId === STATE_JUMP_B,
		);
		const hadJumpSquat = recentAirDodge.some((s) => s.actionStateId === STATE_JUMP_SQUAT);
		const hasGroundX = Math.abs(current.groundX) >= 0.3;

		if (hasGroundX && (hadJump || hadJumpSquat)) {
			this.emitTechnique(playerIndex, frame, 'wavedash');
		} else {
			this.emitTechnique(playerIndex, frame, 'waveland');
		}
	}

	private emitTechnique(playerIndex: number, frame: number, techniqueId: TechniqueId) {
		const connectCode = this.playerConnectCodes.get(playerIndex);
		const payload: TechniqueDetectedPayload = { playerIndex, connectCode, techniqueId, frame };
		this.messageHandler.sendMessage('TechniqueDetected', payload);
	}

	private updateHistory(playerIndex: number, stateId: number, frame: number) {
		if (!this.stateHistories.has(playerIndex)) {
			this.stateHistories.set(playerIndex, []);
		}
		const history = this.stateHistories.get(playerIndex)!;
		history.push({
			frame,
			stateId,
			stateName: getActionStateName(stateId),
			category: getStateCategory(stateId),
		});
		if (history.length > HISTORY_SIZE) history.shift();

		this.messageHandler.sendMessage('ActionStateHistory', {
			playerIndex,
			history: [...history],
		});
	}
}
