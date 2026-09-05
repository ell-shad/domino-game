import React, { useState, useEffect } from 'react';
import { useMultiplayer } from './hooks/useMultiplayer';
import { LobbyView } from './components/LobbyView';
import { WaitingRoom } from './components/WaitingRoom';
import { GameHUD } from './components/GameHUD';
import { GameBoard } from './components/GameBoard';
import { PlayerHand } from './components/PlayerHand';
import { OpponentHand } from './components/OpponentHand';
import { RoundEndModal } from './components/RoundEndModal';
import { OrientationPrompt } from './components/OrientationPrompt';
import { ChatBubbleToast } from './components/ChatBubbleToast';
import { DominoTile, ClientRoomState } from './types';
import {
  createNewRound,
  executeDrawTile,
  executePassTurn,
  executePlayTile,
  FullServerGameState,
  getValidPlacementEnds,
} from './gameLogic';
import { computeBotMove } from './components/SoloBot';
import { audio } from './utils/audio';
import {
  isAppFullscreen,
  requestAppFullscreen,
  exitAppFullscreen,
} from './utils/orientation';

export default function App() {
  // Multiplayer state hook
  const {
    roomState,
    errorMessage,
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
  } = useMultiplayer();

  // Local / Solo Mode State
  const [isSoloMode, setIsSoloMode] = useState<boolean>(false);
  const [soloTargetScore, setSoloTargetScore] = useState<number>(100);
  const [soloMatchScores, setSoloMatchScores] = useState<[number, number]>([0, 0]);
  const [soloServerGame, setSoloServerGame] = useState<FullServerGameState | null>(null);

  // Overall App & Table Themes
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('domino_app_theme') as 'dark' | 'light') || 'dark';
  });
  const [tileTheme, setTileTheme] = useState<'ivory' | 'ebony'>(() => {
    return (localStorage.getItem('domino_tile_theme') as 'ivory' | 'ebony') || 'ivory';
  });
  const [boardTheme, setBoardTheme] = useState<'felt-green' | 'felt-slate' | 'felt-walnut'>(() => {
    return (
      (localStorage.getItem('domino_board_theme') as
        | 'felt-green'
        | 'felt-slate'
        | 'felt-walnut') || 'felt-green'
    );
  });
  const [isMuted, setIsMuted] = useState<boolean>(audio.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isAppFullscreen());
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Interaction State
  const [selectedTile, setSelectedTile] = useState<DominoTile | null>(null);

  // Detect mobile device, orientation, and fullscreen changes
  useEffect(() => {
    const checkState = () => {
      const isMobile =
        Math.min(window.innerWidth, window.innerHeight) < 768 ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && window.innerWidth < 1024);
      const portrait = window.innerHeight > window.innerWidth;
      const fullscreen = isAppFullscreen();

      setIsMobileDevice(isMobile);
      setIsPortrait(portrait);
      setIsFullscreen(fullscreen);
    };

    checkState();
    window.addEventListener('resize', checkState);
    window.addEventListener('orientationchange', checkState);
    document.addEventListener('fullscreenchange', checkState);
    document.addEventListener('webkitfullscreenchange', checkState);

    return () => {
      window.removeEventListener('resize', checkState);
      window.removeEventListener('orientationchange', checkState);
      document.removeEventListener('fullscreenchange', checkState);
      document.removeEventListener('webkitfullscreenchange', checkState);
    };
  }, []);

  // Android Back Button & Navigation Interceptor
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If user pressed back during an active game on mobile:
      // Force exit fullscreen to trigger pause overlay cleanly
      if (isAppFullscreen()) {
        exitAppFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleToggleFullscreen = async () => {
    if (isFullscreen) {
      await exitAppFullscreen();
    } else {
      window.history.pushState({ inGame: true }, '');
      await requestAppFullscreen();
    }
  };

  // Auto-join from URL parameter ?room=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomState && !isSoloMode) {
      joinRoom(roomParam);
    }
  }, [joinRoom, roomState, isSoloMode]);

  const handleToggleAppTheme = () => {
    setAppTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('domino_app_theme', next);
      return next;
    });
  };

  const handleToggleTileTheme = () => {
    setTileTheme((prev) => {
      const next = prev === 'ivory' ? 'ebony' : 'ivory';
      localStorage.setItem('domino_tile_theme', next);
      return next;
    });
  };

  const handleCycleBoardTheme = () => {
    setBoardTheme((prev) => {
      let next: 'felt-green' | 'felt-slate' | 'felt-walnut' = 'felt-green';
      if (prev === 'felt-green') next = 'felt-slate';
      else if (prev === 'felt-slate') next = 'felt-walnut';
      else next = 'felt-green';
      localStorage.setItem('domino_board_theme', next);
      return next;
    });
  };

  const handleToggleMute = () => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
  };

  // Convert solo state to unified ClientRoomState view
  const activeRoomState: ClientRoomState | null =
    isSoloMode && soloServerGame
      ? {
          code: 'SOLO',
          players: [
            { id: 'p0', name: playerName || 'Player 1', connected: true, isReady: true },
            { id: 'bot', name: 'Bot (AI)', connected: true, isReady: true },
          ],
          targetScore: soloTargetScore,
          matchScores: soloMatchScores,
          game: {
            round: soloServerGame.round,
            board: soloServerGame.board,
            leftOpen: soloServerGame.leftOpen,
            rightOpen: soloServerGame.rightOpen,
            myHand: soloServerGame.hands[0],
            opponentHandCount: soloServerGame.hands[1].length,
            opponentHandTiles:
              soloServerGame.status !== 'playing' ? soloServerGame.hands[1] : undefined,
            boneyardCount: soloServerGame.boneyard.length,
            turnPlayerIndex: soloServerGame.turnPlayerIndex,
            status: soloServerGame.status,
            roundWinner: soloServerGame.roundWinner,
            roundPointsWon: soloServerGame.roundPointsWon,
            isBlocked: soloServerGame.isBlocked,
            passStreak: soloServerGame.passStreak,
          },
          chat: [],
          readyPlayers: [0, 1],
          rematchVotes: [],
          myPlayerIndex: 0,
        }
      : roomState;

  // Active game indicators
  const activeGame = activeRoomState?.game;
  const myPlayerIndex = activeRoomState?.myPlayerIndex ?? -1;
  const isMyTurn =
    activeGame?.status === 'playing' && activeGame.turnPlayerIndex === myPlayerIndex;

  // Mobile landscape prohibition: if mobile device is turned to landscape, prompt to rotate back to portrait
  const isLandscapeOnMobile = isMobileDevice && !isPortrait;
  const isGamePausedOnMobile = activeGame !== undefined && isLandscapeOnMobile;

  // Push history state when entering active match
  useEffect(() => {
    if (activeGame && isMobileDevice) {
      window.history.pushState({ inGame: true }, '');
    }
  }, [activeGame !== undefined, isMobileDevice]);

  // Solo Bot AI Loop (paused if game paused on mobile)
  useEffect(() => {
    if (!isSoloMode || !soloServerGame || soloServerGame.status !== 'playing') return;
    if (isGamePausedOnMobile) return; // Pause AI moves while game is paused

    if (soloServerGame.turnPlayerIndex === 1) {
      const timer = setTimeout(() => {
        if (!soloServerGame || soloServerGame.turnPlayerIndex !== 1) return;

        const decision = computeBotMove(
          soloServerGame.hands[1],
          soloServerGame.leftOpen,
          soloServerGame.rightOpen,
          soloServerGame.boneyard.length
        );

        if (decision.action === 'play' && decision.tile && decision.end) {
          const res = executePlayTile(
            soloServerGame,
            1,
            decision.tile,
            decision.end
          );
          if (res.success && res.newState) {
            audio.playTileClack();
            if (res.newState.status === 'round_end') {
              const pts = res.newState.roundPointsWon || 0;
              const nextScores: [number, number] = [
                soloMatchScores[0],
                soloMatchScores[1] + pts,
              ];
              setSoloMatchScores(nextScores);
              if (nextScores[1] >= soloTargetScore) {
                res.newState.status = 'game_over';
                audio.playWinSound();
              } else {
                audio.playWinSound();
              }
            }
            setSoloServerGame(res.newState);
          }
        } else if (decision.action === 'draw') {
          const res = executeDrawTile(soloServerGame, 1);
          if (res.success && res.newState) {
            audio.playDrawSound();
            if (res.newState.status === 'round_end') {
              const winner = res.newState.roundWinner;
              const pts = res.newState.roundPointsWon || 0;
              const nextScores: [number, number] = [soloMatchScores[0], soloMatchScores[1]];
              if (winner !== undefined && winner !== 'tie') {
                nextScores[winner] += pts;
                setSoloMatchScores(nextScores);
                if (nextScores[winner] >= soloTargetScore) {
                  res.newState.status = 'game_over';
                }
              }
              audio.playWinSound();
            }
            setSoloServerGame(res.newState);
          }
        } else if (decision.action === 'pass') {
          const res = executePassTurn(soloServerGame, 1);
          if (res.success && res.newState) {
            audio.playPassSound();
            if (res.newState.status === 'round_end') {
              const winner = res.newState.roundWinner;
              const pts = res.newState.roundPointsWon || 0;
              const nextScores: [number, number] = [soloMatchScores[0], soloMatchScores[1]];
              if (winner !== undefined && winner !== 'tie') {
                nextScores[winner] += pts;
                setSoloMatchScores(nextScores);
                if (nextScores[winner] >= soloTargetScore) {
                  res.newState.status = 'game_over';
                }
              }
            }
            setSoloServerGame(res.newState);
          }
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isSoloMode, soloServerGame, soloMatchScores, soloTargetScore, isGamePausedOnMobile]);

  // Solo Mode Handlers
  const handleStartSolo = (target: number) => {
    setIsSoloMode(true);
    setSoloTargetScore(target);
    setSoloMatchScores([0, 0]);
    const initialGame = createNewRound(1, undefined);
    setSoloServerGame(initialGame);
    audio.playDealSound();
  };

  const handleSoloPlayTile = (tile: DominoTile, end: 'left' | 'right') => {
    if (!soloServerGame || soloServerGame.turnPlayerIndex !== 0 || isGamePausedOnMobile) return;
    const res = executePlayTile(soloServerGame, 0, tile, end);
    if (res.success && res.newState) {
      setSelectedTile(null);
      audio.playTileClack();
      if (res.newState.status === 'round_end') {
        const pts = res.newState.roundPointsWon || 0;
        const nextScores: [number, number] = [
          soloMatchScores[0] + pts,
          soloMatchScores[1],
        ];
        setSoloMatchScores(nextScores);
        if (nextScores[0] >= soloTargetScore) {
          res.newState.status = 'game_over';
        }
        audio.playWinSound();
      }
      setSoloServerGame(res.newState);
    }
  };

  const handleSoloDrawTile = () => {
    if (!soloServerGame || soloServerGame.turnPlayerIndex !== 0 || isGamePausedOnMobile) return;
    const res = executeDrawTile(soloServerGame, 0);
    if (res.success && res.newState) {
      audio.playDrawSound();
      if (res.newState.status === 'round_end') {
        const winner = res.newState.roundWinner;
        const pts = res.newState.roundPointsWon || 0;
        const nextScores: [number, number] = [soloMatchScores[0], soloMatchScores[1]];
        if (winner !== undefined && winner !== 'tie') {
          nextScores[winner] += pts;
          setSoloMatchScores(nextScores);
          if (nextScores[winner] >= soloTargetScore) {
            res.newState.status = 'game_over';
          }
        }
        audio.playWinSound();
      }
      setSoloServerGame(res.newState);
    }
  };

  const handleSoloPassTurn = () => {
    if (!soloServerGame || soloServerGame.turnPlayerIndex !== 0 || isGamePausedOnMobile) return;
    const res = executePassTurn(soloServerGame, 0);
    if (res.success && res.newState) {
      audio.playPassSound();
      if (res.newState.status === 'round_end') {
        const winner = res.newState.roundWinner;
        const pts = res.newState.roundPointsWon || 0;
        const nextScores: [number, number] = [soloMatchScores[0], soloMatchScores[1]];
        if (winner !== undefined && winner !== 'tie') {
          nextScores[winner] += pts;
          setSoloMatchScores(nextScores);
          if (nextScores[winner] >= soloTargetScore) {
            res.newState.status = 'game_over';
          }
        }
      }
      setSoloServerGame(res.newState);
    }
  };

  const handleSoloNextRound = () => {
    if (!soloServerGame) return;
    const nextRoundNum = soloServerGame.round + 1;
    const nextGame = createNewRound(nextRoundNum, soloServerGame.roundWinner);
    setSoloServerGame(nextGame);
    audio.playDealSound();
  };

  const handleSoloRematch = () => {
    setSoloMatchScores([0, 0]);
    const initialGame = createNewRound(1, undefined);
    setSoloServerGame(initialGame);
    audio.playDealSound();
  };

  const handleSoloLeave = () => {
    setIsSoloMode(false);
    setSoloServerGame(null);
    setSelectedTile(null);
  };

  const validEndsForSelected =
    selectedTile && activeGame
      ? getValidPlacementEnds(selectedTile, activeGame.leftOpen, activeGame.rightOpen)
      : [];

  const handlePlaceTile = (end: 'left' | 'right') => {
    if (!selectedTile || isGamePausedOnMobile) return;
    if (isSoloMode) {
      handleSoloPlayTile(selectedTile, end);
    } else {
      playTile(selectedTile, end);
      setSelectedTile(null);
    }
  };

  const handleDirectPlay = (tile: DominoTile, end: 'left' | 'right') => {
    if (isGamePausedOnMobile) return;
    if (isSoloMode) {
      handleSoloPlayTile(tile, end);
    } else {
      playTile(tile, end);
      setSelectedTile(null);
    }
  };

  const handleDraw = () => {
    if (isGamePausedOnMobile) return;
    if (isSoloMode) handleSoloDrawTile();
    else drawTile();
  };

  const handlePass = () => {
    if (isGamePausedOnMobile) return;
    if (isSoloMode) handleSoloPassTurn();
    else passTurn();
  };

  const handleNextRound = () => {
    if (isSoloMode) handleSoloNextRound();
    else nextRound();
  };

  const handleRematch = () => {
    if (isSoloMode) handleSoloRematch();
    else requestRematch();
  };

  const handleLeave = () => {
    if (isSoloMode) handleSoloLeave();
    else leaveRoom();
  };

  const isLight = appTheme === 'light';

  // 1. If not in a room and not in solo mode: Show Lobby
  if (!activeRoomState) {
    return (
      <main
        className={`min-h-screen w-full flex flex-col justify-center items-center font-sans antialiased p-4 transition-colors duration-300 ${
          isLight ? 'bg-[#F4F5F7] text-neutral-900' : 'bg-[#121316] text-neutral-100'
        }`}
      >
        <LobbyView
          playerName={playerName}
          onUpdatePlayerName={setPlayerName}
          onCreateRoom={(target) => createRoom(target)}
          onJoinRoom={(code) => joinRoom(code)}
          onStartSolo={handleStartSolo}
          errorMessage={errorMessage}
          theme={tileTheme}
          onToggleTheme={handleToggleTileTheme}
          appTheme={appTheme}
          onToggleAppTheme={handleToggleAppTheme}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </main>
    );
  }

  // 2. If in room but game hasn't started yet: Show Waiting Room
  if (!activeGame) {
    return (
      <main
        className={`min-h-screen w-full flex flex-col justify-center items-center font-sans antialiased p-4 transition-colors duration-300 ${
          isLight ? 'bg-[#F4F5F7] text-neutral-900' : 'bg-[#121316] text-neutral-100'
        }`}
      >
        <WaitingRoom
          roomState={activeRoomState}
          myPlayerIndex={myPlayerIndex}
          appTheme={appTheme}
          onToggleReady={toggleReady}
          onLeave={handleLeave}
        />
      </main>
    );
  }

  // 3. Active Domino Tabletop Screen (Strictly fitted within 100dvh with zero scrolling)
  const opponentIndex = (myPlayerIndex === 0 ? 1 : 0) as 0 | 1;
  const opponentPlayer = activeRoomState.players[opponentIndex];
  const opponentScore = activeRoomState.matchScores[opponentIndex];
  const isOpponentTurn =
    activeGame.status === 'playing' && activeGame.turnPlayerIndex === opponentIndex;

  const currentMyName =
    (myPlayerIndex === 0 || myPlayerIndex === 1
      ? activeRoomState.players[myPlayerIndex]?.name
      : null) ||
    playerName ||
    'Player 1';

  return (
    <main
      className={`h-[100dvh] max-h-[100dvh] w-full flex flex-col items-center justify-between p-1 sm:p-2 md:p-3 font-sans antialiased select-none overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-[#ECEEF2] text-neutral-900' : 'bg-[#101114] text-neutral-100'
      }`}
    >
      <div className="w-full max-w-5xl h-full flex flex-col items-center justify-between gap-1 sm:gap-1.5 overflow-hidden">
        {/* Top Game HUD Header */}
        <GameHUD
          roomState={activeRoomState}
          myPlayerIndex={myPlayerIndex}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          theme={tileTheme}
          onToggleTheme={handleToggleTileTheme}
          boardTheme={boardTheme}
          onCycleBoardTheme={handleCycleBoardTheme}
          appTheme={appTheme}
          onToggleAppTheme={handleToggleAppTheme}
          onLeave={handleLeave}
          onSendChat={sendChat}
          isSolo={isSoloMode}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          isMobileDevice={isMobileDevice}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen((prev) => !prev)}
        />

        {/* Opponent's Face-Down / Summary Hand Bar (Visible on desktop) */}
        <OpponentHand
          player={opponentPlayer}
          tileCount={activeGame.opponentHandCount}
          revealedTiles={activeGame.opponentHandTiles}
          isTheirTurn={isOpponentTurn}
          theme={tileTheme}
          appTheme={appTheme}
          score={opponentScore}
        />

        {/* Central Domino Game Board & Chain (Flex-1 dynamic sizing) */}
        <GameBoard
          board={activeGame.board}
          leftOpen={activeGame.leftOpen}
          rightOpen={activeGame.rightOpen}
          selectedTile={selectedTile}
          validEndsForSelected={validEndsForSelected}
          onPlaceTile={handlePlaceTile}
          isMyTurn={isMyTurn}
          theme={tileTheme}
          boardTheme={boardTheme}
          appTheme={appTheme}
        />

        {/* Player's Interactive Hand & Controls Dock */}
        <PlayerHand
          hand={activeGame.myHand}
          leftOpen={activeGame.leftOpen}
          rightOpen={activeGame.rightOpen}
          isMyTurn={isMyTurn}
          selectedTile={selectedTile}
          onSelectTile={(tile) => setSelectedTile(tile)}
          onDirectPlay={handleDirectPlay}
          boneyardCount={activeGame.boneyardCount}
          onDraw={handleDraw}
          onPass={handlePass}
          theme={tileTheme}
          appTheme={appTheme}
          disabled={activeGame.status !== 'playing' || isGamePausedOnMobile}
        />
      </div>

      {/* Real-time In-Game Chat Speech Bubble Toast */}
      {!isSoloMode && (
        <ChatBubbleToast
          chat={activeRoomState.chat}
          myPlayerName={currentMyName}
          onOpenChat={() => setIsChatOpen(true)}
          appTheme={appTheme}
        />
      )}

      {/* Round End / Match Won Modal */}
      <RoundEndModal
        roomState={activeRoomState}
        myPlayerIndex={myPlayerIndex}
        onNextRound={handleNextRound}
        onRematch={handleRematch}
        theme={tileTheme}
        appTheme={appTheme}
        isSolo={isSoloMode}
      />

      {/* Mobile Landscape Prohibition Prompt (shows only if phone turned to landscape) */}
      <OrientationPrompt
        isVisible={isGamePausedOnMobile}
        appTheme={appTheme}
        onLeave={handleLeave}
      />
    </main>
  );
}
