'use client'

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from 'react-icons/rx';

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [direction, setDirection] = useState(0);
  const metadataRef = useRef(null);
  const [metaHeight, setMetaHeight] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setIndex((prev) =>
      (prev + newDirection + slides.length) % slides.length
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') paginate(1);
    if (e.key === 'ArrowLeft') paginate(-1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    if (touchStartX.current - touchEndX.current > 50) {
      paginate(1);
    }
    if (touchEndX.current - touchStartX.current > 50) {
      paginate(-1);
    }
  };

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (metadataRef.current) {
      setMetaHeight(metadataRef.current.offsetHeight);
    }
  }, [index]);

  if (!open || !slides || index < 0 || index >= slides.length) return null;

  const slide = slides[index];

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  const getMediaStyle = (naturalWidth, naturalHeight) => {
    if (!window) return {}; // SSR guard
    const viewportWidth = window.innerWidth * 0.96; // minus margins
    const viewportHeight = window.innerHeight - metaHeight - 60; // minus metadata + margins
    const viewportRatio = viewportWidth / viewportHeight;
    const mediaRatio = naturalWidth / naturalHeight;

    if (mediaRatio > viewportRatio) {
      // Wider than viewport
      return {
        width: `${viewportWidth}px`,
        height: 'auto'
      };
    } else {
      // Taller than viewport
      return {
        width: 'auto',
        height: `${viewportHeight}px`
      };
    }
  };

  return (
    <AnimatePresence initial={false} custom={direction}>
      <motion.div
        className="fixed inset-0 yarl__container flex flex-col justify-between z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Media */}
        <div className="flex justify-center items-center flex-1">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={slide.src}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {slide.src.match(/\.(webm|mp4)$/i) ? (
                <video
                  src={slide.src}
                  controls
                  autoPlay
                  loop
                  muted
                  className="yarl__slide_image"
                  style={{ objectFit: 'contain', ...getMediaStyle(1920, 1080) }} // fallback size
                  onLoadedMetadata={(e) =>
                    Object.assign(
                      e.target.style,
                      getMediaStyle(e.target.videoWidth, e.target.videoHeight)
                    )
                  }
                />
              ) : (
                <img
                  src={slide.src}
                  alt={slide.title || ""}
                  className="yarl__slide_image"
                  style={{ objectFit: 'contain', ...getMediaStyle(1920, 1080) }}
                  onLoad={(e) =>
                    Object.assign(
                      e.target.style,
                      getMediaStyle(e.target.naturalWidth, e.target.naturalHeight)
                    )
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Metadata */}
        <div
          ref={metadataRef}
          className="yarl-slide-content pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          {slide.title && (
            <div className="yarl__slide_title">{slide.title}</div>
          )}
          {slide.director && (
            <div className="yarl__slide_description">{slide.director}</div>
          )}
          {slide.description && (
            <div className="yarl__slide_description">{slide.description}</div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl text-white"
        >
          <RxCross1 />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
