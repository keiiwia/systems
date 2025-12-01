const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { generatePrompt } = require('./prompts');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public')));

// game state
let waitingSocket = null;
const games = new Map();

// pair two players and start a new game
function createGame(playerA, playerB) {
  const roomId = `room-${playerA.id}-${playerB.id}`;
  const prompt = generatePrompt();

  playerA.join(roomId);
  playerB.join(roomId);

  playerA.data.roomId = roomId;
  playerB.data.roomId = roomId;

  const game = {
    id: roomId,
    players: [playerA.id, playerB.id],
    sockets: {
      [playerA.id]: playerA,
      [playerB.id]: playerB,
    },
    prompt,
    currentSegmentIndex: 0,
    activePlayerIndex: 0,
    segmentsData: new Array(prompt.segments.length).fill(null),
    guesses: {},
    status: 'in-progress',
  };

  games.set(roomId, game);

  io.to(roomId).emit('game:start', {
    segments: prompt.segments.map((segment, index) => ({
      label: segment.label,
      index,
    })),
  });

  sendTurnUpdate(game);
}

// Notify players whose turn it is
function sendTurnUpdate(game) {
  if (game.status !== 'in-progress') return;

  const segmentIndex = game.currentSegmentIndex;
  const segmentMeta = game.prompt.segments[segmentIndex];
  const activePlayerId = game.players[game.activePlayerIndex];

  io.to(game.id).emit('turn:waiting', {
    segmentIndex,
    segmentLabel: segmentMeta.label,
    activePlayer: activePlayerId,
  });

  io.to(activePlayerId).emit('turn:start', {
    promptClue: segmentMeta.clue,
  });
}

// Move game to guessing phase
function concludeGame(game) {
  game.status = 'awaiting-guesses';
  io.to(game.id).emit('game:final', {
    segmentsData: game.segmentsData,
    promptSummary: game.prompt.summary,
  });
}

function cleanupGame(game) {
  game.players.forEach((playerId) => {
    const socket = game.sockets[playerId];
    if (socket) {
      socket.leave(game.id);
      socket.data.roomId = null;
    }
  });
  games.delete(game.id);
}

function getGameBySocket(socketId) {
  for (const game of games.values()) {
    if (game.players.includes(socketId)) {
      return game;
    }
  }
  return null;
}

function handleDisconnect(socket) {
  if (waitingSocket && waitingSocket.id === socket.id) {
    waitingSocket = null;
    return;
  }

  const game = getGameBySocket(socket.id);
  if (!game) return;

  io.to(game.id).emit('game:ended', {
    reason: 'A player disconnected.',
  });
  cleanupGame(game);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  if (waitingSocket && waitingSocket.connected) {
    createGame(waitingSocket, socket);
    waitingSocket = null;
  } else {
    waitingSocket = socket;
    socket.emit('status:waiting', {
      message: 'Waiting for another artist to connect...',
    });
  }

  socket.on('stroke', ({ segmentIndex, stroke }) => {
    const game = getGameBySocket(socket.id);
    if (!game || game.status !== 'in-progress') return;
    if (segmentIndex !== game.currentSegmentIndex) return;

    const activePlayerId = game.players[game.activePlayerIndex];
    if (socket.id !== activePlayerId) return;

    io.to(game.id).emit('stroke', {
      segmentIndex,
      stroke,
    });
  });

  socket.on('segment:complete', ({ segmentIndex, imageData }) => {
    const game = getGameBySocket(socket.id);
    if (!game || game.status !== 'in-progress') return;
    if (segmentIndex !== game.currentSegmentIndex) return;

    const activePlayerId = game.players[game.activePlayerIndex];
    if (socket.id !== activePlayerId) return;

    game.segmentsData[segmentIndex] = imageData;
    io.to(game.id).emit('segment:committed', {
      segmentIndex,
      imageData,
    });

    game.currentSegmentIndex += 1;
    game.activePlayerIndex = (game.activePlayerIndex + 1) % game.players.length;

    if (game.currentSegmentIndex >= game.prompt.segments.length) {
      concludeGame(game);
    } else {
      sendTurnUpdate(game);
    }
  });

  socket.on('promptGuess', ({ guess }) => {
    const game = getGameBySocket(socket.id);
    if (!game || game.status !== 'awaiting-guesses') return;

    game.guesses[socket.id] = guess;
    if (Object.keys(game.guesses).length === game.players.length) {
      io.to(game.id).emit('game:reveal', {
        promptSummary: game.prompt.summary,
        guesses: game.guesses,
      });
      game.status = 'completed';
      cleanupGame(game);
    }
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Exquisite Corpse server listening on http://localhost:${PORT}`);
  console.log(`Also accessible at http://149.31.163.163:${PORT}`);
});

