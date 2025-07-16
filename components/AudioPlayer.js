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
    .map(item => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(item.name)}?alt=media`);

  console.log('🎧 Audio files loaded:', files);
  return files;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false); // Start unmuted
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useRef(null);
  const currentIndex = useRef(0);
  const currentAudio = useRef(null);
  const nextAudio = useRef(null);
  const fadeDuration = 5000;
  const isPlaying = useRef(false); // 🔥 Guarantees only one playback loop

  const playTrack = (index, tracks) => {
    if (!tracks.length) return;

    const audio = new Audio(tracks[index % tracks.length]);
    audio.volume = muted ? 0.0 : 1.0;
    audio.crossOrigin = 'anonymous';

    audio.play().then(() => {
      console.log(`🎧 Now playing: ${tracks[index % tracks.length]}`);
      currentAudio.current = audio;
    }).catch(err => {
      console.warn('🚨 Playback error:', err);
    });

    audio.oncanplaythrough = () => {
      const duration = audio.duration * 1000;
      const crossfadeStart = duration - fadeDuration;

      setTimeout(() => {
        const nextIndex = (index + 1) % tracks.length;
        const next = new Audio(tracks[nextIndex]);
        next.volume = 0.0;
        next.crossOrigin = 'anonymous';
        next.play().then(() => {
          console.log(`🎧 Preloaded next track: ${tracks[nextIndex]}`);
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

            playTrack(nextIndex + 1, tracks);
          }, fadeDuration);
        }).catch(err => {
          console.warn(`🚨 Failed to preload next track:`, err);
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
      if (currentStep > steps) clearInterval(fadeInterval);
    }, stepTime);
  };

  const stopAudio = () => {
    console.log('🛑 Stopping all audio');
    if (currentAudio.current) {
      fadeVolume(currentAudio.current, currentAudio.current.volume, 0.0, fadeDuration);
      setTimeout(() => {
        currentAudio.current.pause();
        currentAudio.current.src = '';
        currentAudio.current = null;
      }, fadeDuration);
    }
    if (nextAudio.current) {
      nextAudio.current.pause();
      nextAudio.current.src = '';
      nextAudio.current = null;
    }
    isPlaying.current = false;
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;
      if (currentAudio.current) {
        fadeVolume(currentAudio.current, currentAudio.current.volume, newMuted ? 0.0 : 1.0, 500);
      }
      if (nextAudio.current) {
        fadeVolume(nextAudio.current, nextAudio.current.volume, newMuted ? 0.0 : 1.0, 500);
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
      fetchAudioFiles()
        .then((fetched) => {
          const shuffled = shuffle(fetched);
          currentIndex.current = 0;

          if (!isPlaying.current) {
            console.log('🎯 Starting playback on blackMode enter');
            playTrack(0, shuffled);
            isPlaying.current = true;
          }
        })
        .catch(err => console.error('Audio fetch error:', err));
      keepButtonVisible();
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

  if (!blackMode) return null;

  return (
    <>
      {/* Hotspot to revive mute button */}
      <div
        onMouseEnter={keepButtonVisible}
        onTouchStart={keepButtonVisible}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '50px',
          height: '50px',
          zIndex: 9998
        }}
      />
      {visible && (
        <button
          onClick={toggleMute}
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
      )}
    </>
  );
}
