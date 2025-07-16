'use client';

import { useEffect, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

// 🏗️ Singleton Audio Engine
const AudioEngine = (() => {
  let tracks = [];
  let currentIndex = 0;
  let currentAudio = null;
  let nextAudio = null;
  let isPlaying = false;
  let muted = false;
  let isTrackActive = false; // 🔒 Lock for recursive playTrack
  const fadeDuration = 5000;

  async function fetchAudioFiles() {
    const folder = 'audio';
    const apiUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?prefix=${folder}%2F`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to fetch audio file list');
    const data = await res.json();

    tracks = data.items
      .filter(item => item.name.endsWith('.mp3'))
      .map(item => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(item.name)}?alt=media`);

    console.log('🎧 Tracks loaded:', tracks);
  }

  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function fadeVolume(audio, from, to, duration) {
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      const progress = currentStep / steps;
      audio.volume = from + (to - from) * progress;
      currentStep++;
      if (currentStep > steps) clearInterval(fadeInterval);
    }, stepTime);
  }

  function playTrack(index) {
    if (!tracks.length) return;
    if (isTrackActive) {
      console.log('🔒 Skipping playTrack; another is already active');
      return;
    }

    isTrackActive = true; // 🔐 Lock playback loop
    console.log(`🎧 Starting track ${index % tracks.length}`);

    const audio = new Audio(tracks[index % tracks.length]);
    audio.volume = muted ? 0.0 : 1.0;
    audio.crossOrigin = 'anonymous';

    audio.play().then(() => {
      console.log(`🎧 Now playing: ${tracks[index % tracks.length]}`);
      currentAudio = audio;
    }).catch(err => {
      console.warn('🚨 Playback error:', err);
      isTrackActive = false; // 💥 Unlock on failure
    });

    audio.oncanplaythrough = () => {
      const duration = audio.duration * 1000;
      const crossfadeStart = duration - fadeDuration;

      setTimeout(() => {
        if (!isPlaying) return; // 💥 Abort if stopped
        const nextIndex = (index + 1) % tracks.length;
        const next = new Audio(tracks[nextIndex]);
        next.volume = 0.0;
        next.crossOrigin = 'anonymous';
        next.play().then(() => {
          console.log(`🎧 Preloaded next track: ${tracks[nextIndex]}`);
          nextAudio = next;

          fadeVolume(audio, muted ? 0.0 : 1.0, 0.0, fadeDuration);
          fadeVolume(next, 0.0, muted ? 0.0 : 1.0, fadeDuration);

          setTimeout(() => {
            console.log(`🔄 Switching to track ${nextIndex}`);
            audio.pause();
            audio.src = '';
            currentAudio = next;
            nextAudio = null;
            currentIndex = nextIndex;

            isTrackActive = false; // 🔓 Unlock before next recursive call
            playTrack(nextIndex + 1);
          }, fadeDuration);
        }).catch(err => {
          console.warn(`🚨 Failed to preload next track:`, err);
          isTrackActive = false; // 💥 Unlock on preload failure
        });
      }, crossfadeStart);
    };

    audio.onerror = () => {
      console.warn('🚨 Audio error detected; unlocking');
      isTrackActive = false; // 💥 Unlock on error
    };
  }

  async function start() {
    if (isPlaying) {
      console.log('⚠️ AudioEngine already playing');
      return;
    }
    await fetchAudioFiles();
    tracks = shuffle(tracks);
    currentIndex = 0;
    isPlaying = true;
    playTrack(0);
  }

  function stop() {
    console.log('🛑 Stopping all audio');
    if (currentAudio) {
      fadeVolume(currentAudio, currentAudio.volume, 0.0, fadeDuration);
      setTimeout(() => {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
      }, fadeDuration);
    }
    if (nextAudio) {
      nextAudio.pause();
      nextAudio.src = '';
      nextAudio = null;
    }
    isPlaying = false;
    isTrackActive = false; // 🔓 Unlock on stop
    tracks = [];
  }

  function setMute(state) {
    muted = state;
    if (currentAudio) fadeVolume(currentAudio, currentAudio.volume, muted ? 0.0 : 1.0, 500);
    if (nextAudio) fadeVolume(nextAudio, nextAudio.volume, muted ? 0.0 : 1.0, 500);
  }

  return { start, stop, setMute };
})();

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useState(null);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    AudioEngine.setMute(newMuted);
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
      AudioEngine.start();
      keepButtonVisible();
    } else {
      AudioEngine.stop();
      clearTimeout(hideTimer.current);
      setVisible(false);
      setFadingOut(false);
    }

    return () => {
      AudioEngine.stop();
      clearTimeout(hideTimer.current);
    };
  }, [blackMode]);

  if (!blackMode) return null;

  return (
    <>
      <div
        onMouseEnter={keepButtonVisible}
        onTouchStart={keepButtonVisible}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '50px',
          height: '50px',
          zIndex: 9998,
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
