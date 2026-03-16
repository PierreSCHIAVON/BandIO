'use client'

import './toolbar.css'

// ─── Composant Toolbar ────────────────────────────────────────────────────────
//
// Props :
//   players       – [{ id, username, instrument }]
//   myId          – string
//   myInstrument  – string | null
//   instruments   – [{ id, label, icon }]
//   onLeave       – () => void

const MAX_PLAYERS = 4

export default function Toolbar({ players, myId, myInstrument, instruments = [], onLeave }) {
  const slots = [
    ...players,
    ...Array(Math.max(0, MAX_PLAYERS - players.length)).fill(null),
  ]

  function getInstrument(id) {
    return instruments.find(i => i.id === id) || null
  }

  return (
    <footer className="toolbar">

      {/* ── Joueurs ────────────────────────────────────────── */}
      <div className="toolbar-players">
        {slots.map((player, i) => {
          if (!player) {
            return (
              <div key={`empty-${i}`} className="toolbar-slot-empty">
                <span>👤</span>
                <span className="toolbar-slot-label">Libre</span>
              </div>
            )
          }

          const isMe  = player.id === myId
          const instr = getInstrument(player.instrument)

          return (
            <div key={player.id} className={`toolbar-player${isMe ? ' me' : ''}`}>
              <span className="toolbar-player-dot" />
              <span className="toolbar-player-icon">{instr ? instr.icon : '🎵'}</span>
              <div>
                <div className={`toolbar-player-name${isMe ? ' me' : ''}`}>
                  {player.username}
                </div>
                <div className="toolbar-player-instrument">
                  {instr ? instr.label : '—'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Droite : room + quitter ────────────────────────── */}
      <div className="toolbar-right">
        {myInstrument && (
          <span className="toolbar-room">
            Instrument : <strong>{getInstrument(myInstrument)?.icon} {getInstrument(myInstrument)?.label}</strong>
          </span>
        )}
        <button className="toolbar-leave" onClick={onLeave}>
          Quitter
        </button>
      </div>

    </footer>
  )
}
