'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

// 🏗️ Singleton Audio Engine (Bombproof + Animation Frame Fades)
const AudioEngine = (() => {
  let tracks = [];
  let currentIndex = 0;
  let currentAudio = null;
  let nextAudio = null;
  let isPlaying = false;
  let muted = false;
  let sessionToken = 0; // 🆕 Session token for cancellation
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

  function fadeVolume(audio, from, to, duration, token) {
    if (!audio) return;

    let start = null;

    function step(timestamp) {
      if (token !== sessionToken || !audio) {
        return; // 🛑 Cancel if session changed or audio gone
      }

      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      audio.volume = from + (to - from) * progress;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function cleanupAudio(audio) {
    if (audio && audio.src) {
      audio.pause();
      audio.src = '';
    }
  }

  function playTrack(index, token) {
    if (!tracks.length || token !== sessionToken) {
      console.log('🔒 playTrack aborted: session token mismatch');
      return;
    }

    const audio = new Audio(tracks[index % tracks.length]);
    audio.volume = muted ? 0.0 : 1.0;
    audio.crossOrigin = 'anonymous';

    currentAudio = audio;

    audio.play().then(() => {
      console.log(`🎧 Now playing: ${tracks[index % tracks.length]}`);
    }).catch(err => {
      console.warn('🚨 Playback error:', err);
    });

    audio.oncanplaythrough = () => {
      const duration = audio.duration * 1000;
      const crossfadeStart = duration - fadeDuration;

      const preloadNext = setTimeout(() => {
        if (!isPlaying || token !== sessionToken) {
          clearTimeout(preloadNext);
          return;
        }

        const nextIndex = (index + 1) % tracks.length;
        const next = new Audio(tracks[nextIndex]);
        next.volume = 0.0;
        next.crossOrigin = 'anonymous';

        next.play().then(() => {
          console.log(`🎧 Preloaded next track: ${tracks[nextIndex]}`);
          nextAudio = next;

          fadeVolume(audio, muted ? 0.0 : 1.0, 0.0, fadeDuration, token);
          fadeVolume(next, 0.0, muted ? 0.0 : 1.0, fadeDuration, token);

          const switchTracks = setTimeout(() => {
            if (!isPlaying || token !== sessionToken) {
              clearTimeout(switchTracks);
              cleanupAudio(next);
              return;
            }

            console.log(`🔄 Switching to track ${nextIndex}`);
            cleanupAudio(audio);
            currentAudio = next;
            nextAudio = null;
            currentIndex = nextIndex;

            playTrack(nextIndex + 1, token);
          }, fadeDuration);

        }).catch(err => {
          console.warn(`🚨 Failed to preload next track:`, err);
        });

      }, crossfadeStart);
    };

    audio.onerror = () => {
      console.warn('🚨 Audio error detected; cleaning up');
      cleanupAudio(audio);
    };
  }

  async function start() {
    if (isPlaying) {
      console.log('⚠️ AudioEngine already playing');
      return;
    }
    sessionToken++; // 🆕 Invalidate any old sessions
    console.log(`▶️ Starting playback session ${sessionToken}`);
    try {
      await fetchAudioFiles();
    } catch (err) {
      console.error('🚨 Error fetching tracks:', err);
      return;
    }
    if (!tracks.length) {
      console.warn('🚨 No tracks available; aborting playback');
      return;
    }
    tracks = shuffle(tracks);
    currentIndex = 0;
    isPlaying = true;
    playTrack(0, sessionToken);
  }

  function stop() {
    if (!isPlaying) return; // 🆕 Guard against double stop
    console.log('🛑 Stopping all audio and cancelling session');
    sessionToken++; // 🔥 Cancel all pending timers and fades
    if (currentAudio) {
      fadeVolume(currentAudio, currentAudio.volume, 0.0, fadeDuration, sessionToken);
      setTimeout(() => cleanupAudio(currentAudio), fadeDuration);
      currentAudio = null;
    }
    if (nextAudio) {
      cleanupAudio(nextAudio);
      nextAudio = null;
    }
    isPlaying = false;
    tracks = [];
  }

  function setMute(state) {
    muted = state;
    if (currentAudio) fadeVolume(currentAudio, currentAudio.volume, muted ? 0.0 : 1.0, 500, sessionToken);
    if (nextAudio) fadeVolume(nextAudio, nextAudio.volume, muted ? 0.0 : 1.0, 500, sessionToken);
  }

  return { start, stop, setMute };
})();

export default function AudioPlayer({ blackMode }) {
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const hideTimer = useRef(null);

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
    let cleanupRequested = false;

    const manageAudio = async () => {
      if (blackMode) {
        try {
          await AudioEngine.start();
          keepButtonVisible();
        } catch (err) {
          console.error('AudioEngine error:', err);
        }
      } else {
        AudioEngine.stop();
      }
    };

    manageAudio();

    return () => {
      if (!cleanupRequested) {
        cleanupRequested = true;
        AudioEngine.stop();
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
