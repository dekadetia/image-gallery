'use client'
import { useEffect, useId } from 'react'
import gsap from 'gsap'

// 🔒 GLOBAL: Fix back button bfcache restore
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      setTimeout(() => {
        const saved = sessionStorage.getItem('logoState')
        const isAlt = saved === 'alt'

        for (let i = 1; i <= 8; i++) {
          const base = document.getElementById(`letter_${i}`) as HTMLElement | null
          const alt = document.getElementById(`letter_${i + 8}`) as HTMLElement | null

          if (base) {
            base.style.display = isAlt ? 'none' : 'inline'
            base.style.transform = ''
            gsap.set(base, { clearProps: 'all', x: 0, y: 0 })
          }

          if (alt) {
            alt.style.display = isAlt ? 'inline' : 'none'
            alt.style.transform = ''
            gsap.set(alt, { clearProps: 'all', x: 0, y: 0 })
          }
        }
      }, 50)
    }
  })
}

export default function AnimatedLogo() {
  const idPrefix = useId()
  const isInitialAlt =
    typeof window !== 'undefined' && sessionStorage.getItem('logoState') === 'alt'

  useEffect(() => {
    const logo = document.getElementById('logo')
    if (!logo) return

    const exitDirs = [
      { x: 120 }, { x: 120 }, { x: 120 },
      { y: 140 }, { y: -140 },
      { x: -120 }, { x: -120 }, { x: -120 }
    ]
    const enterDirs = [
      { y: 140 }, { x: -120 }, { x: -120 }, { x: -120 },
      { x: 120 }, { x: 120 }, { x: 120 }, { y: -140 }
    ]

    let longPressed = false
    let firstToggle = true
    let isTouchInteraction = false
    let longPressTimer: ReturnType<typeof setTimeout>
    let toggled = false

    const saved = sessionStorage.getItem('logoState')
    if (saved === 'alt') {
      for (let i = 1; i <= 8; i++) {
        const base = document.getElementById(`letter_${i}`) as HTMLElement | null
        const alt  = document.getElementById(`letter_${i + 8}`) as HTMLElement | null
        if (base) base.style.display = 'none'
        if (alt)  alt.style.display  = 'inline'
      }
      toggled = true
    }

    const showAlt = (onComplete?: () => void) => {
      let completed = 0
      const exitDelay = firstToggle && isTouchInteraction ? 0.2 : 0

      for (let i = 1; i <= 8; i++) {
        const base = document.getElementById(`letter_${i}`) as HTMLElement | null
        const alt  = document.getElementById(`letter_${i + 8}`) as HTMLElement | null

        if (!base || !alt) continue

        gsap.to(base, { duration: 0.5, delay: exitDelay, ...exitDirs[i - 1] })

        alt.style.display = 'inline'
        void alt.offsetWidth // layout flush

        gsap.fromTo(
          alt,
          enterDirs[i - 1],
          {
            duration: 0.5,
            delay: exitDelay,
            x: 0,
            y: 0,
            onComplete: () => {
              if (++completed === 8 && onComplete) onComplete()
            },
          }
        )
      }

      firstToggle = false
    }

    const reset = (onComplete?: () => void) => {
      let completed = 0
      for (let i = 1; i <= 8; i++) {
        const base = document.getElementById(`letter_${i}`) as HTMLElement | null
        const alt  = document.getElementById(`letter_${i + 8}`) as HTMLElement | null

        if (base) {
          base.style.display = 'inline'
          void base.offsetWidth
          gsap.fromTo(
            base,
            exitDirs[i - 1], // come in from the direction it exited last time
            { duration: 0.5, x: 0, y: 0 }
          )
        }

        if (alt) {
          gsap.to(alt, {
            duration: 0.5,
            ...enterDirs[i - 1],
            onComplete: () => {
              alt.style.display = 'none'
              if (++completed === 8 && onComplete) onComplete()
            },
          })
        }
      }
    }

    const toggle = () => {
      if (toggled) {
        reset(() => sessionStorage.setItem('logoState', 'base'))
      } else {
        showAlt(() => sessionStorage.setItem('logoState', 'alt'))
      }
      toggled = !toggled
    }

    const onMouseEnter = toggle
    const onTouchStart = () => {
      isTouchInteraction = true
      longPressed = false
      longPressTimer = setTimeout(() => {
        longPressed = true
        if (toggled) {
          reset(() => {
            toggled = false
            sessionStorage.setItem('logoState', 'base')
          })
        } else {
          showAlt(() => {
            toggled = true
            sessionStorage.setItem('logoState', 'alt')
          })
        }
      }, 500)
    }
    const onTouchEnd = (e: TouchEvent) => {
      isTouchInteraction = false
      clearTimeout(longPressTimer)
      if (longPressed) e.preventDefault()
    }
    const onContextMenu = (e: MouseEvent) => { if (longPressed) e.preventDefault() }

    logo.addEventListener('mouseenter', onMouseEnter)
    logo.addEventListener('touchstart', onTouchStart as any, { passive: true } as any)
    logo.addEventListener('touchend', onTouchEnd as any)
    logo.addEventListener('contextmenu', onContextMenu as any)

    return () => {
      logo.removeEventListener('mouseenter', onMouseEnter)
      logo.removeEventListener('touchstart', onTouchStart as any)
      logo.removeEventListener('touchend', onTouchEnd as any)
      logo.removeEventListener('contextmenu', onContextMenu as any)
    }
  }, [])

  return (
    <svg className="w-40 h-auto" id="logo" viewBox="0 0 449 266.3" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Color classes from your new SVGs */}
        <style>{`
          .st0{fill:#d35589;}
          .st1{fill:#e43f25;}
          .st2{fill:#6a3e97;}
          .st3{fill:#d2c52a;}
          .st4{fill:#1c6bb4;}
          .st5{fill:#4bb9ea;}
          .st6{fill:#4bb9ea;}
          .st7{fill:#59b94f;}
          .st8{fill:#f47f20;}
        `}</style>

        {/* Same 2×4 grid clips */}
        <clipPath id={`${idPrefix}_clip_letter_1`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="0" y="0" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_2`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="112.25" y="0" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_3`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="224.5" y="0" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_4`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="336.75" y="0" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_5`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="0" y="133.15" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_6`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="112.25" y="133.15" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_7`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="224.5" y="133.15" /></clipPath>
        <clipPath id={`${idPrefix}_clip_letter_8`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="336.75" y="133.15" /></clipPath>
      </defs>

      {/* Frame (unchanged) */}
      <g id="g">
        <polygon points="339.9 266.3 338.9 266.3 338.9 133.6 227.9 133.6 227.9 266.3 226.9 266.3 226.9 133.6 116 133.6 116 266.3 115 266.3 115 133.6 0 133.6 0 132.6 115 132.6 115 0 116 0 116 132.6 226.9 132.6 226.9 0 227.9 0 227.9 132.6 338.9 132.6 338.9 0 339.9 0 339.9 132.6 449 132.6 449 133.6 339.9 133.6 339.9 266.3" fill="#6e6e73" />
      </g>

      {/* ===== Set A (base): TNDR / BTNS ===== */}
      <g clipPath={`url(#${idPrefix}_clip_letter_1)`}><g id="letter_1" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st1" d="M44.5,57.6h-13.2v-21.4h51.6v21.3h-12.9v41.8h-25.4v-41.7Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_2)`}><g id="letter_2" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st3" d="M144.1,34.5l34.3,20.7v-19h19.6v63.2h-54l.2-64.8Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_3)`}><g id="letter_3" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st6" d="M255.9,37.1h28.2c16.8,0,28.9,17,28.9,32.3s-13.4,30.8-30.5,30.8h-26.5l-.2-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_4)`}><g id="letter_4" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st2" d="M369.6,36.1h31.9c10.1,0,17.9,9.1,17.9,18.7s-3.7,15.4-11.3,18.3l11.7,26.2h-50.2v-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_5)`}><g id="letter_5" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st8" d="M32,168.3h23.3c10.9,0,24.5,2.1,24.5,16.4s-9.1,14.1-12.7,15.4c5,2.2,10.7,6.4,10.7,16.7s-7.7,17.2-19,17.2H31.8l.2-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_6)`}><g id="letter_6" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st7" d="M158.7,189.7h-13.2v-21.4h51.6v21.3h-12.9v41.8h-25.4v-41.7Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_7)`}><g id="letter_7" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st5" d="M257.3,167.6l34.3,20.7v-19h19.6v63.2h-54l.2-64.8Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_8)`}><g id="letter_8" style={{ display: isInitialAlt ? 'none' : 'inline' }}>
        <path className="st0" d="M380.6,205.8c-6.1-5.4-8.6-10.4-8.6-18,0-12.8,10.5-22.6,23.6-22.6,9.7,0,17.3,5.1,20.4,13.2l-9.6,10.1c-3.9-6.6-8.8-11.7-16.1-11.7-7.8,0-12.5,5.1-12.5,11.3s3.3,8.9,11.7,12.7l4.8,2.2c8.3,3.8,15.6,9.4,15.6,17.6,0,12.8-10.5,22.6-23.6,22.6s-20.5-7.6-22.6-18.2l9.6-10.1Z" />
      </g></g>

      {/* ===== Set B (alt): BLND / GLSS ===== */}
      <g clipPath={`url(#${idPrefix}_clip_letter_1)`}><g id="letter_9" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st1" d="M33.7,36.1h23.3c10.9,0,24.5,2.1,24.5,16.4s-9.1,14.1-12.7,15.4c5,2.2,10.7,6.4,10.7,16.7s-7.7,17.2-19,17.2h-32.8l.2-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_2)`}><g id="letter_10" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st3" d="M150.6,36.1h18.2v34.8h21.1v28.3h-39.3v-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_3)`}><g id="letter_11" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st6" d="M257.5,35.5l34.3,20.7v-19h19.6v63.2h-54l.2-64.8Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_4)`}><g id="letter_12" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st2" d="M363.8,36.1h28.2c16.8,0,28.9,17,28.9,32.3s-13.4,30.8-30.5,30.8h-26.5l-.2-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_5)`}><g id="letter_13" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st8" d="M24.9,200.5c0-18.1,13.9-33.5,32.1-33.5s24.9,8.1,30.1,22.3l-19.6,13.4c-2.7-5.5-6.5-10.4-11.1-10.4-7.1,0-12.1,7-12.1,14.3s5.2,14.2,12.3,14.2c5.5,0,8.7-2.4,11.8-5.6l13.2,14.3c-6.4,7-16,11.8-27.9,11.8-18.4,0-32-15.3-32-32.4Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_6)`}><g id="letter_14" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st7" d="M153.7,168.3h18.2v34.8h21.1v28.3h-39.3v-63.2Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_7)`}><g id="letter_15" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st5" d="M270.6,206.8c-6.1-5.4-8.6-10.4-8.6-18,0-12.8,10.5-22.6,23.6-22.6,9.7,0,17.3,5.1,20.4,13.2l-9.6,10.1c-3.9-6.6-8.8-11.7-16.1-11.7-7.8,0-12.5,5.1-12.5,11.3s3.3,8.9,11.7,12.7l4.8,2.2c8.3,3.8,15.6,9.4,15.6,17.6,0,12.8-10.5,22.6-23.6,22.6s-20.5-7.6-22.6-18.2l9.6-10.1Z" />
      </g></g>
      <g clipPath={`url(#${idPrefix}_clip_letter_8)`}><g id="letter_16" style={{ display: isInitialAlt ? 'inline' : 'none' }}>
        <path className="st0" d="M378.3,205.8c-6.1-5.4-8.6-10.4-8.6-18,0-12.8,10.5-22.6,23.6-22.6,9.7,0,17.3,5.1,20.4,13.2l-9.6,10.1c-3.9-6.6-8.8-11.7-16.1-11.7-7.8,0-12.5,5.1-12.5,11.3s3.3,8.9,11.7,12.7l4.8,2.2c8.3,3.8,15.6,9.4,15.6,17.6,0,12.8-10.5,22.6-23.6,22.6s-20.5-7.6-22.6-18.2l9.6-10.1Z" />
      </g></g>
    </svg>
  )
}
