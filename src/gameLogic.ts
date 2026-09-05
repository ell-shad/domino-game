import { DominoGameState, DominoTile, BoardPlacement } from './types';

// Generate standard 28 Double-Six Domino tiles
export function generateDominoSet(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  return tiles;
}

// Fisher-Yates shuffle
export function shuffleTiles(tiles: DominoTile[]): DominoTile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function tilePipSum(tile: DominoTile): number {
  return tile[0] + tile[1];
}

export function handPipSum(hand: DominoTile[]): number {
  return hand.reduce((sum, tile) => sum + tilePipSum(tile), 0);
}

export function areTilesEqual(t1: DominoTile, t2: DominoTile): boolean {
  return (t1[0] === t2[0] && t1[1] === t2[1]) || (t1[0] === t2[1] && t1[1] === t2[0]);
}

export function isDouble(tile: DominoTile): boolean {
  return tile[0] === tile[1];
}

// Check which valid ends a tile can be played on
export function getValidPlacementEnds(
  tile: DominoTile,
  leftOpen: number | null,
  rightOpen: number | null
): ('left' | 'right')[] {
  if (leftOpen === null || rightOpen === null) {
    return ['left']; // First tile
  }

  const validEnds: ('left' | 'right')[] = [];
  const canLeft = tile[0] === leftOpen || tile[1] === leftOpen;
  const canRight = tile[0] === rightOpen || tile[1] === rightOpen;

  if (canLeft) validEnds.push('left');
  if (canRight) validEnds.push('right');

  return validEnds;
}

export function hasPlayableTile(
  hand: DominoTile[],
  leftOpen: number | null,
  rightOpen: number | null
): boolean {
  if (leftOpen === null || rightOpen === null) {
    return hand.length > 0;
  }
  return hand.some((tile) => getValidPlacementEnds(tile, leftOpen, rightOpen).length > 0);
}

// Find highest double or highest tile in hand
export function getHighestTile(hand: DominoTile[]): { tile: DominoTile; isDouble: boolean } | null {
  if (hand.length === 0) return null;

  const doubles = hand.filter(isDouble).sort((a, b) => b[0] - a[0]);
  if (doubles.length > 0) {
    return { tile: doubles[0], isDouble: true };
  }

  const sortedNonDoubles = [...hand].sort((a, b) => {
    const sumA = a[0] + a[1];
    const sumB = b[0] + b[1];
    if (sumB !== sumA) return sumB - sumA;
    return Math.max(b[0], b[1]) - Math.max(a[0], a[1]);
  });

  return { tile: sortedNonDoubles[0], isDouble: false };
}

// Determine starter between player 0 and player 1
export function determineStartingPlayer(
  hand0: DominoTile[],
  hand1: DominoTile[]
): 0 | 1 {
  const high0 = getHighestTile(hand0);
  const high1 = getHighestTile(hand1);

  if (!high0 && !high1) return 0;
  if (!high0) return 1;
  if (!high1) return 0;

  if (high0.isDouble && !high1.isDouble) return 0;
  if (!high0.isDouble && high1.isDouble) return 1;

  if (high0.isDouble && high1.isDouble) {
    return high0.tile[0] >= high1.tile[0] ? 0 : 1;
  }

  // Compare pip sum of highest tiles
  const sum0 = high0.tile[0] + high0.tile[1];
  const sum1 = high1.tile[0] + high1.tile[1];
  if (sum0 !== sum1) return sum0 > sum1 ? 0 : 1;

  return Math.max(high0.tile[0], high0.tile[1]) >= Math.max(high1.tile[0], high1.tile[1]) ? 0 : 1;
}

export type FullServerGameState = DominoGameState & {
  boneyard: DominoTile[];
};

// Initialize a new round
export function createNewRound(
  roundNumber: number,
  previousWinner: 0 | 1 | 'tie' | undefined
): FullServerGameState {
  const deck = shuffleTiles(generateDominoSet());
  const hand0 = deck.slice(0, 7);
  const hand1 = deck.slice(7, 14);
  const boneyard = deck.slice(14);

  let starter: 0 | 1;
  if (roundNumber === 1 || previousWinner === undefined || previousWinner === 'tie') {
    starter = determineStartingPlayer(hand0, hand1);
  } else {
    starter = previousWinner;
  }

  return {
    round: roundNumber,
    starterPlayerIndex: starter,
    turnPlayerIndex: starter,
    status: 'playing',
    board: [],
    boardPlacements: [],
    leftOpen: null,
    rightOpen: null,
    hands: [hand0, hand1],
    boneyard,
    boneyardCount: boneyard.length,
    consecutivePasses: 0,
    lastAction: {
      type: 'start',
      playerIndex: starter,
      message: `Round ${roundNumber} started. Player ${starter + 1}'s turn.`,
      timestamp: Date.now(),
    },
  };
}

export function executePlayTile(
  state: FullServerGameState,
  playerIndex: 0 | 1,
  tile: DominoTile,
  end: 'left' | 'right'
): { success: boolean; error?: string; newState?: FullServerGameState } {
  if (state.status !== 'playing') {
    return { success: false, error: 'Game is not in active playing state.' };
  }
  if (state.turnPlayerIndex !== playerIndex) {
    return { success: false, error: 'Not your turn.' };
  }

  const hand = state.hands[playerIndex];
  const tileIndex = hand.findIndex((t) => areTilesEqual(t, tile));
  if (tileIndex === -1) {
    return { success: false, error: 'Tile is not in your hand.' };
  }

  const playedTile = hand[tileIndex];
  const newHand = [...hand.slice(0, tileIndex), ...hand.slice(tileIndex + 1)];
  const newHands: [DominoTile[], DominoTile[]] =
    playerIndex === 0 ? [newHand, state.hands[1]] : [state.hands[0], newHand];

  let newBoard = [...state.board];
  let newLeftOpen = state.leftOpen;
  let newRightOpen = state.rightOpen;
  let placementTile: DominoTile = [...playedTile];
  let rotated = false;

  if (state.board.length === 0) {
    // First tile placed
    newBoard = [placementTile];
    newLeftOpen = placementTile[0];
    newRightOpen = placementTile[1];
  } else if (end === 'left') {
    if (newLeftOpen === null) return { success: false, error: 'Invalid board state.' };

    if (placementTile[1] === newLeftOpen) {
      // Matches directly: [a, b] where b == leftOpen
      newBoard.unshift(placementTile);
      newLeftOpen = placementTile[0];
    } else if (placementTile[0] === newLeftOpen) {
      // Needs flip: [b, a] -> [a, b]
      placementTile = [placementTile[1], placementTile[0]];
      rotated = true;
      newBoard.unshift(placementTile);
      newLeftOpen = placementTile[0];
    } else {
      return { success: false, error: `Tile [${playedTile[0]}|${playedTile[1]}] does not match left open pip ${newLeftOpen}.` };
    }
  } else {
    // end === 'right'
    if (newRightOpen === null) return { success: false, error: 'Invalid board state.' };

    if (placementTile[0] === newRightOpen) {
      // Matches directly: [a, b] where a == rightOpen
      newBoard.push(placementTile);
      newRightOpen = placementTile[1];
    } else if (placementTile[1] === newRightOpen) {
      // Needs flip: [b, a] -> [a, b]
      placementTile = [placementTile[1], placementTile[0]];
      rotated = true;
      newBoard.push(placementTile);
      newRightOpen = placementTile[1];
    } else {
      return { success: false, error: `Tile [${playedTile[0]}|${playedTile[1]}] does not match right open pip ${newRightOpen}.` };
    }
  }

  const placement: BoardPlacement = {
    tile: placementTile,
    placedBy: playerIndex,
    end,
    rotated,
    isDouble: isDouble(placementTile),
  };

  const newPlacements = [...state.boardPlacements, placement];
  const nextPlayerIndex = (1 - playerIndex) as 0 | 1;

  // Check round end: Domino (hand empty)
  if (newHand.length === 0) {
    const opponentHand = newHands[nextPlayerIndex];
    const pointsWon = handPipSum(opponentHand);
    return {
      success: true,
      newState: {
        ...state,
        hands: newHands,
        board: newBoard,
        boardPlacements: newPlacements,
        leftOpen: newLeftOpen,
        rightOpen: newRightOpen,
        consecutivePasses: 0,
        status: 'round_end',
        roundWinner: playerIndex,
        roundPointsWon: pointsWon,
        roundEndReason: 'domino',
        handScoresAtEnd: [handPipSum(newHands[0]), handPipSum(newHands[1])],
        lastAction: {
          type: 'play',
          playerIndex,
          tile: playedTile,
          end,
          message: `Player ${playerIndex + 1} played [${playedTile[0]}|${playedTile[1]}] and called Domino! (+${pointsWon} pts)`,
          timestamp: Date.now(),
        },
      },
    };
  }

  return {
    success: true,
    newState: {
      ...state,
      hands: newHands,
      board: newBoard,
      boardPlacements: newPlacements,
      leftOpen: newLeftOpen,
      rightOpen: newRightOpen,
      turnPlayerIndex: nextPlayerIndex,
      consecutivePasses: 0,
      lastAction: {
        type: 'play',
        playerIndex,
        tile: playedTile,
        end,
        message: `Player ${playerIndex + 1} played [${playedTile[0]}|${playedTile[1]}] on ${end}.`,
        timestamp: Date.now(),
      },
    },
  };
}

export function executeDrawTile(
  state: FullServerGameState,
  playerIndex: 0 | 1
): { success: boolean; error?: string; newState?: FullServerGameState; drawnTile?: DominoTile } {
  if (state.status !== 'playing') {
    return { success: false, error: 'Game is not in active playing state.' };
  }
  if (state.turnPlayerIndex !== playerIndex) {
    return { success: false, error: 'Not your turn.' };
  }
  if (state.boneyard.length === 0) {
    return { success: false, error: 'Boneyard is empty.' };
  }

  const drawnTile = state.boneyard[0];
  const newBoneyard = state.boneyard.slice(1);
  const currentHand = state.hands[playerIndex];
  const newHand = [...currentHand, drawnTile];
  const newHands: [DominoTile[], DominoTile[]] =
    playerIndex === 0 ? [newHand, state.hands[1]] : [state.hands[0], newHand];

  const hasPlayable = hasPlayableTile(newHand, state.leftOpen, state.rightOpen);
  const nextPlayerIndex = (1 - playerIndex) as 0 | 1;

  // If all spare tiles are out (boneyard is empty) and the player STILL has no playable tile:
  if (newBoneyard.length === 0 && !hasPlayable) {
    const opponentHand = newHands[nextPlayerIndex];
    const opponentHasPlayable = hasPlayableTile(opponentHand, state.leftOpen, state.rightOpen);

    // If opponent also has no playable tiles and boneyard is empty -> Game is blocked!
    if (!opponentHasPlayable) {
      const sum0 = handPipSum(newHands[0]);
      const sum1 = handPipSum(newHands[1]);

      let roundWinner: 0 | 1 | 'tie' = 'tie';
      let pointsWon = 0;

      if (sum0 < sum1) {
        roundWinner = 0;
        pointsWon = sum1 - sum0;
      } else if (sum1 < sum0) {
        roundWinner = 1;
        pointsWon = sum0 - sum1;
      }

      return {
        success: true,
        drawnTile,
        newState: {
          ...state,
          boneyard: newBoneyard,
          boneyardCount: 0,
          hands: newHands,
          consecutivePasses: 2,
          status: 'round_end',
          roundWinner,
          roundPointsWon: pointsWon,
          roundEndReason: 'blocked',
          handScoresAtEnd: [sum0, sum1],
          lastAction: {
            type: 'draw',
            playerIndex,
            message:
              roundWinner === 'tie'
                ? `Boneyard empty and game blocked! Both players tied with ${sum0} pips.`
                : `Boneyard empty and game blocked! Player ${roundWinner + 1} wins (+${pointsWon} pts difference, ${Math.min(sum0, sum1)} vs ${Math.max(sum0, sum1)} pips).`,
            timestamp: Date.now(),
          },
        },
      };
    }

    // Otherwise, current player has no playable tiles and boneyard is exhausted -> skip/pass turn to opponent
    return {
      success: true,
      drawnTile,
      newState: {
        ...state,
        boneyard: newBoneyard,
        boneyardCount: 0,
        hands: newHands,
        turnPlayerIndex: nextPlayerIndex,
        consecutivePasses: 1,
        lastAction: {
          type: 'draw',
          playerIndex,
          message: `Player ${playerIndex + 1} drew last spare tile. No matching tiles — passing turn to Player ${nextPlayerIndex + 1}.`,
          timestamp: Date.now(),
        },
      },
    };
  }

  return {
    success: true,
    drawnTile,
    newState: {
      ...state,
      boneyard: newBoneyard,
      boneyardCount: newBoneyard.length,
      hands: newHands,
      consecutivePasses: 0,
      lastAction: {
        type: 'draw',
        playerIndex,
        message: `Player ${playerIndex + 1} drew a tile from the boneyard.`,
        timestamp: Date.now(),
      },
    },
  };
}

export function executePassTurn(
  state: FullServerGameState,
  playerIndex: 0 | 1
): { success: boolean; error?: string; newState?: FullServerGameState } {
  if (state.status !== 'playing') {
    return { success: false, error: 'Game is not in active playing state.' };
  }
  if (state.turnPlayerIndex !== playerIndex) {
    return { success: false, error: 'Not your turn.' };
  }

  const hand = state.hands[playerIndex];
  if (hasPlayableTile(hand, state.leftOpen, state.rightOpen)) {
    return { success: false, error: 'You have a playable tile and cannot pass.' };
  }
  if (state.boneyard.length > 0) {
    return { success: false, error: 'Boneyard is not empty. You must draw before passing.' };
  }

  const nextPlayerIndex = (1 - playerIndex) as 0 | 1;
  const newConsecutivePasses = state.consecutivePasses + 1;

  // Check if both players passed consecutively -> Blocked Game
  if (newConsecutivePasses >= 2) {
    const sum0 = handPipSum(state.hands[0]);
    const sum1 = handPipSum(state.hands[1]);

    let roundWinner: 0 | 1 | 'tie' = 'tie';
    let pointsWon = 0;

    if (sum0 < sum1) {
      roundWinner = 0;
      pointsWon = sum1 - sum0;
    } else if (sum1 < sum0) {
      roundWinner = 1;
      pointsWon = sum0 - sum1;
    }

    return {
      success: true,
      newState: {
        ...state,
        consecutivePasses: newConsecutivePasses,
        status: 'round_end',
        roundWinner,
        roundPointsWon: pointsWon,
        roundEndReason: 'blocked',
        handScoresAtEnd: [sum0, sum1],
        lastAction: {
          type: 'pass',
          playerIndex,
          message:
            roundWinner === 'tie'
              ? `Game blocked! Both players tied with ${sum0} pips.`
              : `Game blocked! Player ${roundWinner + 1} wins (+${pointsWon} pts, ${Math.min(sum0, sum1)} vs ${Math.max(sum0, sum1)} pips).`,
          timestamp: Date.now(),
        },
      },
    };
  }

  return {
    success: true,
    newState: {
      ...state,
      turnPlayerIndex: nextPlayerIndex,
      consecutivePasses: newConsecutivePasses,
      lastAction: {
        type: 'pass',
        playerIndex,
        message: `Player ${playerIndex + 1} passed their turn.`,
        timestamp: Date.now(),
      },
    },
  };
}
