# Dominoes Online

A minimalist real-time two-player domino game for playing with friends via room codes. Created using Google AI Studio.

Live site: https://domino-game.ai.studio/

![Dominoes Online main page](assets/screenshot.png)

## Features

- Real-time multiplayer over WebSockets: create a room, share the 4-character room code (or invite link), and play.
- Standard draw-dominoes rules: 28-tile set, highest double opens, draw from the boneyard when you cannot play, pass if the boneyard is empty.
- Round ends when a player plays their last tile ("domino") or the game is blocked; the blocker with fewer pips wins the difference.
- Configurable target score per match (default 100 points), multi-round matches, and rematch voting.
- In-game chat, sound effects, and a solo/practice mode against a local bot.
- Mobile-friendly layout with orientation handling.
