export type DominoTile = [number, number]; // e.g. [6, 6], [0, 4]

export type BoardPlacement = {
  tile: DominoTile;
  placedBy: 0 | 1;
  end: 'left' | 'right';
  rotated?: boolean; // if swapped [b, a] when placing
  isDouble?: boolean;
};

export type PlayerInfo = {
  id: string;
  name: string;
  connected: boolean;
  isReady: boolean;
};

export type GameStatus = 'waiting' | 'playing' | 'round_end' | 'game_over';

export type DominoGameState = {
  round: number;
  starterPlayerIndex: 0 | 1;
  turnPlayerIndex: 0 | 1;
  status: GameStatus;
  board: DominoTile[]; // ordered chain from left to right
  boardPlacements: BoardPlacement[];
  leftOpen: number | null;
  rightOpen: number | null;
  hands: [DominoTile[], DominoTile[]]; // Server side has both; Client only receives its own hand and count of other
  boneyardCount: number;
  consecutivePasses: number;
  lastAction?: {
    type: 'play' | 'draw' | 'pass' | 'start' | 'round_end';
    playerIndex: 0 | 1;
    tile?: DominoTile;
    end?: 'left' | 'right';
    message: string;
    timestamp: number;
  };
  roundWinner?: 0 | 1 | 'tie';
  roundPointsWon?: number;
  roundEndReason?: 'domino' | 'blocked';
  handScoresAtEnd?: [number, number]; // Pip sum left in hands
};

export type RoomState = {
  code: string;
  players: [PlayerInfo | null, PlayerInfo | null];
  targetScore: number;
  matchScores: [number, number]; // [player0, player1]
  game: DominoGameState | null;
  chat: { id: string; sender: string; senderIndex: 0 | 1; text: string; timestamp: number }[];
  rematchVotes: string[];
};

// Client view of the game state (where opponent's hand tiles are redacted to protect secret hands)
export type ClientGameState = Omit<DominoGameState, 'hands'> & {
  myHand: DominoTile[];
  opponentHandCount: number;
  opponentHandTiles?: DominoTile[]; // only revealed at round_end
  myPlayerIndex: 0 | 1 | -1; // -1 if spectator
};

export type ClientRoomState = {
  code: string;
  players: [PlayerInfo | null, PlayerInfo | null];
  targetScore: number;
  matchScores: [number, number];
  game: ClientGameState | null;
  chat: { id: string; sender: string; senderIndex: 0 | 1; text: string; timestamp: number }[];
  myPlayerIndex: 0 | 1 | -1;
  rematchVotes: string[];
};

export type WSClientMessage =
  | { type: 'join'; roomCode: string; playerId: string; playerName: string }
  | { type: 'create_room'; playerName: string; targetScore: number; playerId: string }
  | { type: 'ready'; roomCode: string; playerId: string }
  | { type: 'play_tile'; roomCode: string; playerId: string; tile: DominoTile; end: 'left' | 'right' }
  | { type: 'draw_tile'; roomCode: string; playerId: string }
  | { type: 'pass_turn'; roomCode: string; playerId: string }
  | { type: 'next_round'; roomCode: string; playerId: string }
  | { type: 'rematch'; roomCode: string; playerId: string }
  | { type: 'send_chat'; roomCode: string; playerId: string; text: string }
  | { type: 'ping' };

export type WSServerMessage =
  | { type: 'room_state'; state: ClientRoomState }
  | { type: 'error'; message: string }
  | { type: 'action_sound'; action: 'play' | 'draw' | 'pass' | 'win' | 'deal' | 'domino' }
  | { type: 'pong' };
