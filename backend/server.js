require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
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
httpServer.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
