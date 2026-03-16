require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

// Routes publiques
app.use("/api/auth", authRoutes);

// Exemple de route protégée
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Liste des sessions actives
app.get("/api/sessions", authMiddleware, (req, res) => {
  const list = Object.entries(sessions).map(([sessionId, players]) => {
    const meta = sessionMetas[sessionId] || {};
    return {
      sessionId,
      title: meta.title || sessionId,
      host: meta.host || "Anonyme",
      participantCount: players.size,
      participants: [...players.values()].map(({ userName, instrument }) => ({
        userName,
        instrument,
      })),
    };
  });
  res.json(list);
});

// Créer une nouvelle session
app.post("/api/sessions", authMiddleware, (req, res) => {
  const { title } = req.body || {};
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const trimmedTitle = (title || "").trim();
  const sessionTitle =
    trimmedTitle || `Session ${Object.keys(sessions).length + 1}`;

  sessions[sessionId] = new Map();
  sessionMetas[sessionId] = {
    title: sessionTitle,
    host: req.user?.name || "Anonyme",
  };

  res.status(201).json({
    sessionId,
    title: sessionTitle,
    host: sessionMetas[sessionId].host,
    participantCount: 0,
    participants: [],
  });
});
