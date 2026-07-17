import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'rg_music'
const VOLUME = 0.35

/**
 * Floating ambient-music toggle. On by default, but the track only ever starts
 * from a user gesture (browser autoplay policy) — the visitor's first
 * click/keypress/tap anywhere starts the music. Once the user mutes, that
 * choice is remembered in localStorage.
 */
export default function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Default ON: play unless the visitor has explicitly muted before.
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== 'off',
  )
  const [playing, setPlaying] = useState(false)

  // Keep playback in sync with `enabled`. When enabled but blocked (no gesture
  // yet), the first interaction anywhere starts it.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = VOLUME

    if (!enabled) {
      audio.pause()
      return
    }

    // Try right away — works if a gesture already happened this session.
    audio.play().catch(() => {})

    const onInteract = () => {
      audio.play().catch(() => {})
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
      window.removeEventListener('touchstart', onInteract)
    }
    window.addEventListener('pointerdown', onInteract)
    window.addEventListener('keydown', onInteract)
    window.addEventListener('touchstart', onInteract)

    return () => {
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
      window.removeEventListener('touchstart', onInteract)
    }
  }, [enabled])

  const toggle = () => {
    setEnabled((on) => {
      const next = !on
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      return next
    })
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/ambient.mp3"
        loop
        preload="none"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={enabled ? 'Mute background music' : 'Play background music'}
        aria-pressed={enabled}
        title={enabled ? 'Mute music' : 'Play ambient music'}
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-panel/80 text-xl shadow-lg shadow-black/40 backdrop-blur transition hover:border-brand/50 hover:bg-panel active:scale-95"
      >
        {enabled ? (
          <span className={playing ? 'animate-pulse' : ''} aria-hidden>
            🔊
          </span>
        ) : (
          <span aria-hidden>🔇</span>
        )}
      </button>
    </>
  )
}
