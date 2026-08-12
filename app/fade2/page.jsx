'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import RootLayout from '../layout'
import Link from 'next/link'
import { RxDoubleArrowUp, RxCross1 } from 'react-icons/rx'
import { IoMdShuffle } from 'react-icons/io'
import { IoMoonOutline } from 'react-icons/io5'
import Loader from '../../components/loader/loader'
import Footer from '../../components/Footer'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import AudioPlayer from '../../components/AudioPlayer'
import AnimatedLogo from '../../components/AnimatedLogo'

const GAP = 10

/*
  Nine images, arranged in two irregular bands:

  BAND 1: [1, 2, 1] = 4 images
  BAND 2: [2, 1, 2] = 5 images

  The topology remains understandable,
  but the actual widths/heights constantly
  change as the images' aspect ratios change.
*/

const FADE_PATTERN = [
  [1, 2, 1],
  [2, 1, 2]
]


/* ---------------------------------------------------------
   METADATA

   Example:
   1.33:1 | 1436×1080 | 334 KB | WEBP

   Geometry follows TNDR's declared AR.
--------------------------------------------------------- */

function parseImageMeta(dimensions) {
  const parts =
    dimensions
      ?.split('|')
      .map(part => part.trim()) ?? []

  const declaredRatio =
    parseFloat(parts[0])

  const dimensionMatch =
    parts[1]?.match(
      /(\d+)\s*[×x]\s*(\d+)/i
    )

  const width =
    dimensionMatch
      ? Number(dimensionMatch[1])
      : null

  const height =
    dimensionMatch
      ? Number(dimensionMatch[2])
      : null

  const intrinsicRatio =
    width && height
      ? width / height
      : null

  return {
    declaredRatio:
      Number.isFinite(declaredRatio)
        ? declaredRatio
        : null,

    width,
    height,

    ratio:
      declaredRatio ||
      intrinsicRatio ||
      16 / 9
  }
}


/* ---------------------------------------------------------
   BUILD ONE BAND

   Same basic geometry we used for Wall.

   Every structural column finishes at the
   same vertical position.

   A column can contain 1 or 2 stacked images.
--------------------------------------------------------- */

function solveBand(
  images,
  pattern,
  containerWidth
) {
  let cursor = 0

  const columnCount =
    pattern.length

  const availableImageWidth =
    containerWidth -
    GAP * (columnCount - 1)

  if (
    availableImageWidth <= 0
  ) {
    return null
  }


  const columns =
    pattern.map(count => {
      const items =
        images.slice(
          cursor,
          cursor + count
        )

      cursor += count


      const stackWeight =
        items.reduce(
          (sum, image) => {
            return (
              sum +
              1 / image.ratio
            )
          },
          0
        )


      const verticalGapHeight =
        GAP *
        Math.max(
          0,
          items.length - 1
        )


      return {
        items,
        stackWeight,
        verticalGapHeight
      }
    })


  const denominator =
    columns.reduce(
      (sum, column) => {
        return (
          sum +
          1 / column.stackWeight
        )
      },
      0
    )


  const gapAdjustment =
    columns.reduce(
      (sum, column) => {
        return (
          sum +
          column.verticalGapHeight /
            column.stackWeight
        )
      },
      0
    )


  const bandHeight =
    (
      availableImageWidth +
      gapAdjustment
    ) /
    denominator


  const solvedColumns =
    columns.map(column => {
      const width =
        (
          bandHeight -
          column.verticalGapHeight
        ) /
        column.stackWeight

      return {
        ...column,
        width
      }
    })


  return {
    height: bandHeight,
    columns: solvedColumns
  }
}


/* ---------------------------------------------------------
   BUILD ABSOLUTE RECTANGLES

   Returns:
   [
     { x, y, width, height },
     ...
   ]

   One rectangle for each of the nine slots.
--------------------------------------------------------- */

function buildFadeLayout(
  slots,
  containerWidth
) {
  if (
    !containerWidth ||
    slots.some(slot => !slot)
  ) {
    return {
      rects: [],
      height: 0
    }
  }


  const prepared =
    slots.map(
      (image, index) => ({
        index,
        ratio:
          parseImageMeta(
            image.dimensions
          ).ratio
      })
    )


  const rects =
    Array(9).fill(null)


  let imageCursor = 0
  let currentY = 0


  FADE_PATTERN.forEach(
    (pattern, bandIndex) => {

      const requiredImages =
        pattern.reduce(
          (sum, value) =>
            sum + value,
          0
        )


      const bandImages =
        prepared.slice(
          imageCursor,
          imageCursor +
            requiredImages
        )


      const band =
        solveBand(
          bandImages,
          pattern,
          containerWidth
        )


      if (!band) {
        return
      }


      let currentX = 0


      band.columns.forEach(
        column => {

          let columnY =
            currentY


          column.items.forEach(
            image => {

              const imageHeight =
                column.width /
                image.ratio


              rects[
                image.index
              ] = {
                x:
                  currentX,

                y:
                  columnY,

                width:
                  column.width,

                height:
                  imageHeight
              }


              columnY +=
                imageHeight +
                GAP
            }
          )


          currentX +=
            column.width +
            GAP
        }
      )


      currentY +=
        band.height


      if (
        bandIndex <
        FADE_PATTERN.length - 1
      ) {
        currentY += GAP
      }


      imageCursor +=
        requiredImages
    }
  )


  return {
    rects,
    height:
      currentY
  }
}


/* ---------------------------------------------------------
   MAIN PAGE
--------------------------------------------------------- */

export default function FadeGallery() {
  const [
    slots,
    setSlots
  ] = useState(
    Array(9).fill(null)
  )

  const poolRef =
    useRef([])

  const intervalRef =
    useRef(null)

  const loadingRef =
    useRef(false)

  const isInitialLoad =
    useRef(true)

  const [
    loader,
    __loader
  ] = useState(true)

  const cursorTimerRef =
    useRef(null)


  const [
    blackMode,
    setBlackMode
  ] = useState(false)

  const [
    hideCursor,
    setHideCursor
  ] = useState(false)

  const [
    showControls,
    setShowControls
  ] = useState(false)

  const activityTimerRef =
    useRef(null)


  const [
    index,
    setIndex
  ] = useState(-1)

  const [
    slides,
    setSlides
  ] = useState([])


  const lastSlotRef =
    useRef(-1)

  const lastUpdatedRef =
    useRef(
      Array(9).fill(0)
    )

  const fadeCount =
    useRef(0)


  /*
    Container measurement
  */

  const galleryRef =
    useRef(null)

  const [
    containerWidth,
    setContainerWidth
  ] = useState(0)


  useEffect(() => {
    if (
      !galleryRef.current
    ) {
      return
    }


    const measure = () => {
      const rect =
        galleryRef.current
          .getBoundingClientRect()

      setContainerWidth(
        rect.width
      )
    }


    measure()


    const observer =
      new ResizeObserver(
        measure
      )


    observer.observe(
      galleryRef.current
    )


    return () => {
      observer.disconnect()
    }
  }, [blackMode])


  /* -------------------------------------------------------
     FETCH
  ------------------------------------------------------- */

  const fetchImages =
    async () => {

      if (
        loadingRef.current
      ) {
        return
      }


      loadingRef.current =
        true


      try {
        const res =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images`
          )


        const data =
          await res.json()


        const images =
          data.images


        if (
          images.length
        ) {
          poolRef.current.push(
            ...images
          )


          const newSlides =
            images.map(photo => {
              const src =
                photo.src ?? ''

              const meta =
                parseImageMeta(
                  photo.dimensions
                )


              const width =
                meta.width ||
                1920

              const height =
                meta.height ||
                Math.round(
                  width /
                  meta.ratio
                )


              if (
                src
                  .toLowerCase()
                  .includes('.webm')
              ) {
                return {
                  type:
                    'video',

                  width,
                  height,

                  title:
                    photo.caption,

                  description:
                    photo.dimensions,

                  director:
                    photo.director ||
                    null,

                  year:
                    photo.year,

                  sources: [
                    {
                      src,
                      type:
                        'video/webm'
                    }
                  ],

                  poster:
                    '/assets/transparent.png',

                  autoPlay: true,
                  muted: true,
                  loop: true,
                  controls: false
                }
              }


              return {
                type:
                  'image',

                src,

                width,
                height,

                title:
                  photo.caption,

                description:
                  photo.dimensions,

                director:
                  photo.director ||
                  null,

                year:
                  photo.year
              }
            })


          setSlides(
            prev => [
              ...prev,
              ...newSlides
            ]
          )


          if (
            isInitialLoad.current &&
            slots.every(
              slot =>
                slot === null
            ) &&
            poolRef.current.length >=
              9
          ) {
            const newSlots =
              poolRef.current.splice(
                0,
                9
              )

            setSlots(
              newSlots
            )

            isInitialLoad.current =
              false
          }
        }

      } catch (err) {
        console.error(
          'Failed to fetch fade images:',
          err
        )

      } finally {
        loadingRef.current =
          false

        __loader(false)
      }
    }


  /* -------------------------------------------------------
     CHOOSE NEXT SLOT
  ------------------------------------------------------- */

  const pickSlot = () => {
    fadeCount.current++


    const sortedSlots =
      lastUpdatedRef.current
        .map(
          (
            lastUpdate,
            index
          ) => ({
            index,
            lastUpdate
          })
        )
        .sort(
          (a, b) =>
            a.lastUpdate -
            b.lastUpdate
        )


    const candidates =
      sortedSlots.filter(
        s =>
          s.index !==
          lastSlotRef.current
      )


    const chosen =
      candidates[
        Math.floor(
          Math.random() *
          candidates.length
        )
      ]


    lastUpdatedRef.current[
      chosen.index
    ] =
      fadeCount.current


    lastSlotRef.current =
      chosen.index


    return chosen.index
  }


  /* -------------------------------------------------------
     CHANGE IMAGE EVERY 5 SECONDS
  ------------------------------------------------------- */

  useEffect(() => {
    fetchImages()


    intervalRef.current =
      setInterval(() => {

        setSlots(prev => {

          if (
            poolRef.current.length ===
            0
          ) {
            fetchImages()

            return prev
          }


          const nextImage =
            poolRef.current.shift()


          if (!nextImage) {
            return prev
          }


          const randomIndex =
            pickSlot()


          const newSlots =
            [...prev]


          newSlots[
            randomIndex
          ] =
            nextImage


          return newSlots
        })

      }, 5000)


    return () =>
      clearInterval(
        intervalRef.current
      )
  }, [])


  /* -------------------------------------------------------
     CALCULATE CURRENT WALL GEOMETRY
  ------------------------------------------------------- */

  const layout =
    useMemo(
      () =>
        buildFadeLayout(
          slots,
          containerWidth
        ),
      [
        slots,
        containerWidth
      ]
    )


  /* -------------------------------------------------------
     BLACK MODE
  ------------------------------------------------------- */

  const toggleBlackMode =
    async () => {

      if (!blackMode) {
        document.body.style.backgroundColor =
          '#000000'


        if (
          document.documentElement
            .requestFullscreen
        ) {
          try {
            await document
              .documentElement
              .requestFullscreen()

          } catch (err) {
            console.warn(
              'Fullscreen request failed:',
              err
            )
          }
        }

      } else {
        document.body.style.backgroundColor =
          ''


        if (
          document.exitFullscreen
        ) {
          try {
            await document
              .exitFullscreen()

          } catch (err) {
            console.warn(
              'Exiting fullscreen failed:',
              err
            )
          }
        }
      }


      setBlackMode(
        !blackMode
      )
    }


  const handleUserActivity =
    () => {

      clearTimeout(
        activityTimerRef.current
      )


      setShowControls(
        true
      )


      activityTimerRef.current =
        setTimeout(() => {
          setShowControls(false)
        }, 5000)
    }


  useEffect(() => {
    window.addEventListener(
      'mousemove',
      handleUserActivity
    )

    window.addEventListener(
      'touchstart',
      handleUserActivity
    )


    return () => {
      window.removeEventListener(
        'mousemove',
        handleUserActivity
      )

      window.removeEventListener(
        'touchstart',
        handleUserActivity
      )

      clearTimeout(
        activityTimerRef.current
      )
    }
  }, [])


  useEffect(() => {
    if (blackMode) {
      const handleMouseMove =
        () => {

          clearTimeout(
            cursorTimerRef.current
          )


          setHideCursor(
            false
          )


          cursorTimerRef.current =
            setTimeout(() => {
              setHideCursor(
                true
              )
            }, 3000)
        }


      window.addEventListener(
        'mousemove',
        handleMouseMove
      )


      return () => {
        clearTimeout(
          cursorTimerRef.current
        )

        window.removeEventListener(
          'mousemove',
          handleMouseMove
        )
      }
    }
  }, [blackMode])


  useEffect(() => {
    if (
      hideCursor &&
      blackMode
    ) {
      document.body.classList.add(
        'blackmode-hide-cursor'
      )

    } else {
      document.body.classList.remove(
        'blackmode-hide-cursor'
      )
    }
  }, [
    hideCursor,
    blackMode
  ])


  /* -------------------------------------------------------
     LIGHTBOX
  ------------------------------------------------------- */

  const handleImageClick =
    imageSrc => {

      const idx =
        slides.findIndex(
          slide =>
            slide.src ===
              imageSrc ||
            slide.sources?.[0]?.src ===
              imageSrc
        )


      if (
        idx !== -1
      ) {
        setIndex(idx)

      } else {
        console.warn(
          'Image clicked but no slide found for:',
          imageSrc
        )
      }
    }


  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <RootLayout>

      {/* MOON */}

      {!blackMode && (
        <motion.button
          onClick={
            toggleBlackMode
          }
          initial={{
            opacity: 0.2
          }}
          animate={{
            opacity: 0.2
          }}
          whileHover={{
            opacity: 1
          }}
          transition={{
            duration: 2
          }}
          className="fixed top-4 right-4 text-2xl z-[9999] cursor-pointer text-white"
          aria-label="Enter Blackmode"
        >
          <IoMoonOutline />
        </motion.button>
      )}


      {/* EXIT BLACK MODE */}

      {blackMode && (
        <motion.button
          onClick={
            toggleBlackMode
          }
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity:
              showControls
                ? 1
                : 0,

            scale:
              showControls
                ? 1
                : 0.95
          }}
          whileHover={{
            opacity: 1
          }}
          transition={{
            duration: 2,
            ease:
              'easeInOut'
          }}
          className="fixed top-4 right-4 text-2xl z-[9999] cursor-pointer text-white"
          aria-label="Exit Blackmode"
        >
          <RxCross1 />
        </motion.button>
      )}


      <div
        className={
          blackMode
            ? 'fixed inset-0 bg-black z-50 overflow-hidden'
            : 'px-4 lg:px-16 pb-10'
        }
      >

        {!blackMode && (
          <div className="w-full flex justify-center items-center py-9">

            <div className="w-full grid place-items-center space-y-6">

              <Link href="/">
                <div
                  id="logo"
                  className="w-40 h-auto cursor-pointer"
                >
                  <AnimatedLogo />
                </div>
              </Link>


              <div
                className="flex gap-8 items-center pt-[2.5px]"
                style={{
                  marginBottom:
                    '4px'
                }}
              >

                <img
                  src="/assets/crossfade.svg"
                  className="w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 align-middle mr-[3.75px]"
                  alt=""
                />


                <Link href="/scrl">
                  <RxDoubleArrowUp
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle"
                  />
                </Link>


                <Link href="/rndm">
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

          <div
            className={
              blackMode
                ? 'absolute inset-0 flex items-center justify-center'
                : 'w-full'
            }
          >

            <div
              ref={
                galleryRef
              }
              className={
                blackMode
                  ? 'relative w-full'
                  : 'relative w-full'
              }
              style={{
                /*
                  In regular mode, height follows
                  the solved mosaic.

                  In black mode we'll still center
                  this entire moving object.
                */
                height:
                  `${layout.height}px`
              }}
            >

              {slots.map(
                (
                  image,
                  idx
                ) => {

                  const rect =
                    layout.rects[
                      idx
                    ]


                  if (
                    !image ||
                    !rect
                  ) {
                    return null
                  }


                  return (
                    <motion.div
                      key={idx}
                      onClick={() =>
                        handleImageClick(
                          image?.src
                        )
                      }
                      className="absolute overflow-hidden cursor-zoom-in"
                      initial={false}
                      animate={{
                        x:
                          rect.x,

                        y:
                          rect.y,

                        width:
                          rect.width,

                        height:
                          rect.height
                      }}
                      transition={{
                        duration: 10,
                        ease:
                          [0.45, 0, 0.2, 1]
                      }}
                      style={{
                        /*
                          The tile that most recently
                          changed can naturally pass
                          above neighboring tiles while
                          geometry is in motion.

                          All slots still settle back into
                          exact 10px gutters.
                        */

                        zIndex:
                          lastSlotRef.current ===
                          idx
                            ? 3
                            : 1
                      }}
                    >

                      <FadeSlot
                        image={
                          image
                        }
                      />

                    </motion.div>
                  )
                }
              )}

            </div>

          </div>

        )}

      </div>


      {!loader &&
        !blackMode && (
          <Footer />
        )}


      {slides && (
        <Lightbox
          index={
            index
          }
          slides={
            slides
          }
          open={
            index >= 0
          }
          close={() =>
            setIndex(-1)
          }
          plugins={[
            Video
          ]}
          render={{
            slideFooter:
              ({
                slide
              }) => (
                <div className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content">

                  {slide.title && (
                    <div className="yarl__slide_title">
                      {
                        slide.title
                      }
                    </div>
                  )}


                  <div
                    className={
                      slide.director
                        ? '!mb-5'
                        : ''
                    }
                  >

                    {slide.director && (
                      <div className="yarl__slide_description !text-[#99AABB]">

                        <span className="font-medium">
                          {
                            slide.director
                          }
                        </span>

                      </div>
                    )}


                    {slide.description && (
                      <div className="yarl__slide_description">
                        {
                          slide.description
                        }
                      </div>
                    )}

                  </div>

                </div>
              )
          }}
        />
      )}


      {blackMode && (
        <AudioPlayer
          blackMode={
            blackMode
          }
          showControls={
            showControls
          }
        />
      )}

    </RootLayout>
  )
}


/* ---------------------------------------------------------
   FADE SLOT

   The slot itself changes geometry externally.

   Internally, outgoing and incoming frames simply
   crossfade over one another.

   object-cover deliberately allows tiny cropping so the
   visible frame always fills the moving tile.
--------------------------------------------------------- */

function FadeSlot({
  image
}) {
  const [
    currentImage,
    setCurrentImage
  ] = useState(image)

  const [
    previousImage,
    setPreviousImage
  ] = useState(null)


  if (
    !image ||
    !image.src
  ) {
    return (
      <div className="relative w-full h-full" />
    )
  }


  useEffect(() => {
    if (
      !image ||
      !image.src ||
      image.id ===
        currentImage?.id
    ) {
      return
    }


    if (
      (
        image?.src ?? ''
      )
        .toLowerCase()
        .includes('.webm')
    ) {
      const preload =
        document.createElement(
          'video'
        )


      preload.src =
        image.src

      preload.preload =
        'metadata'

      preload.muted =
        true

      preload.playsInline =
        true


      preload.onloadeddata =
        () => {

          if (
            currentImage &&
            image
          ) {
            setPreviousImage(
              currentImage
            )

            setCurrentImage(
              image
            )
          }
        }

    } else {
      const preload =
        new Image()


      preload.src =
        image.src


      preload.onload =
        () => {

          if (
            currentImage &&
            image
          ) {
            setPreviousImage(
              currentImage
            )

            setCurrentImage(
              image
            )
          }
        }
    }

  }, [image?.id])


  useEffect(() => {
    const observer =
      new MutationObserver(
        () => {

          document
            .querySelectorAll(
              '.yarl__button[title="Close"]'
            )
            .forEach(
              btn => {
                btn.removeAttribute(
                  'title'
                )
              }
            )
        }
      )


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    )


    return () =>
      observer.disconnect()
  }, [])


  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* OUTGOING */}

      {(
        previousImage?.src ??
        ''
      )
        .toLowerCase()
        .includes('.webm') ? (

        <motion.video
          key={
            previousImage.id
          }
          src={
            previousImage.src
          }
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/transparent.png"
          initial={{
            opacity: 1
          }}
          animate={{
            opacity: 0
          }}
          transition={{
            duration: 2,
            ease:
              'easeInOut'
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />

      ) : (

        previousImage?.src && (

          <motion.img
            key={
              previousImage.id
            }
            src={
              previousImage.src
            }
            initial={{
              opacity: 1
            }}
            animate={{
              opacity: 0
            }}
            transition={{
              duration: 2,
              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />

        )

      )}


      {/* INCOMING */}

      {(
        currentImage?.src ??
        ''
      )
        .toLowerCase()
        .includes('.webm') ? (

        <motion.video
          key={
            currentImage.id
          }
          src={
            currentImage.src
          }
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/transparent.png"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 2,
            ease:
              'easeInOut'
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />

      ) : (

        currentImage?.src && (

          <motion.img
            key={
              currentImage.id
            }
            src={
              currentImage.src
            }
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              duration: 2,
              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />

        )

      )}

    </div>
  )
}
