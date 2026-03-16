const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// sessions[sessionId] = Map<socketId, { userId, userName, instrument }>
const sessions = {};

io.on('connection', (socket) => {
  console.log(`[WS] connecté : ${socket.id}`);

  // Rejoindre une session avec un instrument
  // { sessionId, userId, userName, instrument }
  socket.on('join_session', ({ sessionId, userId, userName, instrument }) => {
    socket.join(sessionId);

    if (!sessions[sessionId]) sessions[sessionId] = new Map();
    sessions[sessionId].set(socket.id, { userId, userName, instrument });

    const participants = [...sessions[sessionId].values()];

    socket.emit('session_joined', { sessionId, participants });

    socket.to(sessionId).emit('participant_joined', { userId, userName, instrument });

    console.log(`[WS] ${userName} a rejoint la session ${sessionId} (${instrument})`);
  });

  // Jouer une note → redistribuer aux autres participants
  // { sessionId, instrument, note, velocity, type } type = 'noteOn' | 'noteOff'
  socket.on('play_note', ({ sessionId, instrument, note, velocity, type }) => {
    const session = sessions[sessionId];
    if (!session) return;

    const player = session.get(socket.id);
    if (!player) return;

    socket.to(sessionId).emit('note_played', {
      userId: player.userId,
      userName: player.userName,
      instrument,
      note,
      velocity,
      type,
    });
  });

  // Quitter une session
  socket.on('leave_session', ({ sessionId }) => {
    handleLeave(socket, sessionId);
  });

  // Déconnexion (fermeture navigateur, etc.)
  socket.on('disconnect', () => {
    for (const sessionId of socket.rooms) {
      if (sessions[sessionId]) handleLeave(socket, sessionId);
    }
    console.log(`[WS] déconnecté : ${socket.id}`);
  });
});

function handleLeave(socket, sessionId) {
  const session = sessions[sessionId];
  if (!session) return;

  const player = session.get(socket.id);
  if (!player) return;

  session.delete(socket.id);
  socket.leave(sessionId);

  if (session.size === 0) {
    delete sessions[sessionId];
  } else {
    socket.to(sessionId).emit('participant_left', {
      userId: player.userId,
      userName: player.userName,
    });
  }

  console.log(`[WS] ${player.userName} a quitté la session ${sessionId}`);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
