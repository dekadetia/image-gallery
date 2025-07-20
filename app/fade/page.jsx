'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import RootLayout from '../layout';
import Link from 'next/link';
import { RxDoubleArrowUp, RxCross1 } from "react-icons/rx";
import { IoMdShuffle } from 'react-icons/io';
import { IoMoonOutline } from 'react-icons/io5';
import Loader from '../../components/loader/loader';
import Footer from '../../components/Footer';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video'
import AudioPlayer from '../../components/AudioPlayer';

export default function FadeGallery() {
    const [slots, setSlots] = useState(Array(9).fill(null));
    const poolRef = useRef([]);
    const intervalRef = useRef(null);
    const loadingRef = useRef(false);
    const isInitialLoad = useRef(true);
    const [loader, __loader] = useState(true);

    const [blackMode, setBlackMode] = useState(false);
    const [hideCursor, setHideCursor] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const activityTimerRef = useRef(null);

    const [index, setIndex] = useState(-1);
    const [slides, setSlides] = useState([]);

    const lastSlotRef = useRef(-1);
    const lastUpdatedRef = useRef(Array(9).fill(0));
    let fadeCount = useRef(0);

    const fetchImages = async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images`);
            const data = await res.json();
            const images = data.images;

            if (images.length) {
                poolRef.current.push(...images);

                const newSlides = images.map((photo) => {
                    const src = photo.src ?? '';
                    if (src.toLowerCase().includes('.webm')) {
                        return {
                            type: 'video',
                            width: 1080 * 4,
                            height: 1620 * 4,
                            title: photo.caption,
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
                            title: photo.caption,
                            description: photo.dimensions,
                            director: photo.director || null,
                            year: photo.year
                        };
                    }
                });

                setSlides((prev) => [...prev, ...newSlides]);

                if (isInitialLoad.current && slots.every(slot => slot === null) && poolRef.current.length >= 9) {
                    const newSlots = poolRef.current.splice(0, 9);
                    setSlots(newSlots);
                    isInitialLoad.current = false;
                }
            }
        } catch (err) {
            console.error('Failed to fetch fade images:', err);
        } finally {
            loadingRef.current = false;
            __loader(false);
        }
    };

    const pickSlot = () => {
        fadeCount.current++;

        const sortedSlots = lastUpdatedRef.current
            .map((lastUpdate, index) => ({ index, lastUpdate }))
            .sort((a, b) => a.lastUpdate - b.lastUpdate);

        const candidates = sortedSlots.filter(s => s.index !== lastSlotRef.current);

        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        lastUpdatedRef.current[chosen.index] = fadeCount.current;
        lastSlotRef.current = chosen.index;

        return chosen.index;
    };

    useEffect(() => {
        fetchImages();

        intervalRef.current = setInterval(() => {
            setSlots(prev => {
                if (poolRef.current.length === 0) {
                    fetchImages();
                    return prev;
                }

                const nextImage = poolRef.current.shift();
                if (!nextImage) return prev;

                const randomIndex = pickSlot();
                const newSlots = [...prev];
                newSlots[randomIndex] = nextImage;
                return newSlots;
            });
        }, 5000);

        return () => clearInterval(intervalRef.current);
    }, []);

    const toggleBlackMode = async () => {
        if (!blackMode) {
            document.body.style.backgroundColor = '#000000';
            if (document.documentElement.requestFullscreen) {
                try {
                    await document.documentElement.requestFullscreen();
                } catch (err) {
                    console.warn('Fullscreen request failed:', err);
                }
            }
            console.log('🟢 Entering blackMode');
        } else {
            document.body.style.backgroundColor = '';
            if (document.exitFullscreen) {
                try {
                    await document.exitFullscreen();
                } catch (err) {
                    console.warn('Exiting fullscreen failed:', err);
                }
            }
            console.log('🔴 Exiting blackMode');
        }
        setBlackMode(!blackMode);
    };

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
        if (hideCursor && blackMode) {
            document.body.classList.add('blackmode-hide-cursor');
        } else {
            document.body.classList.remove('blackmode-hide-cursor');
        }
    }, [hideCursor, blackMode]);

    const handleImageClick = (imageSrc) => {
        const idx = slides.findIndex(slide => slide.src === imageSrc);
        if (idx !== -1) setIndex(idx);
    };

    return (
        <RootLayout>
            {/* 🌙 Moon */}
            {!blackMode && (
                <motion.button
                    onClick={toggleBlackMode}
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: 0.2 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="fixed top-4 right-4 text-2xl z-[9999] cursor-pointer text-white"
                    aria-label="Enter Blackmode"
                >
                    <IoMoonOutline />
                </motion.button>
            )}

            {/* ❌ X */}
            {blackMode && (
                <motion.button
                    onClick={toggleBlackMode}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: showControls ? 1 : 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="fixed top-4 right-4 text-2xl z-[9999] cursor-pointer text-white"
                    aria-label="Exit Blackmode"
                >
                    <RxCross1 />
                </motion.button>
            )}

            <div className={`${blackMode ? 'fixed inset-0 flex justify-center items-center bg-black z-50' : 'px-4 lg:px-16 pb-10'}`}>
                {!blackMode && (
                    <div className='w-full flex justify-center items-center py-9'>
                        <div className='w-full grid place-items-center space-y-6'>
                            <Link href={'/'}>
                                <img
                                    src='/assets/logo.svg'
                                    className='object-contain w-40'
                                    alt='Logo'
                                />
                            </Link>
<div className="flex gap-8 items-center pt-[2.5px]" style={{ marginBottom: '4px' }}>
                                <img
                                    src="/assets/crossfade.svg"
                                    className="w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 align-middle mr-[3.75px]"
                                    alt=""
                                />
                                <Link href={'/scrl'}>
                                    <RxDoubleArrowUp
                                        className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle"
                                    />
                                </Link>
                                <Link href={'/rndm'}>
                                    <IoMdShuffle
                                        className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle ml-[3.75px]"
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
                {loader ? (
                    <Loader />
                ) : (
                    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center'>
                        {slots.map((image, idx) => (
                            <div
                                key={idx}
                                className='w-full aspect-[16/9] relative overflow-hidden cursor-zoom-in'
                                onClick={() => handleImageClick(image?.src)}
                            >
                                <FadeSlot image={image} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {!loader && !blackMode && <Footer />}
            {slides && (
                <Lightbox
                    index={index}
                    slides={slides}
                    open={index >= 0}
                    close={() => setIndex(-1)}
                    plugins={[Video]}
                    render={{
                        slideFooter: ({ slide }) => (
                            <div
                                className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content"
                            >
                                {slide.title && (
                                    <div className="yarl__slide_title">{slide.title}</div>
                                )}
                                <div className={slide.director && "!mb-5"}>
                                    {slide.director && (
                                        <div className="yarl__slide_description !text-[#99AABB]">
                                            <span className="font-medium">{slide.director}</span>
                                        </div>
                                    )}
                                    {slide.description && (
                                        <div className="yarl__slide_description">{slide.description}</div>
                                    )}
                                </div>
                            </div>
                        )
                    }}
                />
            )}
            {blackMode && <AudioPlayer blackMode={blackMode} />}
        </RootLayout>
    );
}

function FadeSlot({ image }) {
    const [currentImage, setCurrentImage] = useState(image);
    const [previousImage, setPreviousImage] = useState(null);

    // 🛡 Guard: If no image yet, render an empty placeholder
    if (!image || !image.src) {
        return <div className="relative w-full h-full"></div>;
    }

    useEffect(() => {
        if (!image || !image.src || image.id === currentImage?.id) return;

        if ((image?.src ?? '').toLowerCase().includes('.webm')) {
            const preload = document.createElement('video');
            preload.src = image.src;
            preload.preload = 'metadata';
            preload.muted = true;
            preload.playsInline = true;
            preload.onloadeddata = () => {
                if (currentImage && image) {
                    setPreviousImage(currentImage);
                    setCurrentImage(image);
                }
            };
        } else {
            const preload = new Image();
            preload.src = image.src;
            preload.onload = () => {
                if (currentImage && image) {
                    setPreviousImage(currentImage);
                    setCurrentImage(image);
                }
            };
        }
    }, [image?.id]);

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
        <div className="relative w-full h-full">
            {(previousImage?.src ?? '').toLowerCase().includes('.webm') ? (
                <motion.video
                    key={previousImage.id}
                    src={previousImage.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/assets/transparent.png"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 h-full w-full object-cover aspect-[16/9]"
                />
            ) : (
                previousImage?.src && (
                    <motion.img
                        key={previousImage.id}
                        src={previousImage.src}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        className="absolute top-0 left-0 h-full w-full object-cover aspect-[16/9]"
                        alt=""
                    />
                )
            )}

            {(currentImage?.src ?? '').toLowerCase().includes('.webm') ? (
                <motion.video
                    key={currentImage.id}
                    src={currentImage.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/assets/transparent.png"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 h-full w-full object-cover aspect-[16/9]"
                />
            ) : (
                currentImage?.src && (
                    <motion.img
                        key={currentImage.id}
                        src={currentImage.src}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        className="absolute top-0 left-0 h-full w-full object-cover aspect-[16/9]"
                        alt=""
                    />
                )
            )}
        </div>
    );
}
