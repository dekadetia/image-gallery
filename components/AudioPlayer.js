'use client';

import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const bucket = 'tndrbtns.appspot.com';

// 🏗️ Singleton Audio Engine (Bombproof + Animation Frame Fades + StrictMode Safe)
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

    c
