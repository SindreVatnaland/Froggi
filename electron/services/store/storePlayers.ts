import type { Player, RankedNetplayProfile } from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import type { PlayerType } from '../../../frontend/src/lib/models/types/slippiTypes';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { isNil } from 'lodash';
import { createPlayer } from '../../utils/playerHelp';
import { playerKey } from '../../../frontend/src/lib/utils/teams';


@singleton()
export class ElectronPlayersStore {
    private players: Player[] = [
        createPlayer(0),
        createPlayer(1),
    ]
    constructor(
        @inject("ElectronLog") private log: ElectronLog,
        @inject("ClientEmitter") private clientEmitter: TypedEmitter,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info("Initializing Players Store")
        this.initEventListeners();
    }

    /** Doubles team names set by the host ('' = use "Tag & Tag"). In memory; reset for new teams. */
    private teamNames: [string, string] = ['', ''];

    getTeamNames(): [string, string] {
        return this.teamNames;
    }

    setTeamNames(names: [string, string]) {
        this.teamNames = [names[0]?.trim() ?? '', names[1]?.trim() ?? ''];
        this.messageHandler.sendMessage("TeamNames", this.teamNames);
    }

    /** Player tags typed at Start Set, by set identity (playerKey) — doubles players have no Slippi name offline. */
    private tagsByKey: Record<string, string> = {};
    /** Tags from Start Set waiting for the set's first game: [Team 1 · P1, Team 2 · P1, Team 1 · P2, Team 2 · P2]. */
    private pendingSlotTags: string[] | null = null;
    /** A Dashboard Start Set just happened — its names survive the set's first game. */
    private startedFromDashboard = false;

    /** Host swap (Fix set…): the live players re-ordered now — singles [P1, P2], doubles [T1P1, T2P1, T1P2, T2P2]. */
    swapPlayers(kind: 'sides' | 'team1' | 'team2', isTeams: boolean) {
        const p = [...this.players];
        const swap = (a: number, b: number) => { if (p[a] && p[b]) [p[a], p[b]] = [p[b], p[a]]; };
        if (kind === 'sides') {
            swap(0, 1);
            if (isTeams) swap(2, 3);
            this.setTeamNames([this.teamNames[1], this.teamNames[0]]);
        } else if (isTeams) swap(kind === 'team1' ? 0 : 1, kind === 'team1' ? 2 : 3);
        this.players = p;
        this.messageHandler.sendMessage('CurrentPlayers', this.players);
    }

    /** A game starts a new set: forget the last set's team names and tags — unless the host just typed them. */
    newSet() {
        if (this.startedFromDashboard) {
            this.startedFromDashboard = false;
            return;
        }
        this.tagsByKey = {};
        this.setTeamNames(['', '']);
    }

    /** Doubles players in slot order get their Start Set tags (a Slippi name wins). */
    withSetTags<T extends Player>(slotPlayers: T[]): T[] {
        if (this.pendingSlotTags) {
            slotPlayers.forEach((p, i) => {
                const tag = this.pendingSlotTags?.[i]?.trim();
                if (p && tag) this.tagsByKey[playerKey(p)] = tag;
            });
            this.pendingSlotTags = null;
        }
        return slotPlayers.map((p) => (p && !p.displayName && this.tagsByKey[playerKey(p)] ? { ...p, displayName: this.tagsByKey[playerKey(p)] } : p));
    }

    getCurrentPlayers(): Player[] | undefined {
        return this.players;
    }

    setCurrentPlayers(newPlayers: (Player | PlayerType)[]) {
        this.players = newPlayers.filter(player => !isNil(player)).map(player => player as Player);
        const tags = this.players.map(p => p.connectCode || p.rank?.current?.connectCode || `port${p.port}`).join(' vs ');
        this.log.info(`Setting current players: ${tags || '(none)'}`);
        this.players.forEach(player => {
            player.connectCode ||= player.rank?.current?.connectCode ?? "";
            player.displayName ||= player.rank?.current?.displayName ?? "";
        });
        this.messageHandler.sendMessage("CurrentPlayers", this.players as Player[]);
    }

    setCurrentPlayerRankStats(player: RankedNetplayProfile) {
        const currentPlayer = this.players.find(p => p.connectCode === player.connectCode);
        if (!currentPlayer) return;
        currentPlayer.rank = { current: player, predictedRating: undefined };
        this.messageHandler.sendMessage("CurrentPlayers", this.players as Player[]);

    }

    initEventListeners() {
        this.clientEmitter.on('SetTeamNames', (names) => this.setTeamNames(names));
        // Start Set (doubles): the typed team names now, the player tags from the set's first game on.
        this.clientEmitter.on('StartSet', (_p1, _p2, _bo, _agree, ruleset, teams) => {
            if (ruleset !== 'doubles' || !teams) return;
            this.startedFromDashboard = true;
            this.tagsByKey = {};
            this.pendingSlotTags = [teams.tags.p1[0], teams.tags.p2[0], teams.tags.p1[1], teams.tags.p2[1]];
            this.setTeamNames(teams.names);
            // The players already on the ports show their tags right away.
            if (this.players.length >= 4) {
                this.players = this.withSetTags(this.players);
                this.pendingSlotTags = [teams.tags.p1[0], teams.tags.p2[0], teams.tags.p1[1], teams.tags.p2[1]];
                this.messageHandler.sendMessage('CurrentPlayers', this.players);
            }
        });
        this.clientEmitter.on("PlayersUpdate", (players: Player[]) => {
            this.setCurrentPlayers(players);
        })
    }
}
