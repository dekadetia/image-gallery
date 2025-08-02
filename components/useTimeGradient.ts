'use client';

import { useEffect, useState } from 'react';

export type TimeGradient = 'morning' | 'day' | 'dusk' | 'night';

export function getTimeGradient(): TimeGradient {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return 'morning';  // Cool morning
  } else if (hour >= 12 && hour < 18) {
    return 'day';      // Bright midday
  } else if (hour >= 18 && hour < 22) {
    return 'dusk';     // Warm dusk
  } else {
    return 'night';    // Dark night
  }
}

export function useTimeGradient(): TimeGradient | null {
  const [gradient, setGradient] = useState<TimeGradient | null>(null);

  useEffect(() => {
    setGradient(getTimeGradient());
  }, []);

  return gradient;
}
