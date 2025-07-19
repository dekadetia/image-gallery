{currentSlide ? (
  currentSlide.src.endsWith('.webm') ? (
    <motion.video
      ref={mediaRef}
      src={currentSlide.src}
      controls
      autoPlay
      onLoadedMetadata={handleMediaLoad}
      className="object-contain max-w-full"
      style={commonStyles}
      initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction < 0 ? '100%' : '-100%', opacity: 0 }}
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      drag="x"
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x < -100 || info.velocity.x < -500) {
          changeSlide(1)
        } else if (info.offset.x > 100 || info.velocity.x > 500) {
          changeSlide(-1)
        }
      }}
    />
  ) : (
    <motion.img
      ref={mediaRef}
      src={currentSlide.src}
      alt={currentSlide.title || ''}
      onLoad={handleMediaLoad}
      className="object-contain max-w-full"
      style={commonStyles}
      initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction < 0 ? '100%' : '-100%', opacity: 0 }}
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      drag="x"
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x < -100 || info.velocity.x < -500) {
          changeSlide(1)
        } else if (info.offset.x > 100 || info.velocity.x > 500) {
          changeSlide(-1)
        }
      }}
    />
  )
) : (
  <div className="text-white">Loading...</div>
)}
