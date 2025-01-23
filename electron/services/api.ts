import axios from 'axios';
import type { ElectronLog } from 'electron-log';
import { inject, injectable } from 'tsyringe';
import { Character, Player, RankedNetplayProfile, SlippiCharacter } from '../../frontend/src/lib/models/types/slippiData';
import { PlayerType } from '@slippi/slippi-js';
import { CHARACTERS } from '../../frontend/src/lib/models/constants/characterData';

@injectable()
export class Api {
	constructor(@inject("ElectronLog") private log: ElectronLog) {
		this.log.info("Initializing Api")
	}

	async getPlayerWithRankStats(player: PlayerType): Promise<Player | undefined> {
		try {
			const rankData = await this.getPlayerRankStats(player.connectCode);
			if (!rankData) return;
			return { ...player, rank: { current: this.enrichData(rankData) } }
		} catch (err) {
			this.log.error(err);
			return
		}
	}

	async getPlayerRankStats(connectCode: string, isDev: boolean = false): Promise<RankedNetplayProfile | undefined> {
		let response = await axios.post('https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql', {
			headers: {
				'Content-Type': 'application/json',
				Accept: '*/*',
				'Accept-Encoding': 'gzip, deflate, br',
				Host: 'gql-gateway-dot-slippi.uc.r.appspot.com',
				'Accept-Language': 'en-GB,en;q=0.9',
				Origin: 'https://slippi.gg',
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
				Connection: 'keep-alive',
				Referer: 'https://slippi.gg/',
				'Content-Length': '838',
				Priority: 'u=3, i',
				'apollographql-client-name': 'slippi-web'
			},
			operationName: 'AccountManagementPageQuery',
			variables: {
				cc: `${connectCode}`,
				uid: `${connectCode}`
			},
			query:
				'fragment userProfilePage on User {\n  fbUid\n  displayName\n  connectCode {\n    code\n    __typename\n  }\n  status\n  activeSubscription {\n    level\n    hasGiftSub\n    __typename\n  }\n  rankedNetplayProfile {\n    id\n    ratingOrdinal\n    ratingUpdateCount\n    wins\n    losses\n    dailyGlobalPlacement\n    dailyRegionalPlacement\n    continent\n    characters {\n      id\n      character\n      gameCount\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nquery AccountManagementPageQuery($cc: String!, $uid: String!) {\n  getUser(fbUid: $uid) {\n    ...userProfilePage\n    __typename\n  }\n  getConnectCode(code: $cc) {\n    user {\n      ...userProfilePage\n      __typename\n    }\n    __typename\n  }\n}\n'
		});

		const data = response?.data.data;

		let player: any = await data?.getConnectCode?.user;

		if (!response) return;

		this.log.info("Fetched user:", player)

		const rankData: RankedNetplayProfile = {
			connectCode: connectCode,
			displayName: player.displayName,
			totalGames: player.rankedNetplayProfile.characters
				.map((c: any) => c?.gameCount ?? 0)
				.reduce((a: number, b: number) => a + b, 0),

			characters: player?.rankedNetplayProfile?.characters
				?.sort((a: Character, b: Character) => b.gameCount - a.gameCount)
				?.slice(0, 3)
				?.map(
					(c: SlippiCharacter): Character => ({
						characterId: c.id,
						gameCount: c.gameCount,
						characterColorId: -1,
						characterName: c.character?.toUpperCase() ?? '',
						gameCountPercent: 0,
					})
				) ?? [],
			dailyGlobalPlacement: player.rankedNetplayProfile.dailyGlobalPlacement,
			dailyRegionalPlacement: player.rankedNetplayProfile.dailyRegionalPlacement,
			wins: player.rankedNetplayProfile.wins ?? 0,
			losses: player.rankedNetplayProfile.losses ?? 0,
			rating: player.rankedNetplayProfile.ratingOrdinal + (isDev ? Math.random() * 100 : 0),

			continent: player?.rankedNetplayProfile?.continent ?? '',
			leaderboardPlacement: 0,
			continentInitials: undefined,
			lossesPercent: 0,
			rank: 'UNRANKED',
			seasons: player?.netplayProfiles,
			totalSets: 0,
			winsPercent: 0
		};

		return this.enrichData(rankData);
	}

	private enrichData(playerRank: RankedNetplayProfile): RankedNetplayProfile {
		const continentInitials = playerRank.continent?.split('_').length == 2 ? playerRank.continent.split('_').map(c => c[0]).join('') : playerRank.continent?.substring(0, 2) ?? '';
		const totalGames = (playerRank.characters?.length) ? playerRank.characters?.map(c => c.gameCount).reduce((a: number, b: number) => a + b) : 0;
		const totalSets = (playerRank?.wins ?? 0) + (playerRank.losses ?? 0);
		const winsPercent = (playerRank?.wins ?? 0) / (totalSets ? totalSets : 1);
		const lossesPercent = (playerRank?.losses ?? 0) / (totalSets ? totalSets : 1);
		const rank = getPlayerRank(
			playerRank.rating,
			playerRank.dailyRegionalPlacement,
			playerRank.dailyGlobalPlacement
		);
		const characters = playerRank.characters.map(character => {
			return {
				...character,
				characterId: CHARACTERS[character.characterName.toLowerCase().replace("_", " ")] as number,
				gameCountPercent: Number((character.gameCount / totalGames * 100).toFixed(1)),
			}
		})

		return {
			...playerRank,
			continentInitials: continentInitials,
			characters: characters,
			lossesPercent: Number(lossesPercent.toFixed(1)),
			rank: rank,
			rating: Number(playerRank.rating.toFixed(1)),
			totalSets: totalSets,
			totalGames: totalGames,
			winsPercent: Number(winsPercent.toFixed(1)),
		}
	}

	async getNewRankWithBackoff(oldRank: RankedNetplayProfile, connectCode: string, maxRetries: number = 3, delay: number = 2000, backoffMultiplier: number = 1): Promise<RankedNetplayProfile> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				if (attempt < maxRetries) {
					await new Promise((resolve) => setTimeout(resolve, delay * backoffMultiplier * attempt));
				}
				this.log.info(`Attempt ${attempt}/${maxRetries}: Fetching rank data...`);

				const newRank = await this.getPlayerRankStats(connectCode);

				if (!newRank) {
					this.log.warn(`Attempt ${attempt}: No rank data found, retrying...`);
				} else if (newRank.totalSets > oldRank.totalSets) {
					this.log.info(`New rank detected after ${attempt} attempts.`);
					return newRank;
				} else {
					this.log.info(`Attempt ${attempt}: Rank has not updated yet.`);
				}

			} catch (err) {
				this.log.error(`Attempt ${attempt} failed due to error:`, err);
			}
		}

		this.log.warn(`Exhausted all ${maxRetries} attempts. Returning old rank.`);
		return oldRank;
	}
}


export function getPlayerRank(rating: number, regionalPlacement: number, globalPlacement: number) {
	switch (true) {
		case rating < 766:
			return 'BRONZE 1';
		case rating < 914:
			return 'BRONZE 2';
		case rating < 1055:
			return 'BRONZE 3';
		case rating < 1189:
			return 'SILVER 1';
		case rating < 1316:
			return 'SILVER 2';
		case rating < 1436:
			return 'SILVER 3';
		case rating < 1549:
			return 'GOLD 1';
		case rating < 1654:
			return 'GOLD 2';
		case rating < 1752:
			return 'GOLD 3';
		case rating < 1843:
			return 'PLATINUM 1';
		case rating < 1928:
			return 'PLATINUM 2';
		case rating < 2004:
			return 'PLATINUM 3';
		case rating < 2074:
			return 'DIAMOND 1';
		case rating < 2137:
			return 'DIAMOND 2';
		case rating < 2192:
			return 'DIAMOND 3';
		case rating >= 2192 && (regionalPlacement <= 100 || globalPlacement <= 300):
			return 'GRANDMASTER';
		case rating < 2275:
			return 'MASTER 1';
		case rating < 2350:
			return 'MASTER 2';
		case rating >= 2350:
			return 'MASTER 3';
		default:
			return 'UNRANKED';
	}
}
