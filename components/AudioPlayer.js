'use client'; 

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute, FaForward, FaBackward } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

let audio = null;
let tracks = [];
let trackIndex = 0;
let initialized = false;
let crossfadeTimer = null;
const normalFadeDuration = 10000; // 🕊️ 10s natural crossfade
const skipFadeDuration = 2000;    // ⚡ 2s for manual skip

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

  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const targetVolume = from + (to - from) * progress;
    audioEl.volume = Math.max(0, Math.min(1, targetVolume));

    if (progress < 1) {
      requestAnimationFrame(step);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(step);
}

function initAudio() {
  if (audio) return;
  audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.volume = 1.0;

  audio.addEventListener('ended', handleTrackEnd);
}

function handleTrackEnd() {
  console.log('⏭ Track ended, moving to next naturally.');
  crossfadeToNextTrack(normalFadeDuration);
}

function crossfadeToNextTrack(fadeMs = normalFadeDuration) {
  clearTimeout(crossfadeTimer);
  fadeVolume(audio, audio.volume, 0.0, fadeMs, () => {
    trackIndex = (trackIndex + 1) % tracks.length;
    audio.src = tracks[trackIndex];
    audio.play().then(() => {
      console.log(`🎧 Crossfaded to: ${tracks[trackIndex]}`);
      fadeVolume(audio, 0.0, 1.0, fadeMs);
      scheduleNextCrossfade();
    }).catch(err => console.warn('🚨 Playback error on next track:', err));
  });
}

function crossfadeToPrevTrack(fadeMs = normalFadeDuration) {
  clearTimeout(crossfadeTimer);
  fadeVolume(audio, audio.volume, 0.0, fadeMs, () => {
    trackIndex = (trackIndex - 1 + tracks.length) % tracks.length;
    audio.src = tracks[trackIndex];
    audio.play().then(() => {
      console.log(`🎧 Crossfaded to: ${tracks[trackIndex]}`);
      fadeVolume(audio, 0.0, 1.0, fadeMs);
      scheduleNextCrossfade();
    }).catch(err => console.warn('🚨 Playback error on previous track:', err));
  });
}

function scheduleNextCrossfade() {
  const currentDuration = audio.duration * 1000;
  const crossfadeStart = currentDuration - normalFadeDuration;

  clearTimeout(crossfadeTimer);
  crossfadeTimer = setTimeout(() => {
    crossfadeToNextTrack(normalFadeDuration);
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
      fadeVolume(audio, 0.0, 1.0, normalFadeDuration);
      scheduleNextCrossfade();
    }).catch(err => console.warn('🚨 Playback error on start:', err));
  }
}

function fadeOutAudio() {
  if (audio && !audio.paused) {
    fadeVolume(audio, audio.volume, 0.0, normalFadeDuration, () => {
      console.log('🛑 Fully faded out; stopping audio.');
      audio.pause();
      audio.src = ''; // 💥 Clear source to prevent zombie resume
    });
  }
  clearTimeout(crossfadeTimer);
}

function fadeInAudio() {
  if (audio && !audio.paused) {
    fadeVolume(audio, audio.volume, 1.0, normalFadeDuration);
  }
}

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const hideTimer = useRef(null);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (audio) audio.muted = newMuted;
    keepButtonVisible();
  };

  const skipNext = () => {
    if (audio) crossfadeToNextTrack(skipFadeDuration);
  };

  const skipPrev = () => {
    if (audio) crossfadeToPrevTrack(skipFadeDuration);
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
      startPlayback().then(() => {
        if (audio) audio.muted = muted;
        fadeInAudio();
        setFadeIn(true);
        keepButtonVisible();
      }).catch(err => console.error('AudioPlayer error:', err));
    } else {
      fadeOutAudio();
    }

    return () => {
      fadeOutAudio(); // Ensure we fade out on unmount too
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
          zIndex: 9998
        }}
      />
      {visible && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '1.25rem', // 📏 Updated spacing matches nav icons
            zIndex: 9999,
            opacity: fadingOut ? 0 : 0.8,
            transform: fadeIn ? 'scale(1)' : 'scale(0.95)',
            transition: fadeIn
              ? 'opacity 0.8s ease-out, transform 0.4s ease-out'
              : 'opacity 0.5s ease-in-out'
          }}
        >
          <button onClick={skipPrev} style={buttonStyle}>
            <FaBackward size={24} /> {/* 📐 Updated size */}
          </button>
          <button onClick={toggleMute} style={buttonStyle}>
            {muted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
          </button>
          <button onClick={skipNext} style={buttonStyle}>
            <FaForward size={24} />
          </button>
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
  transition: 'opacity 0.3s ease-in-out, transform 0.2s ease-in-out',
  padding: '0.5rem', // 📱 Better tap targets
  borderRadius: '9999px'
};
