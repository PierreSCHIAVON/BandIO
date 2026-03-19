'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, removeToken, getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    setUser(getUser());
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  const activeSessions = useMemo(() => sessions, [sessions]);

  async function loadSessions() {
    const token = getToken();
    if (!token) return;

    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const message = await res.text();
        setFeedback(message || 'Impossible de charger les sessions actives.');
        return;
      }

      const data = await res.json();
      const formatted = data.map((session) => ({
        id: session.sessionId,
        title: session.title || formatSessionTitle(session.sessionId),
        host: session.host || 'Anonyme',
        listeners: session.participantCount,
        status: session.participantCount > 0 ? 'En direct' : 'En attente',
      }));

      setSessions(formatted);
    } catch {
      setFeedback('Impossible de contacter l’API des sessions.');
    } finally {
      setLoadingSessions(false);
    }
  }

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  async function handleCreateSession() {
    const token = getToken();
    if (!token) {
      setFeedback('Vous devez être connecté·e pour créer une session.');
      return;
    }

    setCreatingSession(true);
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Nouvelle session ${new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setFeedback(err || 'Impossible de créer la session.');
        return;
      }

      const { sessionId } = await res.json();
      router.push(`/play?room=${sessionId}`);
    } catch {
      setFeedback('Erreur de connexion au serveur de sessions.');
    } finally {
      setCreatingSession(false);
    }
  }

  function handleJoinSession() {
    router.push('/join-session');
  }

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div>
            <p style={styles.greeting}>Salut, {user.name}</p>
            <p style={styles.subheading}>{user.email}</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Se déconnecter
          </button>
        </header>

        <h1 style={styles.heroTitle}>Bandio</h1>
        <p style={styles.tagline}>Les sessions sont conservées uniquement en mémoire vive.</p>

        <div style={styles.actionRow}>
          <button
            onClick={handleCreateSession}
            disabled={creatingSession}
            style={{
              ...styles.primaryButton,
              marginRight: '10px',
              opacity: creatingSession ? 0.6 : 1,
            }}
          >
            {creatingSession ? 'Création en cours...' : 'Créer une session'}
          </button>
          <button onClick={handleJoinSession} style={styles.secondaryButton}>
            Rejoindre une session
          </button>
        </div>

        <section style={styles.sessionsSection}>
          <p style={styles.sectionTitle}>Sessions actives</p>
          {loadingSessions && <p style={styles.loading}>Récupération des sessions...</p>}
          <div style={styles.sessionList}>
            {activeSessions.length === 0 && !loadingSessions && (
              <p style={styles.empty}>Aucune session disponible.</p>
            )}
            {activeSessions.map((session) => (
              <div
                key={session.id}
                style={{ ...styles.sessionCard, cursor: 'pointer' }}
                onClick={() => router.push(`/play?room=${session.id}`)}
              >
                <div style={styles.sessionHeader}>
                  <p style={styles.sessionName}>{session.title}</p>
                  <span style={styles.sessionStatus}>{session.status}</span>
                </div>
                <p style={styles.sessionMeta}>
                  par {session.host} • {session.listeners} participant·e·s
                </p>
              </div>
            ))}
          </div>
        </section>

        {feedback && <p style={styles.feedback}>{feedback}</p>}
        <button style={styles.consoleButton}>Console de mixage</button>
      </div>
    </div>
  );
}

function formatSessionTitle(sessionId) {
  const label = sessionId.replace(/^session-/, '').replace(/-/g, ' ');
  return label
    ? label
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Session';
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#050505',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    fontFamily: 'sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '620px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '36px',
    color: '#fff',
    boxShadow: '0 25px 45px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
  },
  subheading: {
    margin: '6px 0 0',
    color: '#888',
    fontSize: '12px',
  },
  logoutButton: {
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '10px',
    padding: '10px 18px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
  },
  heroTitle: {
    margin: '0',
    fontSize: '34px',
    textAlign: 'center',
    fontWeight: '700',
  },
  tagline: {
    margin: '0',
    textAlign: 'center',
    color: '#888',
    fontSize: '13px',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    flex: 1,
    minWidth: '180px',
    backgroundColor: '#6c63ff',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px',
  },
  secondaryButton: {
    flex: 1,
    minWidth: '180px',
    backgroundColor: '#2b2b2b',
    border: '1px solid #444',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px',
  },
  sessionsSection: {
    backgroundColor: '#0f0f0f',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #2a2a2a',
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: '600',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2b2b2b',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
  },
  sessionStatus: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#2f2f2f',
  },
  sessionMeta: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#aaa',
  },
  empty: {
    margin: 0,
    color: '#888',
    fontSize: '13px',
  },
  loading: {
    margin: '0 0 12px',
    color: '#aaa',
    fontSize: '12px',
  },
  feedback: {
    margin: 0,
    fontSize: '13px',
    color: '#b4b4ff',
    textAlign: 'center',
  },
  consoleButton: {
    marginTop: '10px',
    backgroundColor: '#121212',
    border: '1px solid #444',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px',
  },
};
