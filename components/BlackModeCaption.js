'use client';

import { motion } from 'framer-motion';

export default function BlackModeCaption({ activeSlide, showControls }) {
  if (!activeSlide || (!activeSlide.title && !activeSlide.director)) return null;

  // ✂️ Simplify director credit
  let director = activeSlide.director || '';
  director = director.split('·')[0].trim(); // remove interpunct and after
  director = director.replace(/Dir\.\/DP/gi, 'Dir.');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: showControls ? 1 : 0, scale: showControls ? 1 : 0.95 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontSize: '0.875rem',
        zIndex: 9999,
        lineHeight: '1.25rem',
        maxWidth: 'calc(100% - 40px)',
      }}
    >
      {activeSlide.title && (
        <div className="font-medium mb-1">{activeSlide.title}</div>
      )}
      {director && (
        <div style={{ color: '#99AABB' }}>{director}</div>
      )}
    </motion.div>
  );
}
