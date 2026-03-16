require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// Routes publiques
app.use('/api/auth', authRoutes);

// Route protégée
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ─── Gestion des salles Socket.io ────────────────────────────────────────────
// rooms : Map<roomId, Map<socketId, { id, username, instrument }>>
const rooms = new Map();

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join_room', ({ roomId, userId, username }) => {
    currentRoom = roomId;
    currentUser = { id: userId, username, instrument: null };

    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    const room = rooms.get(roomId);
    room.set(socket.id, currentUser);

    socket.join(roomId);

    // Envoyer l'état complet de la salle au nouveau joueur
    socket.emit('room_state', { players: [...room.values()] });

    // Informer les autres joueurs
    socket.to(roomId).emit('player_joined', { player: currentUser });
  });

  socket.on('choose_instrument', ({ instrument }) => {
    if (!currentRoom || !currentUser) return;
    currentUser.instrument = instrument;
    io.to(currentRoom).emit('instrument_chosen', { userId: currentUser.id, instrument });
  });

  socket.on('note_on', ({ note, instrument }) => {
    if (!currentRoom || !currentUser) return;
    socket.to(currentRoom).emit('note_on', { userId: currentUser.id, note, instrument });
  });

  socket.on('note_off', ({ note }) => {
    if (!currentRoom || !currentUser) return;
    socket.to(currentRoom).emit('note_off', { userId: currentUser.id, note });
  });

  socket.on('disconnect', () => {
    if (!currentRoom || !currentUser) return;
    const room = rooms.get(currentRoom);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) rooms.delete(currentRoom);
    }
    io.to(currentRoom).emit('player_left', { userId: currentUser.id });
  });
});

const PORT = process.env.PORT || 3001;

// Liste des sessions actives
app.get('/api/sessions', authMiddleware, (req, res) => {
  const list = Object.entries(sessions).map(([sessionId, players]) => ({
    sessionId,
    participantCount: players.size,
    participants: [...players.values()].map(({ userName, instrument }) => ({ userName, instrument })),
  }));
  res.json(list);
});

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

    // Confirmer à l'utilisateur qu'il a rejoint
    socket.emit('session_joined', { sessionId, participants });

    // Informer les autres participants
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
