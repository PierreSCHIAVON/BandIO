'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erreur de connexion');
        return;
      }

      setToken(data.token);
      router.push('/homepage');
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>BandIO</h1>
        <p style={styles.subtitle}>Connexion</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="admin@bandio.com"
            required
            style={styles.input}
          />

          <label style={styles.label}>Mot de passe</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.link}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={styles.linkAnchor}>
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#ccc',
    fontSize: '13px',
    marginTop: '8px',
  },
  input: {
    backgroundColor: '#0f0f0f',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    padding: '10px 14px',
    outline: 'none',
  },
  error: {
    color: '#ff4444',
    fontSize: '13px',
    margin: '4px 0',
  },
  button: {
    marginTop: '16px',
    backgroundColor: '#6c63ff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px',
  },
  link: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '24px',
    marginBottom: '0',
  },
  linkAnchor: {
    color: '#6c63ff',
    textDecoration: 'none',
  },
};
