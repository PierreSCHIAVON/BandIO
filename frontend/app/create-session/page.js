'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { isAuthenticated, getUser, getToken } from '@/lib/auth';
import logo from '../../public/bandio.png';
import './page.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CreateSessionPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [nbUser, setNbUser] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
  }, [router]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    const token = getToken();
    if (!token) {
      setError('Vous devez être connecté·e pour créer une session.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          nb_user: nbUser ? parseInt(nbUser, 10) : undefined,
          visibility,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setError(err || 'Impossible de créer la session.');
        return;
      }

      const { sessionId } = await res.json();
      router.push(`/play?room=${sessionId}`);
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setCreating(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page">

      <div className="cs-header">
        <Image height={40} width={40} src={logo} alt="logo" className="cs-logo" />
        <h1 className="cs-header-title">Bandio</h1>
        <div className="cs-header-right">
          <span className="cs-user">{user.name || user.email}</span>
        </div>
      </div>

      {error && (
        <div className="cs-error-banner">
          {error}
        </div>
      )}

      <div className="cs-body">
        <div className="cs-card">
          <h2 className="cs-title">Créer une session</h2>

          <form onSubmit={handleCreate} className="cs-form">

            <div className="cs-field">
              <label className="cs-label">Titre de la session</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Jam du vendredi"
                className="cs-input"
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Nombre de participants max</label>
              <input
                type="number"
                min="1"
                max="32"
                value={nbUser}
                onChange={(e) => setNbUser(e.target.value)}
                placeholder="Ex : 4"
                className="cs-input"
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Visibilité</label>
              <div className="cs-visibility">
                <button
                  type="button"
                  className={`cs-vis-btn ${visibility === 'public' ? 'cs-vis-active' : ''}`}
                  onClick={() => setVisibility('public')}
                >
                  Public
                </button>
                <button
                  type="button"
                  className={`cs-vis-btn ${visibility === 'private' ? 'cs-vis-active' : ''}`}
                  onClick={() => setVisibility('private')}
                >
                  Privé
                </button>
              </div>
            </div>

            <div className="cs-actions">
              <button
                type="button"
                className="cs-btn-cancel"
                onClick={() => router.push('/homepage')}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="cs-btn-create"
                disabled={creating}
              >
                {creating ? 'Création...' : 'Créer une session'}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
