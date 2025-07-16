'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

// 🎧 Single Audio Player Instance
let audio = null;
let tracks = [];
let trackIndex = 0;

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

function initAudioPlayer() {
  if (audio) return; // ✅ Already initialized
  audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.volume = 1.0;

  audio.addEventListener('ended', () => {
    trackIndex = (trackIndex + 1) % tracks.length;
    audio.src = tracks[trackIndex];
    audio.play().catch(err => console.warn('🚨 Playback error:', err));
  });
}

async function startPlayback() {
  if (!tracks.length) await fetchAudioFiles();
  if (!tracks.length) {
    console.warn('🚨 No tracks available; aborting playback');
    return;
  }

  shuffle(tracks);
  trackIndex = 0;
  initAudioPlayer();
  audio.src = tracks[trackIndex];
  audio.play().catch(err => console.warn('🚨 Playback error:', err));
}

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useRef(null);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (audio) audio.muted = newMuted || !blackMode; // 👈 Mute if toggled OR blackMode off
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
      if (isMounted && audio) {
        audio.muted = muted || !blackMode; // 👈 Mute unless blackMode and unmuted
      }
    }).catch(err => console.error('AudioPlayer error:', err));

    return () => {
      isMounted = false;
      if (audio) {
        audio.muted = true; // 👈 Always mute on unmount
      }
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
