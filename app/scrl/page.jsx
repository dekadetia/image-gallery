'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import Link from 'next/link';
import { IoMdShuffle } from 'react-icons/io';
import { RxDoubleArrowUp, RxCross1 } from 'react-icons/rx';
import { IoMoonOutline } from 'react-icons/io5';
import Footer from '../../components/Footer';
import RootLayout from '../layout';
import AnimatedLogo from '../../components/AnimatedLogo';
import MoreImageLoader from '../../components/MoreImageLoader';
import Loader from '../../components/loader/loader';
import InfiniteScroll from 'react-infinite-scroll-component';
import AudioPlayer from '../../components/AudioPlayer';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Scrl() {
  const [index, setIndex] = useState(-1);
  const [Images, setImages] = useState([]);
  const [loader, __loader] = useState(true);
  const [autosMode, setAutosMode] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const scrollRef = useRef(null);
  const cursorTimerRef = useRef(null);
  const activityTimerRef = useRef(null);
  const wasCalled = useRef(false);
  const seenImageIds = useRef(new Set());

const slides = Images.map(photo => {
  const src = photo.src ?? '';
  if (src.toLowerCase().includes('.webm')) {
    return {
      type: 'video',
      width: 1080 * 4,
      height: 1620 * 4,
      title: `${photo.caption}`,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year,
      sources: [{
        src,
        type: 'video/webm'
      }],
      poster: '/assets/transparent.png',
      autoPlay: true,
      muted: true,
      loop: true,
      controls: false
    };
  } else {
    return {
      type: 'image',
      src,
      width: 1080 * 4,
      height: 1620 * 4,
      title: `${photo.caption}`,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year
    };
  }
});


  const getImages = async load => {
    if (load !== 'load more') {
      __loader(true);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        const uniqueImages = images.filter(
          img => !seenImageIds.current.has(img.id)
        );
        uniqueImages.forEach(img => seenImageIds.current.add(img.id));

        setImages(prev => [...prev, ...uniqueImages]);
      } else {
        console.error('Failed to get files');
      }
    } catch (error) {
      console.log(error);
    } finally {
      __loader(false);
    }
  };

  const getRandmImages = async () => {
    __loader(true);
    setImages([]);
    seenImageIds.current = new Set();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        images.forEach(img => seenImageIds.current.add(img.id));
        setImages(images);
      } else {
        console.error('Failed to get files');
      }
    } catch (error) {
      console.log(error);
    } finally {
      __loader(false);
    }
  };

  const handleCloseLightbox = () => {
    setIndex(-1);
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    getImages();
  }, []);

  useEffect(() => {
    let scrollSpeed = 0.5;
    const scrollStep = () => {
      window.scrollBy(0, scrollSpeed);
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
        window.scrollTo(0, 0);
      }
      scrollRef.current = requestAnimationFrame(scrollStep);
    };
    scrollRef.current = requestAnimationFrame(scrollStep);

    return () => cancelAnimationFrame(scrollRef.current);
  }, []);

  const handleUserActivity = () => {
    clearTimeout(activityTimerRef.current);
    setShowControls(true);
    activityTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearTimeout(activityTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (autosMode) {
      document.body.classList.add('autosmode');

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      }

      const handleMouseMove = () => {
        clearTimeout(cursorTimerRef.current);
        setHideCursor(false);

        cursorTimerRef.current = setTimeout(() => {
          setHideCursor(true);
        }, 3000);
      };

      window.addEventListener('mousemove', handleMouseMove);

      return () => {
        document.body.classList.remove('autosmode');
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.warn('Exiting fullscreen failed:', err);
          });
        }

        clearTimeout(cursorTimerRef.current);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [autosMode]);

  useEffect(() => {
    if (hideCursor && autosMode) {
      document.body.classList.add('blackmode-hide-cursor');
    } else {
      document.body.classList.remove('blackmode-hide-cursor');
    }
  }, [hideCursor, autosMode]);

  const handleImageClick = imageId => {
    const idx = Images.findIndex(img => img.id === imageId);
    if (idx !== -1) setIndex(idx);
  };

  const toggleAutosMode = async () => {
    if (!autosMode) {
      document.body.style.backgroundColor = '#000000';
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.warn('Fullscreen request failed:', err);
        }
      }
      console.log('🟢 Entering autosMode');
    } else {
      document.body.style.backgroundColor = '';
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn('Exiting fullscreen failed:', err);
        }
      }
      console.log('🔴 Exiting autosMode');
    }
    setAutosMode(!autosMode);
  };
// 🩹 MutationObserver to remove title="Close"
useEffect(() => {
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.yarl__button[title="Close"]').forEach(btn => {
            btn.removeAttribute('title');
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
}, []);
  
  return (
    <RootLayout>
      {/* 🌙 Moon */}
      {!autosMode && (
        <motion.button
          onClick={toggleAutosMode}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 0.2 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="fixed top-4 right-4 text-2xl z-50 cursor-pointer text-white"
          aria-label="Enter AutosMode"
        >
          <IoMoonOutline />
        </motion.button>
      )}

      {/* ❌ X */}
      {autosMode && (
<motion.button
  onClick={toggleAutosMode}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: showControls ? 1 : 0, scale: showControls ? 1 : 0.95 }}
  whileHover={{ opacity: 1 }}
  transition={{ duration: 2, ease: 'easeInOut' }}
  className="fixed top-4 right-4 text-2xl z-50 cursor-pointer text-white"
  aria-label="Exit AutosMode"
>
  <RxCross1 />
</motion.button>
      )}

      {!autosMode && (
        <div className="w-full flex justify-center items-center py-9">
          <div className="w-full grid place-items-center space-y-6">
<Link href="/">
  <div id="logo" className="w-40 h-auto cursor-pointer">
    <AnimatedLogo />
  </div>
</Link>

            <div className="flex gap-8 items-center pt-[2.5px]" style={{ marginBottom: '4px' }}>
              <Link href={'/fade'}>
                <img
                  src="/assets/crossfade.svg"
                  className="w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 align-middle mr-[3.75px]"
                  alt=""
                />
              </Link>

              <RxDoubleArrowUp className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle" />

              <Link href={'/rndm'}>
                <IoMdShuffle className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle ml-[3.75px]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={autosMode ? 'w-full z-50' : 'px-4 lg:px-16 pb-10'}>
        {loader ? (
          <Loader />
        ) : (
          <InfiniteScroll
            dataLength={Images.length}
            next={() => getImages('load more')}
            hasMore={true}
            loader={<MoreImageLoader />}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map(photo => (
                <div key={photo.id}>
{photo.src?.toLowerCase().includes('.webm') ? (
  <video
    src={photo.src}
    onClick={() => handleImageClick(photo.id)}
    className="aspect-[16/9] object-cover cursor-zoom-in"
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    poster="/assets/transparent.png"
    style={{
      display: 'block',
      width: '100%',
      height: 'auto',
      backgroundColor: 'transparent'
    }}
  />
) : (
  <img
    alt={photo.name}
    src={photo.src}
    onClick={() => handleImageClick(photo.id)}
    className="aspect-[16/9] object-cover cursor-zoom-in"
    decoding="async"
  />
)}

                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {slides && (
<Lightbox
  index={index}
  slides={slides}
  open={index >= 0}
  close={handleCloseLightbox}
  plugins={[Video]}
          render={{
            slideFooter: ({ slide }) => (
<div className={cn(
  "lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content",
  slide.type === 'video' && 'relative top-auto bottom-unset'
)}>
                {slide.title && (
                  <div className="yarl__slide_title">{slide.title}</div>
                )}
                <div className={cn('!space-y-0', slide.director && '!mb-5')}>
                  {slide.director && (
                    <div className="yarl__slide_description !text-[#99AABB]">
                      <span className="font-medium">{slide.director}</span>
                    </div>
                  )}
                  {slide.description && (
                    <div className="yarl__slide_description">
                      {slide.description}
                    </div>
                  )}
                </div>
              </div>
            )
          }}
        />
      )}

{autosMode && <AudioPlayer blackMode={autosMode} showControls={showControls} />}
      {!loader && !autosMode && <Footer />}
    </RootLayout>
  );
}
