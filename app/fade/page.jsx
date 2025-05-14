'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import RootLayout from '../layout'
import Link from 'next/link'
import { RxCaretSort } from 'react-icons/rx'
import { IoMdShuffle } from 'react-icons/io'
import Loader from '../../components/loader/loader'
import Footer from '../../components/Footer'

export default function FadeGallery() {
    const [slots, setSlots] = useState(Array(9).fill(null))
    const poolRef = useRef([])
    const intervalRef = useRef(null)
    const loadingRef = useRef(false)
    const [loader, __loader] = useState(true)

    const fetchImages = async () => {
        if (loadingRef.current) return
        loadingRef.current = true

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images`)
            const data = await res.json()
            const images = data.images

            if (images.length) {
                poolRef.current.push(...images)

                // If first time and slots are empty
                if (slots.every(slot => slot === null) && poolRef.current.length >= 9) {
                    const newSlots = poolRef.current.splice(0, 9)
                    setSlots(newSlots)
                }
                  
            }
        } catch (err) {
            console.error('Failed to fetch fade images:', err)
        } finally {
            loadingRef.current = false
            __loader(false)
        }
    }

    useEffect(() => {
        fetchImages()

        intervalRef.current = setInterval(() => {
            setSlots(prev => {
                if (poolRef.current.length === 0) {
                    fetchImages()
                    return prev
                }

                const randomIndex = Math.floor(Math.random() * 9)
                const nextImage = poolRef.current.shift()
                if (!nextImage || prev[randomIndex]?.id === nextImage.id) return prev

                const newSlots = [...prev]
                newSlots[randomIndex] = nextImage
                return newSlots
            })
        }, 5000)

        return () => clearInterval(intervalRef.current)
    }, [])

    return (
        <RootLayout>
            <div className='px-4 lg:px-16 pb-10'>
                {/* Navigation */}
                <div className='w-full flex justify-center items-center py-9'>
                    <div className='w-full grid place-items-center space-y-6'>
                        <Link href={'/'}>
                            <img
                                src='/assets/logo.svg'
                                className='object-contain w-40'
                                alt='Logo'
                            />
                        </Link>

                        <div className='flex gap-8 items-center'>
                            <img
                                src="/assets/crossfade.svg"
                                className='w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 cursor-pointer'
                                alt="Crossfade"
                            />
                            <Link href={'/ordr'}>
                                <RxCaretSort className='cursor-pointer transition-all duration-200 hover:scale-105 text-3xl' />
                            </Link>
                            <Link href={'/rndm'}>
                                <IoMdShuffle className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl' />
                            </Link>
                        </div>
                    </div>
                </div>

                {loader ? (
                    <Loader />
                ) : (
                    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center'>
                            {slots.map((image, idx) => (
                                <div key={idx} className='w-full aspect-[16/9] relative overflow-hidden'>
                                    <FadeSlot image={image} />
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {!loader && <Footer />}
        </RootLayout>
    )
}


function FadeSlot({ image }) {
    const [currentImage, setCurrentImage] = useState(image)
    const [previousImage, setPreviousImage] = useState(null)

    useEffect(() => {
        if (!image || image.id === currentImage?.id) return

        const preload = new Image()
        preload.src = image.src
        preload.onload = () => {
            setPreviousImage(currentImage)
            setCurrentImage(image)
        }
    }, [image?.id])

    return (
        <div className='relative w-full h-full'>
            {/* Previous image fading out */}
            {previousImage && (
                <motion.img
                    key={previousImage.id}
                    src={previousImage.src}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className='absolute top-0 left-0 h-full w-full object-cover aspect-[16/9]'
                    alt=''
                />
            )}

            {/* Current image fading in */}
            {currentImage && (
                <motion.img
                    key={currentImage.id}
                    src={currentImage.src}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className='absolute top-0 left-0 h-full w-full object-cover aspect-[16/9]'
                    alt=''
                />
            )}
        </div>
    )
}
  