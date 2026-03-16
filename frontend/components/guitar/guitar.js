'use client'

import { useRef, useEffect } from 'react'
import './guitar.css'

// ─── Utilitaires note/MIDI ─────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteToMidi(note) {
  const octave = parseInt(note.slice(-1))
  const name   = note.slice(0, -1)
  return (octave + 1) * 12 + NOTE_NAMES.indexOf(name)
}

function midiToNote(midi) {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)
}

function noteAtFret(openNote, fret) {
  return midiToNote(noteToMidi(openNote) + fret)
}

// ─── Définition du manche (accordage standard EADGBE) ─────────────────────────
// Du plus aigu au plus grave (sens visuel guitare posée)

const STRINGS = [
  { label: 'e', openNote: 'E4', thickness: 1   },
  { label: 'B', openNote: 'B3', thickness: 1.5 },
  { label: 'G', openNote: 'G3', thickness: 2   },
  { label: 'D', openNote: 'D3', thickness: 2.5 },
  { label: 'A', openNote: 'A2', thickness: 3   },
  { label: 'E', openNote: 'E2', thickness: 4   },
]

const NUM_FRETS   = 12
const SINGLE_DOTS = new Set([3, 5, 7, 9])

// ─── Raccourcis clavier (AZERTY) ──────────────────────────────────────────────
// Rangée haute    : A Z E R T Y  → case 5
// Rangée home     : Q S D F G H  → corde à vide
// Rangée basse    : W X C V B N  → case 7
// Ordre des cordes dans les touches : E2 → A2 → D3 → G3 → B3 → E4

const STRINGS_LTH = [...STRINGS].reverse() // du plus grave au plus aigu

const OPEN_KEYS  = ['q', 's', 'd', 'f', 'g', 'h']
const FRET5_KEYS = ['a', 'z', 'e', 'r', 't', 'y']
const FRET7_KEYS = ['w', 'x', 'c', 'v', 'b', 'n']

const KEY_MAP = {}
STRINGS_LTH.forEach((str, i) => {
  KEY_MAP[OPEN_KEYS[i]]  = noteAtFret(str.openNote, 0)
  KEY_MAP[FRET5_KEYS[i]] = noteAtFret(str.openNote, 5)
  KEY_MAP[FRET7_KEYS[i]] = noteAtFret(str.openNote, 7)
})

// ─── Composant Guitar ─────────────────────────────────────────────────────────

export default function Guitar({ onNoteOn, onNoteOff, activeNotes = new Set() }) {
  const pressedRef = useRef(new Set())

  // ── Presse / relâche ────────────────────────────────────────────────────────

  function press(note) {
    if (pressedRef.current.has(note)) return
    pressedRef.current.add(note)
    onNoteOn(note)
  }

  function release(note) {
    if (!pressedRef.current.has(note)) return
    pressedRef.current.delete(note)
    onNoteOff(note)
  }

  // ── Événements souris ───────────────────────────────────────────────────────

  function handleMouseDown(note, e) {
    e.preventDefault()
    press(note)
  }

  function handleMouseUp(note) {
    release(note)
  }

  function handleMouseEnter(note, e) {
    if (e.buttons === 1) press(note)
  }

  function handleMouseLeave(note) {
    release(note)
  }

  // ── Raccourcis clavier ──────────────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.repeat) return
      const note = KEY_MAP[e.key.toLowerCase()]
      if (note) press(note)
    }
    function handleKeyUp(e) {
      const note = KEY_MAP[e.key.toLowerCase()]
      if (note) release(note)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup',   handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup',   handleKeyUp)
    }
  }, [onNoteOn, onNoteOff])

  // ── Rendu ───────────────────────────────────────────────────────────────────

  const pressed = pressedRef.current
  const frets   = Array.from({ length: NUM_FRETS }, (_, i) => i + 1) // 1 → 12

  return (
    <div className="guitar-wrapper">
      <span className="guitar-label">Guitare</span>

      <div className="guitar-fretboard" onContextMenu={e => e.preventDefault()}>

        {/* ── Numéros de frettes ── */}
        <div className="gtr-row gtr-header">
          <div className="gtr-label-col" />
          <div className="gtr-open-col gtr-fret-num">∅</div>
          {frets.map(f => (
            <div
              key={f}
              className={`gtr-fret-col gtr-fret-num${SINGLE_DOTS.has(f) || f === 12 ? ' marked' : ''}`}
            >
              {f}
            </div>
          ))}
        </div>

        {/* ── Cordes ── */}
        {STRINGS.map((str, sIdx) => (
          <div key={sIdx} className="gtr-row">

            {/* Nom de la corde */}
            <div className="gtr-label-col gtr-string-label">{str.label}</div>

            {/* Corde à vide + frettes 1-12 */}
            {[0, ...frets].map(fret => {
              const note      = noteAtFret(str.openNote, fret)
              const isPressed = pressed.has(note)
              const isActive  = activeNotes.has(note) && !isPressed
              const isOpen    = fret === 0

              return (
                <div
                  key={fret}
                  className={`gtr-cell ${isOpen ? 'gtr-open-col' : 'gtr-fret-col'}${isPressed ? ' pressed' : ''}${isActive ? ' active' : ''}`}
                  onMouseDown={e => handleMouseDown(note, e)}
                  onMouseUp={() => handleMouseUp(note)}
                  onMouseEnter={e => handleMouseEnter(note, e)}
                  onMouseLeave={() => handleMouseLeave(note)}
                  title={note}
                >
                  <div className="gtr-string" style={{ height: `${str.thickness}px` }} />
                  {!isOpen && <div className="gtr-fret-wire" />}
                  {(isPressed || isActive) && (
                    <div className={`gtr-dot${isActive ? ' active-dot' : ''}`} />
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* ── Repères de frettes ── */}
        <div className="gtr-row gtr-markers">
          <div className="gtr-label-col" />
          <div className="gtr-open-col" />
          {frets.map(f => (
            <div key={f} className="gtr-fret-col gtr-marker-cell">
              {SINGLE_DOTS.has(f) && <div className="gtr-dot-marker" />}
              {f === 12 && (
                <>
                  <div className="gtr-dot-marker" />
                  <div className="gtr-dot-marker" />
                </>
              )}
            </div>
          ))}
        </div>

      </div>

      <p className="guitar-hint">
        Q S D F G H (cordes à vide) &nbsp;|&nbsp; A Z E R T Y (case 5) &nbsp;|&nbsp; W X C V B N (case 7)
      </p>
    </div>
  )
}
