'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute, FaForward, FaBackward } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

let audio = null;
let tracks = [];
let trackIndex = 0;
let initialized = false;
let crossfadeTimer = null;
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

  tracks = shuffle(tracks);
  console.log('🎧 Tracks loaded & shuffled:', tracks);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function fadeVolume(audioEl, from, to, duration, onComplete) {
  if (!audioEl) return;
  const steps = 30;
  const stepTime = duration / steps;
  let currentStep = 0;

  const fadeInterval = setInterval(() => {
    const progress = currentStep / steps;
    audioEl.volume = from + (to - from) * progress;
    currentStep++;
    if (currentStep > steps) {
      clearInterval(fadeInterval);
      if (onComplete) onComplete();
    }
  }, stepTime);
}

function initAudio() {
  if (audio) return;
  audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.volume = 1.0;

  audio.addEventListener('ended', handleTrackEnd);
}

function handleTrackEnd() {
  console.log('⏭ Track ended, moving to next with crossfade.');
  crossfadeToNextTrack();
}

function crossfadeToNextTrack() {
  clearTimeout(crossfadeTimer);
  fadeVolume(audio, audio.volume, 0.0, fadeDuration, () => {
    trackIndex = (trackIndex + 1) % tracks.length;
    audio.src = tracks[trackIndex];
    audio.play().then(() => {
      console.log(`🎧 Crossfaded to: ${tracks[trackIndex]}`);
      fadeVolume(audio, 0.0, 1.0, fadeDuration);
      scheduleNextCrossfade();
    }).catch(err => console.warn('🚨 Playback error:', err));
  });
}

function crossfadeToPrevTrack() {
  clearTimeout(crossfadeTimer);
  fadeVolume(audio, audio.volume, 0.0, fadeDuration, () => {
    trackIndex = (trackIndex - 1 + tracks.length) % tracks.length;
    audio.src = tracks[trackIndex];
    audio.play().then(() => {
      console.log(`🎧 Crossfaded to: ${tracks[trackIndex]}`);
      fadeVolume(audio, 0.0, 1.0, fadeDuration);
      scheduleNextCrossfade();
    }).catch(err => console.warn('🚨 Playback error:', err));
  });
}

function scheduleNextCrossfade() {
  const currentDuration = audio.duration * 1000;
  const crossfadeStart = currentDuration - fadeDuration;

  clearTimeout(crossfadeTimer);
  crossfadeTimer = setTimeout(() => {
    crossfadeToNextTrack();
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
    audio.volume = 0.0;
    audio.play().then(() => {
      console.log(`▶️ Started playback: ${tracks[trackIndex]}`);
      fadeVolume(audio, 0.0, 1.0, fadeDuration);
      scheduleNextCrossfade();
    }).catch(err => console.warn('🚨 Playback error:', err));
  }
}

function fadeOutAudio() {
  if (audio && !audio.paused) {
    fadeVolume(audio, audio.volume, 0.0, fadeDuration);
  }
}

function fadeInAudio() {
  if (audio && !audio.paused) {
    fadeVolume(audio, audio.volume, 1.0, fadeDuration);
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
    keepButtonVisible();
  };

  const skipNext = () => {
    if (audio) crossfadeToNextTrack();
  };

  const skipPrev = () => {
    if (audio) crossfadeToPrevTrack();
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
      if (blackMode) {
        fadeInAudio();
        keepButtonVisible(); // 🆕 Auto-show controls for 10s on blackMode enter
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
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '10px',
            zIndex: 9999,
            opacity: fadingOut ? 0 : 0.8,
            transition: 'opacity 0.5s ease-in-out', // 🆕 Smooth fade in/out
          }}
        >
          <button onClick={skipPrev} style={buttonStyle}><FaBackward size={16} /></button>
          <button onClick={toggleMute} style={buttonStyle}>
            {muted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
          </button>
          <button onClick={skipNext} style={buttonStyle}><FaForward size={16} /></button>
        </div>
      )}
    </>
  );
}

const buttonStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  opacity: 0.8,
  transition: 'opacity 0.3s ease-in-out',
};
