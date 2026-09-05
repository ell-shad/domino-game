import { DominoTile } from '../types';
import { getValidPlacementEnds, isDouble, tilePipSum } from '../gameLogic';

export interface BotDecision {
  action: 'play' | 'draw' | 'pass';
  tile?: DominoTile;
  end?: 'left' | 'right';
}

export function computeBotMove(
  hand: DominoTile[],
  leftOpen: number | null,
  rightOpen: number | null,
  boneyardCount: number
): BotDecision {
  if (leftOpen === null || rightOpen === null) {
    // Opening move: play highest double, or highest pip tile
    const doubles = hand.filter(isDouble).sort((a, b) => b[0] - a[0]);
    if (doubles.length > 0) {
      return { action: 'play', tile: doubles[0], end: 'left' };
    }
    const sorted = [...hand].sort((a, b) => tilePipSum(b) - tilePipSum(a));
    return { action: 'play', tile: sorted[0] || [0, 0], end: 'left' };
  }

  // Find all playable options
  const playableOptions: { tile: DominoTile; end: 'left' | 'right'; score: number }[] = [];

  for (const tile of hand) {
    const validEnds = getValidPlacementEnds(tile, leftOpen, rightOpen);
    for (const end of validEnds) {
      let score = tilePipSum(tile); // prefer unloading high pips
      if (isDouble(tile)) score += 10; // prefer shedding doubles

      // Count how many matching tiles remain in hand for the newly opened end
      const resultingPip =
        end === 'left'
          ? (tile[1] === leftOpen ? tile[0] : tile[1])
          : (tile[0] === rightOpen ? tile[1] : tile[0]);

      const matchingTilesInHand = hand.filter(
        (t) => (t[0] === resultingPip || t[1] === resultingPip) && !(t[0] === tile[0] && t[1] === tile[1])
      ).length;

      score += matchingTilesInHand * 3;

      playableOptions.push({ tile, end, score });
    }
  }

  if (playableOptions.length > 0) {
    playableOptions.sort((a, b) => b.score - a.score);
    const chosen = playableOptions[0];
    return { action: 'play', tile: chosen.tile, end: chosen.end };
  }

  if (boneyardCount > 0) {
    return { action: 'draw' };
  }

  return { action: 'pass' };
}
