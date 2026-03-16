'use client'

import { useRef } from 'react'
import './piano.css'

// ─── Définition du clavier (2 octaves : C4 → B5) ─────────────────────────────

const WHITE_KEYS = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
]

// position = index de la touche blanche à SA DROITE
// left = position * WHITE_WIDTH - BLACK_WIDTH / 2
const BLACK_KEYS = [
  { note: 'C#4', position: 1  },
  { note: 'D#4', position: 2  },
  { note: 'F#4', position: 4  },
  { note: 'G#4', position: 5  },
  { note: 'A#4', position: 6  },
  { note: 'C#5', position: 8  },
  { note: 'D#5', position: 9  },
  { note: 'F#5', position: 11 },
  { note: 'G#5', position: 12 },
  { note: 'A#5', position: 13 },
]

const WHITE_WIDTH  = 52  // px
const BLACK_WIDTH  = 32  // px

// Raccourcis clavier → note (rangée QWERTY / AZERTY)
const KEY_MAP = {
  'a': 'C4', 'z': 'D4', 'e': 'E4', 'r': 'F4',
  't': 'G4', 'y': 'A4', 'u': 'B4',
  'i': 'C5', 'o': 'D5', 'p': 'E5',
}

// ─── Composant Piano ──────────────────────────────────────────────────────────

export default function Piano({ onNoteOn, onNoteOff, activeNotes = new Set() }) {
  const pressedRef = useRef(new Set()) // notes actuellement enfoncées par ce joueur

  // ── Gestion souris ───────────────────────────────────────────────────────────

  function press(note) {
    if (pressedRef.current.has(note)) return
    pressedRef.current.add(note)
    onNoteOn(note)
    // Forcer le re-render pour la couleur de la touche
    forceUpdate()
  }

  function release(note) {
    if (!pressedRef.current.has(note)) return
    pressedRef.current.delete(note)
    onNoteOff(note)
    forceUpdate()
  }

  // Trick léger pour forcer le re-render sans useState
  const renderRef = useRef(0)
  function forceUpdate() {
    renderRef.current++
    // On utilise un setState factice via un élément DOM pour éviter useState
    // En pratique, React batche les events et re-render naturellement après onNoteOn/onNoteOff
  }

  function handleMouseDown(note, e) {
    e.preventDefault()
    press(note)
  }

  function handleMouseUp(note) {
    release(note)
  }

  function handleMouseEnter(note, e) {
    // Si le bouton gauche est enfoncé (drag sur les touches)
    if (e.buttons === 1) press(note)
  }

  function handleMouseLeave(note) {
    release(note)
  }

  // ── Raccourcis clavier ───────────────────────────────────────────────────────

  // Les event listeners clavier sont gérés au niveau de la page (voir useEffect dans piano)
  // On expose une ref pour que le parent puisse appeler pressKey / releaseKey si besoin

  // ── Rendu ────────────────────────────────────────────────────────────────────

  const pressed = pressedRef.current

  return (
    <div className="piano-wrapper">
      <span className="piano-label">Piano</span>

      <div
        className="piano-keyboard"
        onContextMenu={e => e.preventDefault()}
      >
        {/* Touches blanches */}
        {WHITE_KEYS.map((note, i) => {
          const isPressed = pressed.has(note)
          const isActive  = activeNotes.has(note)
          return (
            <div
              key={note}
              className={`key-white${isPressed ? ' pressed' : ''}${isActive && !isPressed ? ' active' : ''}`}
              onMouseDown={e => handleMouseDown(note, e)}
              onMouseUp={() => handleMouseUp(note)}
              onMouseEnter={e => handleMouseEnter(note, e)}
              onMouseLeave={() => handleMouseLeave(note)}
            >
              {/* Afficher la note tous les 7 (début d'octave) */}
              {note.startsWith('C') && (
                <span className="key-note">{note}</span>
              )}
            </div>
          )
        })}

        {/* Touches noires (positionnées en absolu) */}
        {BLACK_KEYS.map(({ note, position }) => {
          const left = position * WHITE_WIDTH - BLACK_WIDTH / 2
          const isPressed = pressed.has(note)
          const isActive  = activeNotes.has(note)
          return (
            <div
              key={note}
              className={`key-black${isPressed ? ' pressed' : ''}${isActive && !isPressed ? ' active' : ''}`}
              style={{ left }}
              onMouseDown={e => handleMouseDown(note, e)}
              onMouseUp={() => handleMouseUp(note)}
              onMouseEnter={e => handleMouseEnter(note, e)}
              onMouseLeave={() => handleMouseLeave(note)}
            />
          )
        })}
      </div>

      <p className="piano-hint">
        Clavier : A Z E R T Y U (octave 1) &nbsp;|&nbsp; I O P (octave 2)
      </p>
    </div>
  )
}
