'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, removeToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
  }, [router]);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bienvenue, {user.name}</h1>
      <p style={styles.email}>{user.email}</p>
      <button onClick={handleLogout} style={styles.button}>
        Se déconnecter
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
    fontFamily: 'sans-serif',
    color: '#fff',
  },
  title: {
    fontSize: '28px',
    margin: '0 0 8px 0',
  },
  email: {
    color: '#888',
    margin: '0 0 32px 0',
  },
  button: {
    backgroundColor: '#333',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '10px 20px',
  },
};
