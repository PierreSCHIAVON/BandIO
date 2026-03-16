require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Routes publiques
app.use('/api/auth', authRoutes);

// Exemple de route protégée
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

const PORT = process.env.PORT || 3001;

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
