require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

// ─── Données partagées (In-Memory) ───────────────────────────────────────────
// rooms : Map<roomId, { title, host, players: Map<socketId, userData> }>
const rooms = new Map();

// ─── Routes API ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);

// Infos utilisateur connecté
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Liste des sessions actives
app.get("/api/sessions", authMiddleware, (req, res) => {
  const list = Array.from(rooms.entries()).map(([roomId, data]) => ({
    sessionId: roomId,
    title: data.title,
    host: data.host,
    participantCount: data.players.size,
    participants: Array.from(data.players.values()).map((p) => ({
      userName: p.username,
      instrument: p.instrument,
    })),
  }));
  res.json(list);
});

// Créer une nouvelle session
app.post("/api/sessions", authMiddleware, (req, res) => {
  const { title, nb_user, visibility } = req.body || {};
  const roomId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const sessionTitle = (title || "").trim() || `Session ${rooms.size + 1}`;

  rooms.set(roomId, {
    title: sessionTitle,
    host: req.user?.username || "Anonyme",
    nb_user: nb_user || null,
    visibility: visibility === "private" ? "private" : "public",
    players: new Map(),
  });

  res.status(201).json({
    sessionId: roomId,
    title: sessionTitle,
    host: req.user?.username || "Anonyme",
    nb_user: nb_user || null,
    visibility: visibility === "private" ? "private" : "public",
  });
});

// ─── Gestion Socket.io ───────────────────────────────────────────────────────

io.on("connection", (socket) => {
  let currentRoomId = null;
  let currentUser = null;

  socket.on("join_room", ({ roomId, userId, username }) => {
    if (!rooms.has(roomId)) {
      // Optionnel: créer la salle si elle n'existe pas encore via socket
      rooms.set(roomId, {
        title: "Salle improvisée",
        host: "Système",
        players: new Map(),
      });
    }

    const roomData = rooms.get(roomId);
    currentRoomId = roomId;
    currentUser = { id: userId, username, instrument: null };

    roomData.players.set(socket.id, currentUser);
    socket.join(roomId);

    // Syncronisation
    socket.emit("room_state", {
      players: Array.from(roomData.players.values()),
    });
    socket.to(roomId).emit("player_joined", { player: currentUser });
  });

  socket.on("choose_instrument", ({ instrument }) => {
    if (!currentRoomId || !currentUser) return;
    currentUser.instrument = instrument;
    io.to(currentRoomId).emit("instrument_chosen", {
      userId: currentUser.id,
      instrument,
    });
  });

  socket.on("note_on", ({ note, instrument }) => {
    if (!currentRoomId || !currentUser) return;
    socket
      .to(currentRoomId)
      .emit("note_on", { userId: currentUser.id, note, instrument });
  });

  socket.on("note_off", ({ note }) => {
    if (!currentRoomId || !currentUser) return;
    socket.to(currentRoomId).emit("note_off", { userId: currentUser.id, note });
  });

  socket.on("disconnect", () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const roomData = rooms.get(currentRoomId);
      roomData.players.delete(socket.id);

      if (roomData.players.size === 0) {
        rooms.delete(currentRoomId);
      } else {
        io.to(currentRoomId).emit("player_left", { userId: currentUser?.id });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur harmonisé sur http://localhost:${PORT}`);
});
