'use client'

import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from 'react-icons/rx';

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  if (!open || !slides || index < 0 || index >= slides.length) return null;

  const slide = slides[index];

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 yarl__container flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="yarl__slide relative"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Media rendering */}
          {slide.src.match(/\.(webm|mp4)$/i) ? (
            <video
              src={slide.src}
              controls
              autoPlay
              loop
              muted
              className="yarl__slide_image"
            />
          ) : (
            <img
              src={slide.src}
              alt={slide.title || ""}
              className="yarl__slide_image"
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

          {/* Controls */}
          <button
            onClick={prevSlide}
            className="yarl__navigation_prev absolute left-2 top-1/2 text-3xl text-white"
          >
            ◀
          </button>
          <button
            onClick={nextSlide}
            className="yarl__navigation_next absolute right-2 top-1/2 text-3xl text-white"
          >
            ▶
          </button>
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
