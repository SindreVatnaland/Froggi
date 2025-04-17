import axios from 'axios';
import type { ElectronLog } from 'electron-log';
import { inject, injectable } from 'tsyringe';
import { Character, Player, RankedNetplayProfile, SlippiCharacter } from '../../frontend/src/lib/models/types/slippiData';
import { PlayerType } from '@slippi/slippi-js';
import { CHARACTERS } from '../../frontend/src/lib/models/constants/characterData';
import { getPlayerRank } from '../../frontend/src/lib/utils/playerRankHelper';
import { dateTimeNow } from '../utils/functions';

@injectable()
export class Api {
	constructor(@inject("ElectronLog") private log: ElectronLog) {
		this.log.info("Initializing Api")
	}

	async getPlayerWithRankStats(player: PlayerType): Promise<Player | undefined> {
		try {
			const rankData = await this.getPlayerRankStats(player.connectCode);
			if (!rankData) return;
			return { ...player, rank: { current: this.enrichData(rankData), predictedRating: undefined } }
		} catch (err) {
			this.log.error(err);
			return
		}
	}

	async getPlayerRankStats(connectCode: string): Promise<RankedNetplayProfile | undefined> {
		const response = await axios.post(
			"https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql",
			{
				query: `query AccountManagementPageQuery($cc: String!) {
          getConnectCode(code: $cc) {
            user {
              fbUid
              displayName
              connectCode {
                code
              }
              status
              activeSubscription {
                level
                hasGiftSub
              }
              rankedNetplayProfile {
                id
                ratingOrdinal
                ratingUpdateCount
								ratingMu
								ratingSigma
                wins
                losses
                dailyGlobalPlacement
                dailyRegionalPlacement
                continent
                characters {
                  character
                  gameCount
                }
              }
            }
          }
        }`,
				variables: { cc: connectCode },
			},
			{
				headers: {
					"Content-Type": "application/json",
					Accept: "*/*",
					"apollographql-client-name": "slippi-web",
				},
			}
		);

		const data = response?.data.data;

		const player: any = await data?.getConnectCode?.user;

		if (!data) return;

		this.log.info("Fetched user:", player)

		const rankData: RankedNetplayProfile = {
			connectCode: connectCode,
			displayName: player.displayName,
			totalGames: player.rankedNetplayProfile?.ratingUpdateCount ?? 0,
			ratingMu: player.rankedNetplayProfile?.ratingMu ?? 0,
			ratingSigma: player.rankedNetplayProfile?.ratingSigma ?? 0,
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
			rating: Number(player.rankedNetplayProfile.ratingOrdinal.toFixed(1)),

			continent: player?.rankedNetplayProfile?.continent ?? '',
			leaderboardPlacement: 0,
			continentInitials: undefined,
			lossesPercent: 0,
			rank: 'UNRANKED',
			seasons: player?.netplayProfiles,
			totalSets: 0,
			winsPercent: 0,
			userId: player.fbUid,
			timestamp: dateTimeNow(),
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

	async getNewRankWithBackoff(oldRank: RankedNetplayProfile, connectCode: string, maxRetries: number = 3, delay: number = 3000, backoffMultiplier: number = 1): Promise<RankedNetplayProfile> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				if (attempt <= maxRetries) {
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
