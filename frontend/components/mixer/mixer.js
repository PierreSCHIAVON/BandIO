'use client'

import './mixer.css'

// ─── Composant Mixer ──────────────────────────────────────────────────────────
//
// Props :
//   players        – [{ id, username, instrument }]
//   myId           – string, ID de l'utilisateur courant
//   volume         – number 0-100
//   onVolumeChange – (value: number) => void
//   playingIds     – Set<string>, userId des joueurs actuellement en train de jouer
//   instruments    – [{ id, label, icon }]

const MAX_PLAYERS = 4

export default function Mixer({ players, myId, volume, onVolumeChange, playingIds = new Set(), instruments = [] }) {
  // Compléter jusqu'à 4 slots
  const slots = [
    ...players,
    ...Array(Math.max(0, MAX_PLAYERS - players.length)).fill(null),
  ]

  function getInstrument(id) {
    return instruments.find(i => i.id === id) || null
  }

  return (
    <aside className="mixer">

      {/* ── Volume ─────────────────────────────────────────────── */}
      <div className="mixer-volume">
        <p className="mixer-section-title">Volume</p>
        <div className="volume-row">
          <span className="volume-label">🔊 Master</span>
          <span className="volume-value">{volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={e => onVolumeChange(Number(e.target.value))}
          className="volume-slider"
        />
      </div>

      {/* ── Joueurs ─────────────────────────────────────────────── */}
      <div className="mixer-players">
        <p className="mixer-section-title">Joueurs ({players.length}/{MAX_PLAYERS})</p>

        {slots.map((player, i) => {
          if (!player) {
            return (
              <div key={`empty-${i}`} className="mixer-slot-empty">
                <span className="mixer-slot-empty-icon">👤</span>
                <span className="mixer-slot-empty-label">Slot libre</span>
              </div>
            )
          }

          const instr    = getInstrument(player.instrument)
          const isMe     = player.id === myId
          const isPlaying = playingIds.has(player.id)

          return (
            <div key={player.id} className={`mixer-player${isPlaying ? ' playing' : ''}`}>
              <span className="mixer-player-icon">
                {instr ? instr.icon : '🎵'}
              </span>

              <div className="mixer-player-info">
                <div className={`mixer-player-name${isMe ? ' me' : ''}`}>
                  {player.username}{isMe ? ' (moi)' : ''}
                </div>
                <div className="mixer-player-instrument">
                  {instr ? instr.label : 'Aucun instrument'}
                </div>
              </div>

              <div className={`mixer-activity${isPlaying ? ' on' : ''}`} />
            </div>
          )
        })}
      </div>

    </aside>
  )
}
