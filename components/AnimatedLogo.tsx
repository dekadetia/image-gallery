'use client'
import { useLayoutEffect, useEffect, useId } from 'react'
import gsap from 'gsap'

// 🔒 GLOBAL: Fix back button bfcache restore
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      setTimeout(() => {
        for (let i = 1; i <= 8; i++) {
          const base = document.getElementById(`letter_${i}`) as HTMLElement | null
          const alt = document.getElementById(`letter_${i + 8}`) as HTMLElement | null

          if (base) {
            base.style.display = 'inline'
            base.style.transform = ''
            gsap.set(base, { clearProps: 'all' })
          }

          if (alt) {
            alt.style.display = 'none'
            alt.style.transform = ''
            gsap.set(alt, { clearProps: 'all' })
          }
        }
      }, 50)
    }
  })
}

export default function AnimatedLogo() {
  const idPrefix = useId()

  useLayoutEffect(() => {
    const logo = document.getElementById('logo')
    if (!logo) return

    const savedState = sessionStorage.getItem('logoState')
    if (savedState === 'alt') {
      toggled = true
      for (let i = 1; i <= 8; i++) {
        const base = document.getElementById(`letter_${i}`)
        const alt = document.getElementById(`letter_${i + 8}`)
        if (base && alt) {
          base.style.display = 'none'
          alt.style.display = 'inline'
          gsap.set(base, { clearProps: 'all' })
          gsap.set(alt, { x: 0, y: 0, autoAlpha: 1 })
        }
      }
    }
  }, [])

export default function AnimatedLogo() {
  const idPrefix = useId()
  useEffect(() => {
    const logo = document.getElementById('logo')
    if (!logo) return

    const savedState = sessionStorage.getItem('logoState')
if (savedState === 'alt') {
  toggled = true
  for (let i = 1; i <= 8; i++) {
    const base = document.getElementById(`letter_${i}`)
    const alt = document.getElementById(`letter_${i + 8}`)
    if (base && alt) {
      base.style.display = 'none'
      alt.style.display = 'inline'
      gsap.set(base, { clearProps: 'all' })
      gsap.set(alt, { x: 0, y: 0, autoAlpha: 1 })
    }
  }
}


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
    let longPressTimer
    let toggled = false

const showAlt = (onComplete?: () => void) => {
  let completed = 0
const exitDelay = firstToggle && isTouchInteraction ? 0.2 : 0
  for (let i = 1; i <= 8; i++) {
    const base = document.getElementById(`letter_${i}`)
    const alt = document.getElementById(`letter_${i + 8}`)

    if (base && alt) {
gsap.to(base, {
  duration: 0.5,
  delay: exitDelay,
  ...exitDirs[i - 1]
})

   alt.style.display = 'inline'
void alt.offsetWidth // 🔧 forces layout flush, ensures transform kicks in cleanly

gsap.fromTo(
  alt,
  enterDirs[i - 1],
  {
    duration: 0.5,
    delay: exitDelay, // 👈 same delay as base letter's exit
    x: 0,
    y: 0,
    onComplete: () => {
      if (++completed === 8 && onComplete) onComplete()
    }
  }
)

    }
  }
  firstToggle = false
}


 const reset = (onComplete?: () => void) => {
  let completed = 0
  for (let i = 1; i <= 8; i++) {
    const base = document.getElementById(`letter_${i}`)
    const alt = document.getElementById(`letter_${i + 8}`)

    if (base) {
      gsap.to(base, {
        duration: 0.5,
        x: 0,
        y: 0
      })
    }

    if (alt) {
      gsap.to(alt, {
        duration: 0.5,
        ...enterDirs[i - 1],
        onComplete: () => {
          alt.style.display = 'none'
          if (++completed === 8 && onComplete) onComplete()
        }
      })
    }
  }
}


const toggle = () => {
  if (toggled) {
    reset()
  } else {
    showAlt()
  }
  toggled = !toggled
}

logo.addEventListener('mouseenter', toggle)

logo.addEventListener('touchstart', (e) => {
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

    })

logo.addEventListener('touchend', (e) => {
  isTouchInteraction = false
  clearTimeout(longPressTimer)
  if (longPressed) {
    e.preventDefault()
  }
})


    logo.addEventListener('contextmenu', (e) => {
      if (longPressed) e.preventDefault()
    })

    return () => {
      logo.removeEventListener('mouseenter', toggle)
      logo.removeEventListener('touchstart', () => {})
      logo.removeEventListener('touchend', () => {})
      logo.removeEventListener('contextmenu', () => {})
    }
  }, [])

  return (
    <svg className="w-40 h-auto" id="logo" viewBox="0 0 449 266.3" xmlns="http://www.w3.org/2000/svg">
    
     <defs><clipPath id={`${idPrefix}_clip_letter_1`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="0.0" y="0.0" /></clipPath><clipPath id={`${idPrefix}_clip_letter_2`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="112.25" y="0.0" /></clipPath><clipPath id={`${idPrefix}_clip_letter_3`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="224.5" y="0.0" /></clipPath><clipPath id={`${idPrefix}_clip_letter_4`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="336.75" y="0.0" /></clipPath><clipPath id={`${idPrefix}_clip_letter_5`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="0.0" y="133.15" /></clipPath><clipPath id={`${idPrefix}_clip_letter_6`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="112.25" y="133.15" /></clipPath><clipPath id={`${idPrefix}_clip_letter_7`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="224.5" y="133.15" /></clipPath><clipPath id={`${idPrefix}_clip_letter_8`} clipPathUnits="userSpaceOnUse"><rect height="133.15" width="112.25" x="336.75" y="133.15" /></clipPath></defs>
<g id="g">
<polygon points="339.9 266.3 338.9 266.3 338.9 133.6 227.9 133.6 227.9 266.3 226.9 266.3 226.9 133.6 116 133.6 116 266.3 115 266.3 115 133.6 0 133.6 0 132.6 115 132.6 115 0 116 0 116 132.6 226.9 132.6 226.9 0 227.9 0 227.9 132.6 338.9 132.6 338.9 0 339.9 0 339.9 132.6 449 132.6 449 133.6 339.9 133.6 339.9 266.3" style={ { fill: "#6e6e73", strokewidth: 0.0 } } />
</g>
<g clipPath={`url(#${idPrefix}_clip_letter_1)`}><g id="letter_1">
<g style={ { isolation: "isolate" } }>
<path d="m49,40.8c0-3.8-.1-4-2.5-4h-5.1c-8.4,0-10.8,1-14.2,8.4-.6.5-2.6.3-2.9-.6,1.5-4.9,2.9-10.6,3.6-13.8.2-.3.5-.4,1-.4.4,0,.7.1.9.4.5,2.3,1.7,2.4,7.9,2.4h37.2c4.5,0,5.8-.3,6.9-2.4.4-.2.7-.4,1.1-.4.5,0,1,.2,1.2.5-.9,3.7-1.6,11.6-1.4,14.5-.5.7-2,.9-2.8.3-1.2-7.1-2.9-8.8-12.7-8.8h-5.2c-2.4,0-2.5.2-2.5,4v39.3c0,9.7.8,9.9,5.1,10.4l3.3.4c.6.6.5,2.3-.2,2.6-5.3-.2-9.4-.3-13.4-.3s-8.3.1-14.1.3c-.7-.4-.8-2.2-.2-2.6l3.8-.5c4.3-.5,5.1-.6,5.1-10.3v-39.4h.1Z" style={ { fill: "#e43f25", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_2)`}><g id="letter_2">
<g style={ { isolation: "isolate" } }>
<path d="m197.2,78c0,2.7,0,13.5.3,15.6-.7,1-2.4,1.4-3.5,1.3-1.5-1.9-3.7-4.6-10.3-12l-21.3-24.3c-5.8-6.7-8.8-10.1-10.4-11.5-.3,0-.3,1-.3,5.8v17.8c0,6.8.1,15.2,1.6,17.9.8,1.4,2.4,2,4.6,2.3l2,.3c.8.6.7,2.4-.2,2.6-3.4-.2-6.9-.3-10.4-.3-3.8,0-6.3.1-9.5.3-.7-.5-.9-2-.2-2.6l2-.5c1.7-.4,3.4-.6,4-2.1,1.2-2.8,1.2-10.7,1.2-17.9v-21.6c0-7.1.1-8.6-3-11.2-1-.8-3.6-1.5-4.8-1.8l-1.4-.3c-.6-.5-.5-2.4.4-2.6,3.5.4,8.5.3,10.7.3,1.9,0,4.1-.1,6.3-.3,1.5,3.9,11.5,15.4,14.7,18.9l9.1,9.8c3.8,4.2,12.3,13.8,13.2,14.4.3-.3.3-.7.3-2.2v-17.8c0-6.8-.1-15.2-1.7-17.9-.8-1.4-2.3-2-4.6-2.3l-2.1-.3c-.8-.6-.7-2.4.2-2.6,3.6.2,6.9.3,10.5.3,3.9,0,6.3-.1,9.6-.3.7.5.9,2,.2,2.6l-2.1.5c-1.7.4-3.3.6-3.9,2.1-1.3,2.8-1.3,10.7-1.3,17.9v21.7h.1Z" style={ { fill: "#d2c52a", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_3)`}><g id="letter_3">
<g style={ { isolation: "isolate" } }>
<path d="m258.6,47.1c0-8.7-.1-10-4.4-10.4l-1.9-.2c-.6-.5-.6-2.1.1-2.6,6.6-.5,13.8-.8,22.8-.8s14.8.7,21.5,3.1c10.9,4,18.7,13.7,18.7,27.2,0,10.1-5,20.5-16.3,26.2-6.5,3.3-14.3,4.4-22.6,4.4-5.6,0-9.8-.5-13.2-.5s-7.6.1-11.6.3c-.7-.4-.8-2-.2-2.6l2-.3c4.3-.5,5.1-.8,5.1-10.5v-33.3Zm10.6,29.8c0,8.8.6,13.6,10.3,13.6,16.2,0,23.5-11.5,23.5-26.9,0-18-10.5-26.8-25.7-26.8-3.8,0-6.7.7-7.4,1.3-.6.5-.7,2.5-.7,6.7v32.1h0Z" style={ { fill: "#4bb9ea", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_4)`}><g id="letter_4">
<g style={ { isolation: "isolate" } }>
<path d="m375.4,48.5c0-8.7-.1-9.8-4.4-10.3l-2.4-.3c-.6-.6-.6-2.1.1-2.6,5.7-.5,13.5-.8,20.9-.8s13.3.9,17.3,3.1c4.6,2.5,8,6.7,8,13.3,0,8.4-6.5,12.6-10.9,14.4-.5.3-.4,1,0,1.5,7.3,12.3,11.8,20,16.1,23.6,2.6,2.2,5.2,2.7,6.3,2.8.5.4.5,1.4.2,1.8-1.1.3-2.8.5-6,.5-8.7,0-13.5-3.6-19-12-2.5-3.8-5-8.8-7.2-12.4-1.6-2.7-2.6-3.1-5.6-3.1-2.7,0-2.8.1-2.8,2v11.7c0,9.7.8,9.9,5.1,10.5l2,.3c.6.6.5,2.3-.2,2.6-4-.2-8.1-.3-12.1-.3s-8.1.1-12.3.3c-.7-.4-1-2-.2-2.6l2-.3c4.3-.5,5.1-.8,5.1-10.5v-33.2Zm10.6,13.1c0,2.9,0,3.1,4.4,3.1,8.9,0,13-4.4,13-13,0-7.2-4.6-13.5-12.6-13.5-4.7,0-4.8.3-4.8,4.5v18.9Z" style={ { fill: "#6a3e97", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_5)`}><g id="letter_5">
<path d="m37,189.3c0-8.7-.1-9.8-4.8-10.3l-2.6-.3c-.7-.6-.7-2.1.1-2.6,4.5-.4,11.8-.8,22.8-.8,8.4,0,15.1.7,19.6,3.1,4.6,2.5,7,6.1,7,11.8,0,5.4-4.3,9.5-11.3,11.6-.4.1-.6.4-.6.5,0,.2.2.4.8.5,7.6,1.1,16.1,5.6,16.1,15.8,0,4.2-1.5,8.7-6.1,12.1-4.7,3.6-11.3,5.1-22.7,5.1-4.4,0-8.6-.3-12.4-.3-4.4,0-9.1.1-13.5.3-.8-.4-.9-2-.2-2.6l2.2-.3c4.7-.5,5.6-.8,5.6-10.5v-33.1Zm11.6,10c0,2.4.3,2.5,4.3,2.5,9.4,0,13.7-3.4,13.7-11.6s-6.5-11.2-12.7-11.2c-5,0-5.3.2-5.3,3.8v16.5Zm0,21.4c0,8.3,1,11.7,9.7,11.7,6.9,0,13-4.1,13-12.2,0-9.4-7-14.9-18.1-14.9-4.4,0-4.6.5-4.6,2.4,0,0,0,13,0,13Z" style={ { fill: "#f47f20", strokewidth: 0.0 } } />
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_6)`}><g id="letter_6">
<g style={ { isolation: "isolate" } }>
<path d="m166.8,183.6c0-3.8-.1-4-2.5-4h-5.1c-8.4,0-10.8,1-14.2,8.4-.6.5-2.6.3-2.9-.6,1.5-4.9,2.9-10.6,3.6-13.8.2-.3.5-.4,1-.4.4,0,.7.1.9.4.5,2.3,1.7,2.4,7.9,2.4h37.2c4.5,0,5.8-.3,6.9-2.4.4-.2.7-.4,1.1-.4.5,0,1,.2,1.2.5-.9,3.7-1.6,11.6-1.4,14.5-.5.7-2,.9-2.8.3-1.2-7.1-2.9-8.8-12.7-8.8h-5.2c-2.4,0-2.5.2-2.5,4v39.3c0,9.7.8,9.9,5.1,10.4l3.3.4c.6.6.5,2.3-.2,2.6-5.3-.2-9.4-.3-13.4-.3s-8.3.1-14.1.3c-.7-.4-.8-2.2-.2-2.6l3.8-.5c4.3-.5,5.1-.6,5.1-10.3v-39.4h.1Z" style={ { fill: "#59b94f", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_7)`}><g id="letter_7">
<g style={ { isolation: "isolate" } }>
<path d="m312,220.5c0,2.7,0,13.5.3,15.6-.7,1-2.4,1.4-3.5,1.3-1.5-1.9-3.7-4.6-10.3-12l-21.3-24.4c-5.8-6.7-8.8-10.1-10.4-11.5-.3,0-.3,1-.3,5.8v17.8c0,6.8.1,15.2,1.6,17.9.8,1.4,2.4,2,4.6,2.3l2,.3c.8.6.7,2.4-.2,2.6-3.4-.2-6.9-.3-10.4-.3-3.8,0-6.3.1-9.5.3-.7-.5-.9-2-.2-2.6l2-.5c1.7-.4,3.4-.6,4-2.1,1.2-2.8,1.2-10.7,1.2-17.9v-21.6c0-7.1.1-8.6-3-11.2-1-.8-3.6-1.5-4.8-1.8l-1.4-.3c-.6-.5-.5-2.4.4-2.6,3.5.4,8.5.3,10.7.3,1.9,0,4.1-.1,6.3-.3,1.5,3.9,11.5,15.4,14.7,18.9l9.1,9.8c3.8,4.2,12.3,13.8,13.2,14.4.3-.3.3-.7.3-2.2v-17.8c0-6.8-.1-15.2-1.7-17.9-.8-1.4-2.3-2-4.6-2.3l-2.1-.3c-.8-.6-.7-2.4.2-2.6,3.6.2,6.9.3,10.5.3,3.9,0,6.3-.1,9.6-.3.7.5.9,2,.2,2.6l-2.1.5c-1.7.4-3.3.6-3.9,2.1-1.3,2.8-1.3,10.7-1.3,17.9v21.8h.1Z" style={ { fill: "#1c6bb4", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_8)`}><g id="letter_8">
<g style={ { isolation: "isolate" } }>
<path d="m375.3,233.4c-2-1.9-3.4-8.2-3.3-13.8.7-.9,2.5-1,3.4-.4,2,4.6,8,14.4,18.8,14.4,8.4,0,13.2-4.2,13.2-9.7,0-5.2-3-9.4-11.3-13.2l-4.8-2.2c-8.3-3.8-15.6-9.4-15.6-17.6,0-9,8.2-16.7,24.3-16.7,5.7,0,9.9,1.1,15.1,1.9,1.2,2,2.3,8,2.3,12.3-.6.8-2.5.9-3.5.3-1.7-4.7-5.5-10.8-14.9-10.8-8.8,0-12.5,4.7-12.5,9.6,0,3.8,3.2,7.9,10.5,11.1l6.9,3c7.2,3.1,15.1,8.7,15.1,17.9,0,10.4-9.6,17.8-25.6,17.8-10.2-.1-15.9-2.8-18.1-3.9Z" style={ { fill: "#d35589", strokewidth: 0.0 } } />
</g>
</g></g>
<g clipPath={`url(#${idPrefix}_clip_letter_1)`}><g id="letter_9" style={ { display: "none" } }>
<path d="m37,46.5c0-8.7-.1-9.8-4.8-10.3l-2.6-.3c-.7-.6-.7-2.1.1-2.6,4.5-.4,11.8-.8,22.8-.8,8.4,0,15.1.7,19.6,3.1,4.6,2.5,7,6.1,7,11.8,0,5.4-4.3,9.5-11.3,11.6-.4.1-.6.4-.6.5,0,.2.2.4.8.5,7.6,1.1,16.1,5.6,16.1,15.8,0,4.2-1.5,8.7-6.1,12.1-4.7,3.6-11.3,5.1-22.7,5.1-4.4,0-8.6-.3-12.4-.3-4.4,0-9.1.1-13.5.3-.8-.4-.9-2-.2-2.6l2.2-.3c4.7-.5,5.6-.8,5.6-10.5v-33.1Zm11.6,10c0,2.4.3,2.5,4.3,2.5,9.4,0,13.7-3.4,13.7-11.6s-6.5-11.2-12.7-11.2c-5,0-5.3.2-5.3,3.8v16.5Zm0,21.4c0,8.3,1,11.7,9.7,11.7,6.9,0,13-4.1,13-12.2,0-9.4-7-14.9-18.1-14.9-4.4,0-4.6.5-4.6,2.4,0,0,0,13,0,13Z" style={ { fill: "#e43f25", strokewidth: 0.0 } } />
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_2)`}><g id="letter_10" style={ { display: "none" } }>
<path d="m166.5,77.8c0,4.6.2,7.9,1.6,9.5,1.1,1.3,2.6,2,9.9,2,10.2,0,11.7-.5,15.9-9.9.9-.5,2.4-.2,2.9.6-.7,3.9-2.8,10.9-3.9,13.4-3.9-.2-11.8-.3-22.1-.3h-9.6c-4.7,0-9.3.1-13.2.3-.7-.4-1-2.2-.2-2.7l2.8-.5c4.3-.7,5.2-.8,5.2-10.4v-34.3c0-9.6-.8-9.9-5.2-10.5l-2.6-.4c-.6-.5-.6-2.3.2-2.7,4.6.2,8.8.3,13,.3s8.2-.1,12.3-.3c.8.4.9,2.2.2,2.7l-2,.4c-4.3.7-5.2.9-5.2,10.5v32.3h0Z" style={ { fill: "#d2c52a", strokewidth: 0.0 } } />
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_3)`}><g id="letter_11" style={ { display: "none" } }>
<g style={ { isolation: "isolate" } }>
<path d="m309.8,78.7c0,2.7,0,13.5.3,15.6-.7,1-2.4,1.4-3.5,1.3-1.5-1.9-3.7-4.6-10.3-12l-21.3-24.3c-5.8-6.7-8.8-10.1-10.4-11.5-.3,0-.3,1-.3,5.8v17.8c0,6.8.1,15.2,1.6,17.9.8,1.4,2.4,2,4.6,2.3l2,.3c.8.6.7,2.4-.2,2.6-3.4-.2-6.9-.3-10.4-.3-3.8,0-6.3.1-9.5.3-.7-.5-.9-2-.2-2.6l2-.5c1.7-.4,3.4-.6,4-2.1,1.2-2.8,1.2-10.7,1.2-17.9v-21.6c0-7.1.1-8.6-3-11.2-1-.8-3.6-1.5-4.8-1.8l-1.4-.3c-.6-.5-.5-2.4.4-2.6,3.5.4,8.5.3,10.7.3,1.9,0,4.1-.1,6.3-.3,1.5,3.9,11.5,15.4,14.7,18.9l9.1,9.8c3.8,4.2,12.3,13.8,13.2,14.4.3-.3.3-.7.3-2.2v-17.8c0-6.8-.1-15.2-1.7-17.9-.8-1.4-2.3-2-4.6-2.3l-2.1-.3c-.8-.6-.7-2.4.2-2.6,3.6.2,6.9.3,10.5.3,3.9,0,6.3-.1,9.6-.3.7.5.9,2,.2,2.6l-2.1.5c-1.7.4-3.3.6-3.9,2.1-1.3,2.8-1.3,10.7-1.3,17.9v21.7h.1Z" style={ { fill: "#4bb9ea", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_4)`}><g id="letter_12" style={ { display: "none" } }>
<g style={ { isolation: "isolate" } }>
<path d="m371.2,47.8c0-8.7-.1-10-4.4-10.4l-1.9-.2c-.6-.5-.6-2.1.1-2.6,6.6-.5,13.8-.8,22.8-.8s14.8.7,21.5,3.1c10.9,4,18.7,13.7,18.7,27.2,0,10.1-5,20.5-16.3,26.2-6.5,3.3-14.3,4.4-22.6,4.4-5.6,0-9.8-.5-13.2-.5s-7.6.1-11.6.3c-.7-.4-.8-2-.2-2.6l2-.3c4.3-.5,5.1-.8,5.1-10.5v-33.3Zm10.6,29.8c0,8.8.6,13.6,10.3,13.6,16.2,0,23.5-11.5,23.5-26.9,0-18-10.5-26.8-25.7-26.8-3.8,0-6.7.7-7.4,1.3-.6.5-.7,2.5-.7,6.7v32.1h0Z" style={ { fill: "#6a3e97", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_5)`}><g id="letter_13" style={ { display: "none" } }>
<path d="m81.5,226.2c0,3.2.5,5.6,2.2,6.4.3.4.3,1.1-.1,1.4-1,0-2.7.4-4.4.7-5.7,1.4-12.6,2.5-17.9,2.5-11.1,0-21.5-2.9-28.4-10.1-5.4-5.6-8.1-13.4-8.1-21.1s2.7-15.7,8.5-21.6c6.5-6.9,16.6-10.9,29.4-10.9,4.3,0,9,.7,12.3,1.4,2.1.5,4.8.8,5.9.8.1,2.8.7,7.5,1.2,14.6-.5.9-2.5,1-2.9.2-2-8.9-8.6-13.4-17.7-13.4-16.2,0-24,11.7-24,27.4,0,7.4,1.7,15.3,6.6,21.2s12.3,7.8,17.8,7.8c4.4,0,7.1-.7,8.2-2.1.6-.8.8-2.5.8-5.8v-3.3c0-6.5-.1-7.1-6.3-8.1l-3.3-.6c-.6-.6-.6-2.2.1-2.7,3.6.2,8,.3,14.4.3,4.1,0,7.3-.1,11.2-.3.9.5,1,2,.2,2.7l-1.7.3c-3.4.6-4,1.3-4,6.9v5.4h0Z" style={ { fill: "#f47f20", strokewidth: 0.0 } } />
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_6)`}><g id="letter_14" style={ { display: "none" } }>
<path d="m169,220.6c0,4.6.2,7.9,1.6,9.5,1.1,1.3,2.6,2,9.9,2,10.2,0,11.7-.5,15.9-9.9.9-.5,2.4-.2,2.9.6-.7,3.9-2.8,10.9-3.9,13.4-3.9-.2-11.8-.3-22.1-.3h-9.6c-4.7,0-9.3.1-13.2.3-.7-.4-1-2.2-.2-2.7l2.8-.5c4.3-.7,5.2-.8,5.2-10.4v-34.3c0-9.6-.8-9.9-5.2-10.5l-2.6-.4c-.6-.5-.6-2.3.2-2.7,4.6.2,8.8.3,13,.3s8.2-.1,12.3-.3c.8.4.9,2.2.2,2.7l-2,.4c-4.3.7-5.2.9-5.2,10.5v32.3h0Z" style={ { fill: "#59b94f", strokewidth: 0.0 } } />
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_7)`}><g id="letter_15" style={ { display: "none" } }>
<g style={ { isolation: "isolate" } }>
<path d="m264.5,233.4c-2-1.9-3.4-8.2-3.3-13.8.7-.9,2.5-1,3.4-.4,2,4.6,8,14.4,18.8,14.4,8.4,0,13.2-4.2,13.2-9.7,0-5.2-3-9.4-11.3-13.2l-4.8-2.2c-8.3-3.8-15.6-9.4-15.6-17.6,0-9,8.2-16.7,24.3-16.7,5.7,0,9.9,1.1,15.1,1.9,1.2,2,2.3,8,2.3,12.3-.6.8-2.5.9-3.5.3-1.7-4.7-5.5-10.8-14.9-10.8-8.8,0-12.5,4.7-12.5,9.6,0,3.8,3.2,7.9,10.5,11.1l6.9,3c7.2,3.1,15.1,8.7,15.1,17.9,0,10.4-9.6,17.8-25.6,17.8-10.2-.1-15.9-2.8-18.1-3.9Z" style={ { fill: "#1c6bb4", strokewidth: 0.0 } } />
</g>
</g></g><g clipPath={`url(#${idPrefix}_clip_letter_8)`}><g id="letter_16" style={ { display: "none" } }>
<g style={ { isolation: "isolate" } }>
<path d="m375.3,233.4c-2-1.9-3.4-8.2-3.3-13.8.7-.9,2.5-1,3.4-.4,2,4.6,8,14.4,18.8,14.4,8.4,0,13.2-4.2,13.2-9.7,0-5.2-3-9.4-11.3-13.2l-4.8-2.2c-8.3-3.8-15.6-9.4-15.6-17.6,0-9,8.2-16.7,24.3-16.7,5.7,0,9.9,1.1,15.1,1.9,1.2,2,2.3,8,2.3,12.3-.6.8-2.5.9-3.5.3-1.7-4.7-5.5-10.8-14.9-10.8-8.8,0-12.5,4.7-12.5,9.6,0,3.8,3.2,7.9,10.5,11.1l6.9,3c7.2,3.1,15.1,8.7,15.1,17.9,0,10.4-9.6,17.8-25.6,17.8-10.2-.1-15.9-2.8-18.1-3.9Z" style={ { fill: "#d35589", strokewidth: 0.0 } } />
</g>
</g></g>
</svg>
  );
}
