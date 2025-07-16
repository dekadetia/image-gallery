'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

// 🎧 Single Audio Player Instance With Crossfades
let audio = null;
let nextAudio = null;
let tracks = [];
let trackIndex = 0;
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

  console.log('🎧 Tracks loaded:', tracks);
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
  if (!tracks.length) await fetchAudioFiles();
  if (!tracks.length) {
    console.warn('🚨 No tracks available; aborting playback');
    return;
  }

  shuffle(tracks);
  trackIndex = 0;
  initAudio();
  audio.src = tracks[trackIndex];
  audio.volume = 1.0;
  audio.play().then(() => {
    console.log(`▶️ Started playback: ${tracks[trackIndex]}`);
    scheduleNextTrack();
  }).catch(err => console.warn('🚨 Playback error:', err));
}

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useRef(null);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (audio) audio.muted = newMuted || !blackMode;
    if (nextAudio) nextAudio.muted = newMuted || !blackMode;
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
    let isMounted = true;

    startPlayback().then(() => {
      if (isMounted) {
        if (audio) audio.muted = muted || !blackMode;
        if (nextAudio) nextAudio.muted = muted || !blackMode;
      }
    }).catch(err => console.error('AudioPlayer error:', err));

    return () => {
      isMounted = false;
      if (audio) audio.muted = true;
      if (nextAudio) nextAudio.muted = true;
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
