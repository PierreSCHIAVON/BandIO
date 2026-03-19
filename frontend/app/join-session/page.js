'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { isAuthenticated, getUser } from '@/lib/auth'
import logo from '../../public/bandio.png'
import './page.css'

export default function JoinSessionPage() {

  const router = useRouter()

  const [user, setUser] = useState(null)
  const [roomId, setRoomId] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    setUser(getUser())
  }, [router])

  function handleJoin(e) {
    e.preventDefault()

    if (!roomId.trim()) return

    router.push(`/play?room=${roomId}`)
  }

  if (!user) return null

  return (
    <div className="page">

      <div className="title">
        <Image height={40} width={40} src={logo} alt="logo" className="logo"/>
        <h1 className="title-text">Bandio</h1>

        <div className="title-right">
          <span className="title-user">
            {user.name || user.email}
          </span>
        </div>
      </div>

      <div className="join-container">

        <h2 className="join-title">
          Rejoindre une session
        </h2>

        <form onSubmit={handleJoin} className="join-form">

          <input
            type="text"
            placeholder="ID de la session"
            value={roomId}
            onChange={(e)=>setRoomId(e.target.value)}
            className="join-input"
          />

          <button
            type="submit"
            className="join-button"
          >
            Rejoindre
          </button>

        </form>

      </div>

    </div>
  )
}