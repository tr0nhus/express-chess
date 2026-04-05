# Express Chess

A fully functional chess platform built with Node.js, Express, and Socket.IO to learn web programming and WebSocket protocols.

## Description

This is a personal project I'm working on during my free time as a second-semester software engineering student at Aalborg University. The goal is to create a real-time chess game where players can join rooms and play against each other using WebSockets for communication.

## Features

- Real-time multiplayer chess
- Room-based gameplay
- WebSocket communication
- Simple web interface

## Technologies Used

- Node.js
- Express.js
- Socket.IO
- HTML/CSS/JavaScript

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repo-url>
   cd express-chess
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application:
   ```
   node node/app.js
   ```

4. Open your browser and go to `http://localhost:3000`

## Usage

- Enter a room code to join or create a game
- Play as white or black
- Make moves in real-time

## Future Work

Here are some potential features and improvements I'm considering for future development:

- **AI Opponent**: Implement an AI engine so players can play against the computer when no human opponent is available.
- **Enhanced Room UI**: Improve the room creation and joining interface with better user experience, such as auto-generated room codes, room listings, or invite links.
- **Win Registration and Checkmate Detection**: Implement automatic detection of checkmate, stalemate, and other win conditions, with proper game end notifications.
- **Additional Chess Rules**: Full support for en passant, pawn promotion, and other special moves.
- **Game History and Replay**: Allow players to view past games or replay moves.
- **User Accounts**: Add user registration and login for persistent game statistics and friend lists.