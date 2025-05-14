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
    const [loader, __loader] = useState(true)

    useEffect(() => {
        // Wait a moment to render 9 boxes
        const delay = setTimeout(() => __loader(false), 1000)
        return () => clearTimeout(delay)
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
                                alt=''
                            />
                        </Link>

                        <div className='flex gap-8 items-center'>
                            <img
                                src='/assets/crossfade.svg'
                                className='w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 cursor-pointer'
                                alt=''
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
                        {Array(9)
                            .fill(0)
                            .map((_, idx) => (
                                <div key={idx} className='w-full aspect-[16/9] relative overflow-hidden'>
                                    <ImageFadeBox />
                                </div>
                            ))}
                    </div>
                )}
            </div>
            {!loader && <Footer />}
        </RootLayout>
    )
}

function ImageFadeBox() {
    const [currentImage, setCurrentImage] = useState(null)
    const [previousImage, setPreviousImage] = useState(null)
    const intervalRef = useRef(null)

    const fetchOneImage = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images?limit=1`)
            const data = await res.json()
            const img = data.images?.[0]
            if (!img || img.id === currentImage?.id) return

            const preload = new Image()
            preload.src = img.src
            preload.onload = () => {
                setPreviousImage(currentImage)
                setCurrentImage(img)
            }
        } catch (err) {
            console.error('Error fetching one image:', err)
        }
    }

    useEffect(() => {
        fetchOneImage()
        intervalRef.current = setInterval(fetchOneImage, 5000)
        return () => clearInterval(intervalRef.current)
    }, [])

    return (
        <div className='relative w-full h-full'>
            {previousImage && (
                <motion.img
                    key={previousImage.id}
                    src={previousImage.src}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className='absolute top-0 left-0 w-full h-full object-cover aspect-[16/9]'
                    alt=''
                />
            )}
            {currentImage && (
                <motion.img
                    key={currentImage.id}
                    src={currentImage.src}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className='absolute top-0 left-0 w-full h-full object-cover aspect-[16/9]'
                    alt=''
                />
            )}
        </div>
    )
}
  
