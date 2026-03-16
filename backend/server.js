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

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
