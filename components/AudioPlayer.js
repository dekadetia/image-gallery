'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

// 🎧 Single Audio Player Instance With Crossfades + Fade on BlackMode
let audio = null;
let nextAudio = null;
let tracks = [];
let trackIndex = 0;
let initialized = false; // 🆕 Only load/shuffle once
const fadeDuration = 5000; // ms

async function fetchAudioFiles() {
  const folder = 'audio';
  const apiUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?prefix=${folder}%2F`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('Failed to fetch audio file list');
  const data = await res.json();

  tracks = data.items
    .filter(item => item.name.endsWith('.mp3'))
    .map(item => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(item.name)}?alt=media`);

  tracks = shuffle(tracks); // ✅ Immediately randomize
  console.log('🎧 Tracks loaded & shuffled:', tracks);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function fadeVolume(audioEl, from, to, duration) {
  if (!audioEl) return;
  const steps = 30;
  const stepTime = duration / steps;
  let currentStep = 0;

  const fadeInterval = setInterval(() => {
    const progress = currentStep / steps;
    audioEl.volume = from + (to - from) * progress;
    currentStep++;
    if (currentStep > steps) clearInterval(fadeInterval);
  }, stepTime);
}

function initAudio() {
  if (audio) return; // ✅ Already initialized
  audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.volume = 1.0;

  audio.addEventListener('ended', handleTrackEnd);
}

function handleTrackEnd() {
  if (!nextAudio) return;

  console.log(`🔄 Crossfade complete. Promoting nextAudio.`);
  audio.src = nextAudio.src;
  audio.volume = nextAudio.volume;
  audio.play().catch(err => console.warn('🚨 Playback error:', err));
  nextAudio = null;

  scheduleNextTrack();
}

function scheduleNextTrack() {
  const currentDuration = audio.duration * 1000;
  const crossfadeStart = currentDuration - fadeDuration;

  setTimeout(() => {
    trackIndex = (trackIndex + 1) % tracks.length;
    nextAudio = new Audio(tracks[trackIndex]);
    nextAudio.crossOrigin = 'anonymous';
    nextAudio.volume = 0.0;
    nextAudio.play().then(() => {
      console.log(`🎧 Preloading & crossfading to: ${tracks[trackIndex]}`);
      fadeVolume(audio, audio.volume, 0.0, fadeDuration);
      fadeVolume(nextAudio, 0.0, 1.0, fadeDuration);
    }).catch(err => console.warn('🚨 Next track preload error:', err));
  }, crossfadeStart);
}

async function startPlayback() {
  if (!initialized) {
    await fetchAudioFiles();
    if (!tracks.length) {
      console.warn('🚨 No tracks available; aborting playback');
      return;
    }
    initialized = true;
  }

  initAudio();
  if (audio.paused) {
    audio.src = tracks[trackIndex];
    audio.volume = 0.0; // 🆕 Start muted for fade-in
    audio.play().then(() => {
      console.log(`▶️ Resumed playback: ${tracks[trackIndex]}`);
      fadeVolume(audio, 0.0, 1.0, fadeDuration);
      scheduleNextTrack();
    }).catch(err => console.warn('🚨 Playback error:', err));
  }
}

function fadeOutAudio() {
  if (audio && !audio.paused) {
    fadeVolume(audio, audio.volume, 0.0, fadeDuration);
  }
  if (nextAudio && !nextAudio.paused) {
    fadeVolume(nextAudio, nextAudio.volume, 0.0, fadeDuration);
  }
}

function fadeInAudio() {
  if (audio && !audio.paused) {
    fadeVolume(audio, audio.volume, 1.0, fadeDuration);
  }
  if (nextAudio && !nextAudio.paused) {
    fadeVolume(nextAudio, nextAudio.volume, 1.0, fadeDuration);
  }
}

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useRef(null);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (audio) audio.muted = newMuted;
    if (nextAudio) nextAudio.muted = newMuted;
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
    startPlayback().then(() => {
      if (audio) audio.muted = muted;
      if (nextAudio) nextAudio.muted = muted;

      if (blackMode) {
        fadeInAudio();
      } else {
        fadeOutAudio();
      }
    }).catch(err => console.error('AudioPlayer error:', err));

    return () => {
      if (audio) fadeOutAudio();
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
