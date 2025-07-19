'use client'

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from 'react-icons/rx';

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [direction, setDirection] = useState(0);
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
      paginate(1); // swipe left
    }
    if (touchEndX.current - touchStartX.current > 50) {
      paginate(-1); // swipe right
    }
  };

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open || !slides || index < 0 || index >= slides.length) return null;

  const slide = slides[index];

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <AnimatePresence initial={false} custom={direction}>
      <motion.div
        className="fixed inset-0 yarl__container flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="yarl__slide relative flex flex-col justify-center items-center"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          onClick={(e) => e.stopPropagation()} // prevent close on inner clicks
        >
          {/* Media rendering */}
          {slide.src.match(/\.(webm|mp4)$/i) ? (
            <video
              src={slide.src}
              controls
              autoPlay
              loop
              muted
              className="yarl__slide_image max-w-[96vw] max-h-[96vh] object-contain"
            />
          ) : (
            <img
              src={slide.src}
              alt={slide.title || ""}
              className="yarl__slide_image max-w-[96vw] max-h-[96vh] object-contain"
            />
          )}

          {/* Footer */}
          <div className="yarl-slide-content">
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
      </motion.div>
    </AnimatePresence>
  );
}
