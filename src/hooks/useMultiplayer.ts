import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClientRoomState,
  DominoTile,
  WSClientMessage,
  WSServerMessage,
} from '../types';
import { audio } from '../utils/audio';

function getOrCreatePlayerId(): string {
  const key = 'domino_player_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(key, id);
  }
  return id;
}

function getStoredPlayerName(): string {
  return localStorage.getItem('domino_player_name') || 'Player';
}

export function useMultiplayer() {
  const [roomState, setRoomState] = useState<ClientRoomState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerId] = useState<string>(getOrCreatePlayerId);
  const [playerName, setPlayerNameState] = useState<string>(getStoredPlayerName);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoomCodeRef = useRef<string | null>(null);

  const setPlayerName = useCallback((name: string) => {
    const clean = name.trim().slice(0, 16) || 'Player';
    setPlayerNameState(clean);
    localStorage.setItem('domino_player_name', clean);
  }, []);

  // Send message over WebSocket
  const sendMessage = useCallback((msg: WSClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);

        // Auto rejoin room if we were in one
        if (currentRoomCodeRef.current) {
          sendMessage({
            type: 'join',
            roomCode: currentRoomCodeRef.current,
            playerId,
            playerName,
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSServerMessage;

          if (data.type === 'room_state') {
            setRoomState((prevState) => {
              // Trigger turn chime if it just became my turn
              const wasMyTurn =
                prevState?.game &&
                prevState.game.turnPlayerIndex === prevState.myPlayerIndex;
              const isNowMyTurn =
                data.state.game &&
                data.state.game.status === 'playing' &&
                data.state.game.turnPlayerIndex === data.state.myPlayerIndex;

              if (!wasMyTurn && isNowMyTurn) {
                audio.playYourTurnChime();
              }
              return data.state;
            });
            currentRoomCodeRef.current = data.state.code;
          } else if (data.type === 'error') {
            setErrorMessage(data.message);
          } else if (data.type === 'action_sound') {
            if (data.action === 'play') audio.playTileClack();
            else if (data.action === 'draw') audio.playDrawSound();
            else if (data.action === 'pass') audio.playPassSound();
            else if (data.action === 'deal') audio.playDealSound();
            else if (data.action === 'win' || data.action === 'domino') audio.playWinSound();
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 2 seconds
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error('WebSocket connection failure:', e);
    }
  }, [playerId, playerName, sendMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Keep alive ping
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' });
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [sendMessage]);

  // Room Actions
  const createRoom = useCallback(
    (targetScore: number = 100) => {
      setErrorMessage(null);
      sendMessage({
        type: 'create_room',
        playerName,
        targetScore,
        playerId,
      });
    },
    [playerName, playerId, sendMessage]
  );

  const joinRoom = useCallback(
    (roomCode: string) => {
      setErrorMessage(null);
      const cleanCode = roomCode.toUpperCase().trim();
      currentRoomCodeRef.current = cleanCode;
      sendMessage({
        type: 'join',
        roomCode: cleanCode,
        playerName,
        playerId,
      });
    },
    [playerName, playerId, sendMessage]
  );

  const toggleReady = useCallback(() => {
    if (!roomState) return;
    sendMessage({
      type: 'ready',
      roomCode: roomState.code,
      playerId,
    });
  }, [roomState, playerId, sendMessage]);

  const playTile = useCallback(
    (tile: DominoTile, end: 'left' | 'right') => {
      if (!roomState) return;
      sendMessage({
        type: 'play_tile',
        roomCode: roomState.code,
        playerId,
        tile,
        end,
      });
    },
    [roomState, playerId, sendMessage]
  );

  const drawTile = useCallback(() => {
    if (!roomState) return;
    sendMessage({
      type: 'draw_tile',
      roomCode: roomState.code,
      playerId,
    });
  }, [roomState, playerId, sendMessage]);

  const passTurn = useCallback(() => {
    if (!roomState) return;
    sendMessage({
      type: 'pass_turn',
      roomCode: roomState.code,
      playerId,
    });
  }, [roomState, playerId, sendMessage]);

  const nextRound = useCallback(() => {
    if (!roomState) return;
    sendMessage({
      type: 'next_round',
      roomCode: roomState.code,
      playerId,
    });
  }, [roomState, playerId, sendMessage]);

  const requestRematch = useCallback(() => {
    if (!roomState) return;
    sendMessage({
      type: 'rematch',
      roomCode: roomState.code,
      playerId,
    });
  }, [roomState, playerId, sendMessage]);

  const sendChat = useCallback(
    (text: string) => {
      if (!roomState) return;
      sendMessage({
        type: 'send_chat',
        roomCode: roomState.code,
        playerId,
        text,
      });
    },
    [roomState, playerId, sendMessage]
  );

  const leaveRoom = useCallback(() => {
    currentRoomCodeRef.current = null;
    setRoomState(null);
    setErrorMessage(null);
    // Remove query param from url
    if (window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  return {
    roomState,
    isConnected,
    errorMessage,
    playerId,
    playerName,
    setPlayerName,
    createRoom,
    joinRoom,
    toggleReady,
    playTile,
    drawTile,
    passTurn,
    nextRound,
    requestRematch,
    sendChat,
    leaveRoom,
  };
}
