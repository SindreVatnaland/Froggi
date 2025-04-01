import { rate, Rating } from 'openskill'
import { RatingPrediction } from '../../frontend/src/lib/models/types/slippiData';

// This value is approximately the minimum value we can expect someone's sigma to reach
const TAU = 0.3;
const SIGMA_FLOOR = 2.592326021;

const ORDINAL_SCALING = 25.0;
const ORDINAL_OFFSET = 1100.0;
const MMR_SCALING = ORDINAL_SCALING;
const MMR_OFFSET = ORDINAL_OFFSET - (ORDINAL_SCALING * 3 * SIGMA_FLOOR);

export const slippiOrdinal = (rating: Rating) => {
  // The constants used get a range fairly close to glicko's range
  return ORDINAL_SCALING * (rating.mu - 3 * rating.sigma) + ORDINAL_OFFSET;
};

export const predictNewRating = (playerRating: Rating, opponentRating: Rating): RatingPrediction => {
  const [[playerPotentialWinRating]] = rate([[playerRating], [opponentRating]], { tau: TAU });
  const [, [playerPotentialLossRating]] = rate([[opponentRating], [playerRating]], { tau: TAU });

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

// Slippi MMR is similar to the ordinal but doesn't use the real sigma value. This is done so that
// new players start at about the average skill mmr instead of starting in the beginner mmrs.
// After a sufficient number of games, ordinal and mmr will match pretty closely
export const slippiMmr = (ratingMu: number) => {
  return MMR_SCALING * ratingMu + MMR_OFFSET;
};