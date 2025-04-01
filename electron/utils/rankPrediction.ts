import { Options, rate, Rating } from 'openskill'
import { Player, RatingPrediction } from '../../frontend/src/lib/models/types/slippiData';

// This value is approximately the minimum value we can expect someone's sigma to reach
const TAU = 0.3;

const ORDINAL_SCALING = 25.0;
const ORDINAL_OFFSET = 1100.0;

export const slippiOrdinal = (rating: Rating) => {
  // The constants used get a range fairly close to glicko's range
  return ORDINAL_SCALING * (rating.mu - 3 * rating.sigma) + ORDINAL_OFFSET;
};

export const predictNewRating = (player: Player, opponent: Player): RatingPrediction => {
  const playerRating: Rating = {
    mu: player.rank?.current?.ratingMu ?? 25,
    sigma: player.rank?.current?.ratingSigma ?? 8.33,
  }

  const opponentRating: Rating = {
    mu: opponent.rank?.current?.ratingMu ?? 25,
    sigma: opponent.rank?.current?.ratingSigma ?? 8.33,
  }

  const options: Options = {
    tau: TAU,
    mu: 25,
    sigma: 25 / 3,
    limitSigma: true,
    preventSigmaIncrease: true,
  }

  const [[playerPotentialWinRating]] = rate([[playerRating], [opponentRating]], options);
  const [, [playerPotentialLossRating]] = rate([[opponentRating], [playerRating]], options);

  const playerPotentialWinRatingOrdinal = slippiOrdinal(playerPotentialWinRating);
  const playerPotentialLossRatingOrdinal = slippiOrdinal(playerPotentialLossRating);

  const predictedRating: RatingPrediction = {
    win: {
      mu: playerPotentialWinRating.mu,
      sigma: playerPotentialWinRating.sigma,
      ordinal: playerPotentialWinRatingOrdinal,
    },
    loss: {
      mu: playerPotentialLossRating.mu,
      sigma: playerPotentialLossRating.sigma,
      ordinal: playerPotentialLossRatingOrdinal,
    },
  }

  return predictedRating;
}
