# BandIO

Collaboration musicale en temps réel.

## Stack

- **Frontend** : Next.js 16, React 19
- **Backend** : Node.js, Express 5
- **Base de données** : PostgreSQL (Supabase)
- **Auth** : JWT

---

## Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Configuration

Crée un fichier `backend/.env` :

```env
DATABASE_URL=postgresql://...
JWT_SECRET=ton_secret
```

## Démarrage

```bash
# Backend (port 3001)
cd backend
npm run dev

# Frontend (port 3000)
cd frontend
npm run dev
```

## API Auth

| Méthode | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter, retourne un JWT |
| GET | `/api/me` | Infos utilisateur connecté (token requis) |

### Exemple register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"motdepasse","name":"Alice"}'
```

### Exemple login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"motdepasse"}'
```

### Exemple route protégée

```bash
curl http://localhost:3001/api/me \
  -H "Authorization: Bearer <token>"
```
