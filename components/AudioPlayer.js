'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

async function fetchAudioFiles() {
  const folder = 'audio';
  const apiUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?prefix=${folder}%2F`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('Failed to fetch audio file list');
  const data = await res.json();

  const files = data.items
    .filter(item => item.name.endsWith('.mp3'))
    .map(nameToTokenizedUrl);

  console.log('🎧 Tokenized Audio URLs:', files);
  return files;
}

function nameToTokenizedUrl(item) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(item.name)}?alt=media`;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function AudioPlayer({ blackMode }) {
  const [tracks, setTracks] = useState([]);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useRef(null);
  const currentIndex = useRef(0);
  const currentAudio = useRef(null);
  const nextAudio = useRef(null);
  const fadeDuration = 5000;

  const playTrack = (index) => {
    if (!tracks.length) return;

    const audio = new Audio(tracks[index % tracks.length]);
    audio.volume = muted ? 0.0 : 1.0;
    audio.crossOrigin = "anonymous";

    audio.play().then(() => {
      console.log(`🎧 Playing track ${index % tracks.length}: ${tracks[index % tracks.length]}`);
      currentAudio.current = audio;
    }).catch(err => {
      console.warn(`🚨 Autoplay blocked for track ${index}:`, err);
    });

    audio.oncanplaythrough = () => {
      const duration = audio.duration * 1000;
      const crossfadeStart = duration - fadeDuration;

      console.log(`⏳ Scheduling crossfade for track ${index} at ${crossfadeStart}ms`);

      setTimeout(() => {
        const nextIndex = (index + 1) % tracks.length;
        const next = new Audio(tracks[nextIndex]);
        next.volume = 0.0;
        next.crossOrigin = "anonymous";
        next.play().then(() => {
          console.log(`🎧 Next track ${nextIndex} started for crossfade`);
          nextAudio.current = next;

          fadeVolume(audio, muted ? 0.0 : 1.0, 0.0, fadeDuration);
          fadeVolume(next, 0.0, muted ? 0.0 : 1.0, fadeDuration);

          setTimeout(() => {
            console.log(`🔄 Switching to track ${nextIndex}`);
            audio.pause();
            audio.src = '';
            currentAudio.current = next;
            nextAudio.current = null;
            currentIndex.current = nextIndex;

            playTrack(nextIndex + 1); // Loop continues
          }, fadeDuration);
        }).catch(err => {
          console.warn(`🚨 Could not start next track ${nextIndex}:`, err);
        });
      }, crossfadeStart);
    };
  };

  const fadeVolume = (audio, from, to, duration) => {
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      const progress = currentStep / steps;
      audio.volume = from + (to - from) * progress;
      currentStep++;
      if (currentStep > steps) {
        clearInterval(fadeInterval);
      }
    }, stepTime);
  };

  const stopAudio = () => {
    if (currentAudio.current) {
      fadeVolume(currentAudio.current, currentAudio.current.volume, 0.0, fadeDuration);
      setTimeout(() => {
        currentAudio.current.pause();
        currentAudio.current.src = '';
      }, fadeDuration);
    }
    if (nextAudio.current) {
      nextAudio.current.pause();
      nextAudio.current.src = '';
    }
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;
      if (currentAudio.current) {
        fadeVolume(
          currentAudio.current,
          currentAudio.current.volume,
          newMuted ? 0.0 : 1.0,
          500
        );
      }
      if (nextAudio.current) {
        fadeVolume(
          nextAudio.current,
          nextAudio.current.volume,
          newMuted ? 0.0 : 1.0,
          500
        );
      }
      return newMuted;
    });
    keepButtonVisible();
  };

  const keepButtonVisible = () => {
    clearTimeout(hideTimer.current);
    setVisible(true);
    setFadingOut(false);

    hideTimer.current = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => setVisible(false), 1000);
    }, 10000);
  };

  useEffect(() => {
    if (blackMode) {
      const handleStartAudio = () => {
        fetchAudioFiles()
          .then(fetched => {
            const shuffled = shuffle(fetched);
            setTracks(shuffled);
            currentIndex.current = 0;

            playTrack(0); // Start first track immediately
          })
          .catch(err => console.error('Audio fetch error:', err));
      };

      window.addEventListener('tndrStartAudio', handleStartAudio);
      keepButtonVisible();

      return () => {
        window.removeEventListener('tndrStartAudio', handleStartAudio);
      };
    } else {
      stopAudio();
      clearTimeout(hideTimer.current);
      setVisible(false);
      setFadingOut(false);
    }

    return () => {
      stopAudio();
      clearTimeout(hideTimer.current);
    };
  }, [blackMode]);

  if (!blackMode || !visible) return null;

  return (
    <button
      onClick={toggleMute}
      onMouseEnter={keepButtonVisible}
      onTouchStart={keepButtonVisible}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        opacity: fadingOut ? 0 : 0.8,
        transition: 'opacity 1s ease-in-out',
        zIndex: 9999,
      }}
    >
      {muted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
    </button>
  );
}
