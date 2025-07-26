'use client'
import { useEffect } from 'react';
import gsap from 'gsap';

export default function AnimatedLogo() {
  useEffect(() => {
    const logo = document.getElementById('logo');
    if (!logo) return;

    const exitDirs = [
      { x: 120 }, { x: 120 }, { x: 120 },
      { y: 140 }, { y: -140 },
      { x: -120 }, { x: -120 }, { x: -120 }
    ];
    const enterDirs = [
      { y: 140 }, { x: -120 }, { x: -120 }, { x: -120 },
      { x: 120 }, { x: 120 }, { x: 120 }, { y: -140 }
    ];

    let longPressed = false;
    let longPressTimer;
    let toggled = false;

    const showAlt = () => {
      for (let i = 1; i <= 8; i++) {
        gsap.to(`#letter_${i}`, {
          duration: 0.5,
          ...exitDirs[i - 1]
        });
        const finalLetter = document.getElementById(`letter_${i + 8}`);
        finalLetter!.style.display = "inline";
        gsap.fromTo(finalLetter!,
          enterDirs[i - 1],
          {
            duration: 0.5,
            x: 0,
            y: 0
          }
        );
      }
    };

    const reset = () => {
      for (let i = 1; i <= 8; i++) {
        const finalLetter = document.getElementById(`letter_${i + 8}`);
        gsap.to(finalLetter!, {
          duration: 0.5,
          ...enterDirs[i - 1],
          onComplete: () => finalLetter!.style.display = "none"
        });
        gsap.to(`#letter_${i}`, {
          duration: 0.5,
          x: 0,
          y: 0
        });
      }
    };

    // Desktop hover
    logo.addEventListener('mouseenter', () => {
      showAlt();
      toggled = true;
    });
    logo.addEventListener('mouseleave', () => {
      reset();
      toggled = false;
    });

    // Long press start
    logo.addEventListener('touchstart', (e) => {
      longPressed = false;
      longPressTimer = setTimeout(() => {
        longPressed = true;
        if (toggled) {
          reset();
        } else {
          showAlt();
        }
        toggled = !toggled;
      }, 500);
    });

    // Long press end
    logo.addEventListener('touchend', (e) => {
      clearTimeout(longPressTimer);
      if (longPressed) {
        e.preventDefault(); // cancel link navigation
      }
    });

    // Suppress long-press context menu if it was used for toggling
    logo.addEventListener('contextmenu', (e) => {
      if (longPressed) e.preventDefault();
    });

    // Reset state when navigating back
    const handlePageShow = () => {
      for (let i = 1; i <= 16; i++) {
        const el = document.getElementById(`letter_${i}`);
        if (el) {
          el.style.transform = 'none';
          el.style.display = i <= 8 ? 'inline' : 'none';
        }
      }
      toggled = false;
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return (
    <svg className="w-40 h-auto" viewBox="0 0 312 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fontFamily="Helvetica Neue" fontWeight="700" fontSize="45" letterSpacing="0.1em" fill="#e43f25">
        <text id="letter_1" x="13" y="55">T</text>
        <text id="letter_2" x="53" y="55">N</text>
        <text id="letter_3" x="93" y="55">D</text>
        <text id="letter_4" x="133" y="55">R</text>
        <text id="letter_5" x="173" y="55">B</text>
        <text id="letter_6" x="213" y="55">T</text>
        <text id="letter_7" x="253" y="55">N</text>
        <text id="letter_8" x="293" y="55">S</text>

        <text id="letter_9" x="13" y="55" style={{ display: 'none' }}>S</text>
        <text id="letter_10" x="53" y="55" style={{ display: 'none' }}>T</text>
        <text id="letter_11" x="93" y="55" style={{ display: 'none' }}>N</text>
        <text id="letter_12" x="133" y="55" style={{ display: 'none' }}>B</text>
        <text id="letter_13" x="173" y="55" style={{ display: 'none' }}>R</text>
        <text id="letter_14" x="213" y="55" style={{ display: 'none' }}>D</text>
        <text id="letter_15" x="253" y="55" style={{ display: 'none' }}>N</text>
        <text id="letter_16" x="293" y="55" style={{ display: 'none' }}>T</text>
      </g>
      <g stroke="#e43f25" strokeWidth="2">
        <line x1="0" y1="80" x2="312" y2="80" />
        <line x1="0" y1="120" x2="312" y2="120" />
        <line x1="0" y1="160" x2="312" y2="160" />
        <line x1="0" y1="0" x2="0" y2="180" />
        <line x1="40" y1="0" x2="40" y2="180" />
        <line x1="80" y1="0" x2="80" y2="180" />
        <line x1="120" y1="0" x2="120" y2="180" />
        <line x1="160" y1="0" x2="160" y2="180" />
        <line x1="200" y1="0" x2="200" y2="180" />
        <line x1="240" y1="0" x2="240" y2="180" />
        <line x1="280" y1="0" x2="280" y2="180" />
        <line x1="312" y1="0" x2="312" y2="180" />
      </g>
    </svg>
  );
}
