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
        if (finalLetter) {
          finalLetter.style.display = "inline";
          gsap.fromTo(finalLetter,
            enterDirs[i - 1],
            {
              duration: 0.5,
              x: 0,
              y: 0
            }
          );
        }
      }
    };

    const reset = () => {
      for (let i = 1; i <= 8; i++) {
        const finalLetter = document.getElementById(`letter_${i + 8}`);
        if (finalLetter) {
          gsap.to(finalLetter, {
            duration: 0.5,
            ...enterDirs[i - 1],
            onComplete: () => (finalLetter.style.display = "none")
          });
        }
        gsap.to(`#letter_${i}`, {
          duration: 0.5,
          x: 0,
          y: 0
        });
      }
    };

    const hardReset = () => {
      for (let i = 1; i <= 8; i++) {
        const base = document.getElementById(`letter_${i}`) as HTMLElement | null;
        const alt = document.getElementById(`letter_${i + 8}`) as HTMLElement | null;
        if (base) base.style.transform = '';
        if (alt) {
          alt.style.transform = '';
          alt.style.display = 'none';
        }
      }
      toggled = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          const logo = document.getElementById('logo');
          if (logo) hardReset();
        }, 50);
      }
    };

    logo.addEventListener('mouseenter', () => {
      showAlt();
      toggled = true;
    });
    logo.addEventListener('mouseleave', () => {
      reset();
      toggled = false;
    });

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

    logo.addEventListener('touchend', (e) => {
      clearTimeout(longPressTimer);
      if (longPressed) {
        e.preventDefault(); // cancel link navigation
      }
    });

    logo.addEventListener('contextmenu', (e) => {
      if (longPressed) e.preventDefault();
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      logo.removeEventListener('mouseenter', showAlt);
      logo.removeEventListener('mouseleave', reset);
      logo.removeEventListener('touchstart', () => {});
      logo.removeEventListener('touchend', () => {});
      logo.removeEventListener('contextmenu', () => {});
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <svg className="w-40 h-auto" id="logo" viewBox="0 0 449 266.3" xmlns="http://www.w3.org/2000/svg">
      {/* SVG content stays unchanged */}
    </svg>
  );
}
