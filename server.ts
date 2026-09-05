import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  ClientGameState,
  ClientRoomState,
  DominoTile,
  PlayerInfo,
  WSClientMessage,
  WSServerMessage,
} from './src/types';
import {
  createNewRound,
  executeDrawTile,
  executePassTurn,
  executePlayTile,
  FullServerGameState,
} from './src/gameLogic';

const PORT = 3000;
const app = express();
app.use(express.json());

interface ConnectedSocket {
  ws: WebSocket;
  playerId: string;
  roomCode?: string;
  isAlive: boolean;
}

interface ServerRoom {
  code: string;
  players: [PlayerInfo | null, PlayerInfo | null];
  targetScore: number;
  matchScores: [number, number];
  serverGame: FullServerGameState | null;
  chat: { id: string; sender: string; senderIndex: 0 | 1; text: string; timestamp: number }[];
  rematchVotes: string[];
  lastActive: number;
}

const rooms = new Map<string, ServerRoom>();
const sockets = new Map<WebSocket, ConnectedSocket>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function getClientRoomState(room: ServerRoom, playerIndex: 0 | 1 | -1): ClientRoomState {
  let clientGame: ClientGameState | null = null;

  if (room.serverGame) {
    const isRoundOver =
      room.serverGame.status === 'round_end' || room.serverGame.status === 'game_over';

    let myHand: DominoTile[] = [];
    let opponentHandCount = 0;
    let opponentHandTiles: DominoTile[] | undefined = undefined;

    if (playerIndex === 0) {
      myHand = room.serverGame.hands[0];
      opponentHandCount = room.serverGame.hands[1].length;
      if (isRoundOver) {
        opponentHandTiles = room.serverGame.hands[1];
      }
    } else if (playerIndex === 1) {
      myHand = room.serverGame.hands[1];
      opponentHandCount = room.serverGame.hands[0].length;
      if (isRoundOver) {
        opponentHandTiles = room.serverGame.hands[0];
      }
    } else {
      // Spectator view
      if (isRoundOver) {
        opponentHandTiles = room.serverGame.hands[1];
        myHand = room.serverGame.hands[0];
      }
      opponentHandCount = room.serverGame.hands[1].length;
    }

    const { boneyard, hands, ...safeGameState } = room.serverGame;

    clientGame = {
      ...safeGameState,
      myHand,
      opponentHandCount,
      opponentHandTiles,
      myPlayerIndex: playerIndex,
    };
  }

  return {
    code: room.code,
    players: room.players,
    targetScore: room.targetScore,
    matchScores: room.matchScores,
    game: clientGame,
    chat: room.chat,
    myPlayerIndex: playerIndex,
    rematchVotes: room.rematchVotes,
  };
}

function broadcastRoom(room: ServerRoom, soundAction?: 'play' | 'draw' | 'pass' | 'win' | 'deal' | 'domino') {
  for (const [ws, sock] of sockets.entries()) {
    if (sock.roomCode === room.code && ws.readyState === WebSocket.OPEN) {
      const pIndex = room.players.findIndex((p) => p && p.id === sock.playerId) as 0 | 1 | -1;
      const clientState = getClientRoomState(room, pIndex);
      const msg: WSServerMessage = { type: 'room_state', state: clientState };
      ws.send(JSON.stringify(msg));

      if (soundAction) {
        const soundMsg: WSServerMessage = { type: 'action_sound', action: soundAction };
        ws.send(JSON.stringify(soundMsg));
      }
    }
  }
}

function sendToSocket(ws: WebSocket, msg: WSServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// REST Health API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

// Periodic cleanup of abandoned rooms (> 4 hours old)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActive > 4 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Heartbeat ping interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const sock = sockets.get(ws);
      if (sock) {
        if (!sock.isAlive) {
          ws.terminate();
          return;
        }
        sock.isAlive = false;
        ws.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (ws) => {
    const sockInfo: ConnectedSocket = {
      ws,
      playerId: '',
      isAlive: true,
    };
    sockets.set(ws, sockInfo);

    ws.on('pong', () => {
      sockInfo.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString()) as WSClientMessage;

        if (parsed.type === 'ping') {
          sendToSocket(ws, { type: 'pong' });
          return;
        }

        if (parsed.type === 'create_room') {
          const roomCode = generateRoomCode();
          const pInfo: PlayerInfo = {
            id: parsed.playerId,
            name: parsed.playerName || 'Player 1',
            connected: true,
            isReady: false,
          };

          const newRoom: ServerRoom = {
            code: roomCode,
            players: [pInfo, null],
            targetScore: parsed.targetScore || 100,
            matchScores: [0, 0],
            serverGame: null,
            chat: [],
            rematchVotes: [],
            lastActive: Date.now(),
          };

          rooms.set(roomCode, newRoom);
          sockInfo.playerId = parsed.playerId;
          sockInfo.roomCode = roomCode;

          const clientState = getClientRoomState(newRoom, 0);
          sendToSocket(ws, { type: 'room_state', state: clientState });
          return;
        }

        if (parsed.type === 'join') {
          const room = rooms.get(parsed.roomCode.toUpperCase().trim());
          if (!room) {
            sendToSocket(ws, { type: 'error', message: 'Room not found. Please check the code.' });
            return;
          }

          room.lastActive = Date.now();
          sockInfo.playerId = parsed.playerId;
          sockInfo.roomCode = room.code;

          // Check if reconnecting as existing player
          const existingIndex = room.players.findIndex((p) => p && p.id === parsed.playerId);
          if (existingIndex !== -1) {
            const player = room.players[existingIndex]!;
            player.connected = true;
            if (parsed.playerName) player.name = parsed.playerName;
            broadcastRoom(room);
            return;
          }

          // Check for empty slot
          if (room.players[0] === null) {
            room.players[0] = {
              id: parsed.playerId,
              name: parsed.playerName || 'Player 1',
              connected: true,
              isReady: false,
            };
            broadcastRoom(room);
            return;
          } else if (room.players[1] === null) {
            room.players[1] = {
              id: parsed.playerId,
              name: parsed.playerName || 'Player 2',
              connected: true,
              isReady: false,
            };
            broadcastRoom(room);
            return;
          } else {
            // Room is full
            sendToSocket(ws, { type: 'error', message: 'Room is already full with 2 players.' });
            return;
          }
        }

        const room = parsed.roomCode ? rooms.get(parsed.roomCode) : undefined;
        if (!room) return;
        room.lastActive = Date.now();

        const playerIndex = room.players.findIndex((p) => p && p.id === parsed.playerId) as 0 | 1 | -1;

        if (parsed.type === 'ready') {
          if (playerIndex === -1) return;
          const player = room.players[playerIndex];
          if (player) {
            player.isReady = !player.isReady;
          }

          // If both players are ready and game not started, start round 1
          if (room.players[0]?.isReady && room.players[1]?.isReady && !room.serverGame) {
            room.serverGame = createNewRound(1, undefined);
            room.players[0].isReady = false;
            room.players[1].isReady = false;
            broadcastRoom(room, 'deal');
            return;
          }
          broadcastRoom(room);
          return;
        }

        if (parsed.type === 'play_tile') {
          if (playerIndex === -1 || !room.serverGame) return;
          const res = executePlayTile(room.serverGame, playerIndex, parsed.tile, parsed.end);
          if (res.success && res.newState) {
            room.serverGame = res.newState;

            if (res.newState.status === 'round_end') {
              if (res.newState.roundWinner !== undefined && res.newState.roundWinner !== 'tie') {
                const winnerIdx = res.newState.roundWinner;
                const pts = res.newState.roundPointsWon || 0;
                room.matchScores[winnerIdx] += pts;

                if (room.matchScores[winnerIdx] >= room.targetScore) {
                  res.newState.status = 'game_over';
                }
              }

              const sound = res.newState.status === 'game_over' ? 'win' : 'domino';
              broadcastRoom(room, sound);
            } else {
              broadcastRoom(room, 'play');
            }
          } else if (res.error) {
            sendToSocket(ws, { type: 'error', message: res.error });
          }
          return;
        }

        if (parsed.type === 'draw_tile') {
          if (playerIndex === -1 || !room.serverGame) return;
          const res = executeDrawTile(room.serverGame, playerIndex);
          if (res.success && res.newState) {
            room.serverGame = res.newState;

            if (res.newState.status === 'round_end') {
              if (res.newState.roundWinner !== undefined && res.newState.roundWinner !== 'tie') {
                const winnerIdx = res.newState.roundWinner;
                const pts = res.newState.roundPointsWon || 0;
                room.matchScores[winnerIdx] += pts;

                if (room.matchScores[winnerIdx] >= room.targetScore) {
                  res.newState.status = 'game_over';
                }
              }
              const sound = res.newState.status === 'game_over' ? 'win' : 'domino';
              broadcastRoom(room, sound);
            } else {
              broadcastRoom(room, 'draw');
            }
          } else if (res.error) {
            sendToSocket(ws, { type: 'error', message: res.error });
          }
          return;
        }

        if (parsed.type === 'pass_turn') {
          if (playerIndex === -1 || !room.serverGame) return;
          const res = executePassTurn(room.serverGame, playerIndex);
          if (res.success && res.newState) {
            room.serverGame = res.newState;

            if (res.newState.status === 'round_end') {
              if (res.newState.roundWinner !== undefined && res.newState.roundWinner !== 'tie') {
                const winnerIdx = res.newState.roundWinner;
                const pts = res.newState.roundPointsWon || 0;
                room.matchScores[winnerIdx] += pts;

                if (room.matchScores[winnerIdx] >= room.targetScore) {
                  res.newState.status = 'game_over';
                }
              }
              const sound = res.newState.status === 'game_over' ? 'win' : 'domino';
              broadcastRoom(room, sound);
            } else {
              broadcastRoom(room, 'pass');
            }
          } else if (res.error) {
            sendToSocket(ws, { type: 'error', message: res.error });
          }
          return;
        }

        if (parsed.type === 'next_round') {
          if (playerIndex === -1 || !room.serverGame) return;
          if (room.serverGame.status !== 'round_end') return;

          const prevWinner = room.serverGame.roundWinner;
          const nextRoundNum = room.serverGame.round + 1;
          room.serverGame = createNewRound(nextRoundNum, prevWinner);
          broadcastRoom(room, 'deal');
          return;
        }

        if (parsed.type === 'rematch') {
          if (playerIndex === -1) return;
          if (!room.rematchVotes.includes(parsed.playerId)) {
            room.rematchVotes.push(parsed.playerId);
          }

          const activePIds = room.players.filter((p) => p !== null).map((p) => p!.id);
          const allVoted = activePIds.length > 0 && activePIds.every((id) => room.rematchVotes.includes(id));

          if (allVoted) {
            room.matchScores = [0, 0];
            room.rematchVotes = [];
            room.serverGame = createNewRound(1, undefined);
            broadcastRoom(room, 'deal');
          } else {
            broadcastRoom(room);
          }
          return;
        }

        if (parsed.type === 'send_chat') {
          if (playerIndex === -1) return;
          const p = room.players[playerIndex];
          if (!p) return;
          const cleanText = parsed.text.trim().slice(0, 120);
          if (!cleanText) return;

          room.chat.push({
            id: Math.random().toString(36).substring(2, 9),
            sender: p.name,
            senderIndex: playerIndex,
            text: cleanText,
            timestamp: Date.now(),
          });
          if (room.chat.length > 20) {
            room.chat.shift();
          }
          broadcastRoom(room);
          return;
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      const info = sockets.get(ws);
      if (info && info.roomCode) {
        const room = rooms.get(info.roomCode);
        if (room) {
          const p = room.players.find((pl) => pl && pl.id === info.playerId);
          if (p) {
            p.connected = false;
            broadcastRoom(room);
          }
        }
      }
      sockets.delete(ws);
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Domino server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
