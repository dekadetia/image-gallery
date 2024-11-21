'use client'

import { useState, useEffect, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Link from 'next/link'
import { IoMdList, IoMdShuffle } from 'react-icons/io'
import { RxCaretSort } from 'react-icons/rx'
import Footer from '../../components/Footer'
import RootLayout from '../layout'
import MoreImageLoader from '../../components/MoreImageLoader'
import Loader from '../../components/loader/loader'
import InfiniteScroll from 'react-infinite-scroll-component'

export default function Random () {
  const descriptionTextAlign = 'end'
  const descriptionMaxLines = 3
  const isOpen = true

  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const [loader, __loader] = useState(true)
  const wasCalled = useRef(false)

  const getImages = async load => {
    if (load != 'load more') {
      __loader(t => true)
    }

    // setImages(i => [])
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        let uniqueImages = []
        setImages(prevImages => {
          uniqueImages = images.filter(
            image => !prevImages.some(prevImage => prevImage.id === image.id)
          )
          return [...prevImages, ...uniqueImages]
        })

        const newSlides = uniqueImages.map(photo => {
          const width = 1080 * 4
          const height = 1620 * 4
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions
          }
        })

        setSlides(prevSlides => [...prevSlides, ...newSlides])
      } else {
        console.error('Failed to get files')
        errorToast('Failed to get files')
      }
    } catch (error) {
      console.log(error)
    } finally {
      __loader(t => false)
    }
  }

  const getRandmImages = async load => {
    __loader(t => true)
    setImages(i => [])

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        setImages([...images])
        const newSlides = images.map(photo => {
          const width = 1080 * 4
          const height = 1620 * 4
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions
          }
        })

        setSlides([...newSlides])
      } else {
        console.error('Failed to get files')
        errorToast('Failed to get files')
      }
    } catch (error) {
      console.log(error)
    } finally {
      __loader(t => false)
    }
  }

  const handleCloseLightbox = () => {
    setIndex(-1)
  }

  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    getImages()
  })

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
              <Link href={'/indx'}>
                <IoMdList className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl' />
              </Link>

              <Link href={'/ordr'}>
                <RxCaretSort className='cursor-pointer transition-all duration-200 hover:scale-105 text-3xl' />
              </Link>

              <IoMdShuffle
                onClick={getRandmImages}
                className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl'
              />
            </div>
          </div>
        </div>

        {loader ? (
          <Loader />
        ) : (
          <InfiniteScroll
            dataLength={Images.length}
            next={() => getImages('load more')}
            hasMore={true}
            loader={<MoreImageLoader />}
          >
            <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center'>
              {Images.map((photo, i) => (
                <div key={i}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className='aspect-[16/9] object-cover cursor-zoom-in'
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}

        {slides && (
          <Lightbox
            plugins={[Captions]}
            index={index}
            slides={slides}
            open={index >= 0}
            close={handleCloseLightbox}
            captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
          />
        )}
      </div>

      {!loader && <Footer />}
    </RootLayout>
  )
}
