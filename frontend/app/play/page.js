'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { io } from 'socket.io-client'
import * as Tone from 'tone'
import Image from 'next/image'

import { isAuthenticated, getUser } from '@/lib/auth'
import Piano from '@/components/piano/piano'
import Mixer from '@/components/mixer/mixer'
import Toolbar from '@/components/toolbar/toolbar'
import logo from '../../public/bandio.png'
import './page.css'

const INSTRUMENTS = [
  { id: 'piano',    label: 'Piano',    icon: '🎹' },
  { id: 'guitare',  label: 'Guitare',  icon: '🎸' },
  { id: 'basse',    label: 'Basse',    icon: '🎵' },
  { id: 'batterie', label: 'Batterie', icon: '🥁' },
]

// ─── Logique principale ───────────────────────────────────────────────────────

function PlayPageInner() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const roomId      = searchParams.get('room') || 'default-room'

  const [user,          setUser]          = useState(null)
  const [phase,         setPhase]         = useState('lobby')   // 'lobby' | 'playing'
  const [players,       setPlayers]       = useState([])
  const [myInstrument,  setMyInstrument]  = useState(null)
  const [activeNotes,   setActiveNotes]   = useState(new Set()) // notes pressées par d'autres joueurs
  const [playingIds,    setPlayingIds]    = useState(new Set()) // userId des joueurs en train de jouer
  const [volume,        setVolume]        = useState(80)
  const [connected,     setConnected]     = useState(false)

  const socketRef = useRef(null)
  const synthRef  = useRef(null)

  // ── Auth ────────────────────────────────────────────────────────────────────
/*   useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    setUser(getUser())
  }, [router]) */

  // ── WebSocket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001')
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_room', {
        roomId,
        userId:   user.id,
        username: user.name || user.email,
      })
    })

    socket.on('disconnect', () => setConnected(false))

    // État complet de la salle à la connexion
    socket.on('room_state', ({ players }) => setPlayers(players))

    // Arrivée / départ de joueurs
    socket.on('player_joined', ({ player }) =>
      setPlayers(p => [...p.filter(x => x.id !== player.id), player])
    )
    socket.on('player_left', ({ userId }) =>
      setPlayers(p => p.filter(x => x.id !== userId))
    )

    // Choix d'instrument par un autre joueur
    socket.on('instrument_chosen', ({ userId, instrument }) =>
      setPlayers(p => p.map(x => x.id === userId ? { ...x, instrument } : x))
    )

    // Notes jouées par d'autres joueurs (le serveur doit broadcaster sans renvoyer à l'émetteur)
    socket.on('note_on', ({ userId, note }) => {
      if (userId === user.id) return
      setActiveNotes(prev => new Set([...prev, note]))
      setPlayingIds(prev => new Set([...prev, userId]))
      synthRef.current?.triggerAttack?.(note)
    })

    socket.on('note_off', ({ userId, note }) => {
      if (userId === user.id) return
      setActiveNotes(prev => { const s = new Set(prev); s.delete(note); return s })
      setPlayingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
      synthRef.current?.triggerRelease?.(note)
    })

    return () => socket.disconnect()
  }, [user, roomId])

  // ── Initialisation Tone.js selon l'instrument ───────────────────────────────
  useEffect(() => {
    if (!myInstrument) return

    Tone.getContext().resume()
    let synth

    if (myInstrument === 'piano') {
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 },
      }).toDestination()

    } else if (myInstrument === 'basse') {
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.5 },
      }).toDestination()

    } else if (myInstrument === 'guitare') {
      synth = new Tone.PluckSynth().toDestination()

    } else if (myInstrument === 'batterie') {
      synth = new Tone.MembraneSynth().toDestination()
    }

    synthRef.current = synth
    setPhase('playing')

    return () => synth?.dispose()
  }, [myInstrument])

  // ── Volume ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Conversion 0-100 → -40dB..0dB
    Tone.getDestination().volume.value = volume === 0 ? -Infinity : (volume / 100) * 40 - 40
  }, [volume])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleChooseInstrument(instrument) {
    const alreadyTaken = players.some(p => p.instrument === instrument && p.id !== user?.id)
    if (alreadyTaken) return

    socketRef.current?.emit('choose_instrument', { instrument })
    setMyInstrument(instrument)
  }

  function handleNoteOn(note) {
    // PluckSynth et MembraneSynth : son autonome (pas de sustain)
    if (myInstrument === 'guitare') {
      synthRef.current?.triggerAttack(note)
    } else if (myInstrument === 'batterie') {
      synthRef.current?.triggerAttackRelease('C1', '8n')
    } else {
      synthRef.current?.triggerAttack(note)
    }
    socketRef.current?.emit('note_on', { note, instrument: myInstrument })
  }

  function handleNoteOff(note) {
    if (myInstrument !== 'guitare' && myInstrument !== 'batterie') {
      synthRef.current?.triggerRelease(note)
    }
    socketRef.current?.emit('note_off', { note })
  }

  function handleLeave() {
    socketRef.current?.disconnect()
    router.push('/')
  }

  if (!user) return null

  // ── VUE LOBBY ───────────────────────────────────────────────────────────────

  if (phase === 'lobby') {
    return (
      <div className="page">
        <div className="title">
          <Image height={40} width={40} src={logo} alt="logo" className="logo" />
          <h1 className="title-text">Bandio</h1>
          <div className="title-right">
            <span className="title-user">{user.name || user.email}</span>
            <div className={`connection-dot ${connected ? 'ok' : 'error'}`} />
          </div>
        </div>

        <div className="lobby">
          <h2 className="lobby-title">
            Salon : <code>{roomId}</code>
          </h2>
          <p className="lobby-subtitle">
            Choisis ton instrument ({players.filter(p => p.instrument).length}/4 pris)
          </p>

          <div className="instrument-grid">
            {INSTRUMENTS.map(({ id, label, icon }) => {
              const takenBy = players.find(p => p.instrument === id && p.id !== user.id)
              return (
                <button
                  key={id}
                  className={`instrument-card ${takenBy ? 'taken' : ''}`}
                  onClick={() => handleChooseInstrument(id)}
                  disabled={!!takenBy}
                >
                  <span className="instrument-icon">{icon}</span>
                  <span className="instrument-label">{label}</span>
                  {takenBy && (
                    <span className="instrument-taken-by">{takenBy.username}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="lobby-players">
            <h3>Joueurs connectés ({players.length}/4)</h3>
            <ul>
              {players.map(p => {
                const instr = INSTRUMENTS.find(i => i.id === p.instrument)
                return (
                  <li key={p.id} className="lobby-player">
                    <span className="player-dot" />
                    <span>{p.username}</span>
                    {instr && (
                      <span className="player-instrument-badge">
                        {instr.icon} {instr.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className={`connection-status ${connected ? 'ok' : 'error'}`}>
            {connected ? '● Connecté' : '○ Connexion en cours...'}
          </div>
        </div>
      </div>
    )
  }

  // ── VUE PLAYING ─────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="title">
        <Image height={40} width={40} src={logo} alt="logo" className="logo" />
        <h1 className="title-text">Bandio</h1>
        <div className="title-right">
          <span className="title-user">{user.name || user.email}</span>
          <div className={`connection-dot ${connected ? 'ok' : 'error'}`} />
        </div>
      </div>

      <div className="main">
        <div className="instrument-zone">
          <Piano
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
            activeNotes={activeNotes}
          />
        </div>

        <Mixer
          players={players}
          myId={user.id}
          volume={volume}
          onVolumeChange={setVolume}
          playingIds={playingIds}
          instruments={INSTRUMENTS}
        />
      </div>

      <Toolbar
        players={players}
        myId={user.id}
        myInstrument={myInstrument}
        instruments={INSTRUMENTS}
        onLeave={handleLeave}
      />
    </div>
  )
}

// ─── Export avec Suspense (requis par useSearchParams en App Router) ───────────

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div style={{ color: '#fff', background: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        Chargement...
      </div>
    }>
      <PlayPageInner />
    </Suspense>
  )
}
