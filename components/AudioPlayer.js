'use client';

import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

async function fetchAudioFiles() {
  const folder = 'audio';
  const apiUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?prefix=${folder}%2F`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('Failed to fetch audio file list');
  const data = await res.json();

  // Get just file names
  const files = data.items
    .filter(item => item.name.endsWith('.mp3'))
    .map(item => item.name);

  // For each file, fetch its metadata to get token
  const tokenizedUrls = await Promise.all(
    files.map(async (name) => {
      const metadataUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(name)}`;
      const metaRes = await fetch(metadataUrl);
      if (!metaRes.ok) throw new Error(`Failed to fetch metadata for ${name}`);
      const metaData = await metaRes.json();
      const token = metaData.downloadTokens;

      if (!token) throw new Error(`No download token found for ${name}`);

      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
    })
  );

  console.log('Tokenized Audio URLs:', tokenizedUrls);
  return tokenizedUrls;
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
  const currentSound = useRef(null);
  const nextSound = useRef(null);
  const fadeDuration = 5000;

  const playTrack = (index) => {
    if (!tracks.length) return;

    const sound = new Howl({
      src: [tracks[index]],
      volume: 0.0, // Start muted for autoplay
      onend: () => {
        currentIndex.current = (index + 1) % tracks.length;
        playTrack(currentIndex.current);
      }
    });

    currentSound.current = sound;
    sound.play();

    // Fade in after play starts
    sound.once('play', () => {
      sound.fade(0.0, muted ? 0.0 : 1.0, 1000);

      const duration = sound.duration() * 1000;
      setTimeout(() => {
        const nextIndex = (index + 1) % tracks.length;
        const next = new Howl({
          src: [tracks[nextIndex]],
          volume: 0.0,
        });

        nextSound.current = next;
        next.play();

        sound.fade(muted ? 0.0 : 1.0, 0.0, fadeDuration);
        next.fade(0.0, muted ? 0.0 : 1.0, fadeDuration);

        setTimeout(() => {
          sound.stop();
          currentSound.current = next;
          nextSound.current = null;
          currentIndex.current = nextIndex;
        }, fadeDuration);
      }, duration - fadeDuration);
    });
  };

  const stopAudio = () => {
    if (currentSound.current) {
      currentSound.current.fade(currentSound.current.volume(), 0.0, fadeDuration);
      setTimeout(() => currentSound.current.stop(), fadeDuration);
    }
    if (nextSound.current) {
      nextSound.current.stop();
    }
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;
      if (currentSound.current) {
        currentSound.current.fade(
          currentSound.current.volume(),
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
      fetchAudioFiles()
        .then(fetched => {
          const shuffled = shuffle(fetched);
          setTracks(shuffled);
          currentIndex.current = 0;
          playTrack(0);
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
