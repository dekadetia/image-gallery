import { motion } from 'framer-motion'

export default function MediaSlot({ src, alt = '', className = '' }) {
  const isVideo = src.endsWith('.webm')

  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className={`absolute top-0 left-0 h-full w-full object-cover aspect-[16/9] ${className}`}
      />
    )
  }

  return (
    <motion.img
      src={src}
      alt={alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      className={`absolute top-0 left-0 h-full w-full object-cover aspect-[16/9] ${className}`}
    />
  )
}
