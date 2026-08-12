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
  Nine slots total.

  Band 1:
  [1, 2, 1] = 4 images

  Band 2:
  [2, 1, 2] = 5 images
*/

const FADE_PATTERN = [
  [1, 2, 1],
  [2, 1, 2]
]


/* ---------------------------------------------------------
   METADATA
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
   SOLVE ONE BAND
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
          (sum, image) =>
            sum +
            1 / image.ratio,
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
      (sum, column) =>
        sum +
        1 / column.stackWeight,
      0
    )


  const gapAdjustment =
    columns.reduce(
      (sum, column) =>
        sum +
        column.verticalGapHeight /
          column.stackWeight,
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
   BUILD NATURAL LAYOUT

   This is the layout the nine current ARs would naturally
   create if allowed to choose their own total height.
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
      width: 0,
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

    width:
      containerWidth,

    height:
      currentY
  }
}


/* ---------------------------------------------------------
   FIT NATURAL LAYOUT INTO STABLE STAGE

   Crucial difference from the previous version:

   The stage DOES NOT change shape when the images change.

   If the natural mosaic is taller than the stage,
   it scales down uniformly.

   If it is shorter, it remains full width and is
   vertically centered.

   No AR distortion.
--------------------------------------------------------- */

function fitLayoutToStage(
  layout,
  stageWidth,
  stageHeight
) {
  if (
    !layout.width ||
    !layout.height ||
    !stageWidth ||
    !stageHeight
  ) {
    return {
      rects: [],
      width: stageWidth,
      height: stageHeight
    }
  }


  const widthScale =
    stageWidth /
    layout.width

  const heightScale =
    stageHeight /
    layout.height


  /*
    Natural layout is already solved to the full stage width.

    Never scale above 1 here, because doing so would overflow
    horizontally.

    We only shrink when necessary to fit the fixed stage.
  */

  const scale =
    Math.min(
      1,
      widthScale,
      heightScale
    )


  const fittedWidth =
    layout.width *
    scale

  const fittedHeight =
    layout.height *
    scale


  const offsetX =
    (
      stageWidth -
      fittedWidth
    ) /
    2

  const offsetY =
    (
      stageHeight -
      fittedHeight
    ) /
    2


  const rects =
    layout.rects.map(
      rect => {

        if (!rect) {
          return null
        }

        return {
          x:
            offsetX +
            rect.x *
              scale,

          y:
            offsetY +
            rect.y *
              scale,

          width:
            rect.width *
            scale,

          height:
            rect.height *
            scale
        }
      }
    )


  return {
    rects,
    width:
      stageWidth,
    height:
      stageHeight
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


  /* -------------------------------------------------------
     RESPONSIVE STAGE
  ------------------------------------------------------- */

  const galleryRef =
    useRef(null)


  const [
    containerWidth,
    setContainerWidth
  ] = useState(0)


  /*
    This is the important persistent value.

    Example:

    first layout =
      1500 × 930

    stageAspectRatio =
      1500 / 930

    On a 3000px-wide display the same stage becomes:

      3000 × 1860
  */

  const [
    stageAspectRatio,
    setStageAspectRatio
  ] = useState(null)


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


      if (
        rect.width > 0
      ) {
        setContainerWidth(
          rect.width
        )
      }
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

  }, [
    blackMode,
    loader,
    stageAspectRatio
  ])


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
            images.map(
              photo => {

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
                    .includes(
                      '.webm'
                    )
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

                    autoPlay:
                      true,

                    muted:
                      true,

                    loop:
                      true,

                    controls:
                      false
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
              }
            )


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
     SLOT SELECTION
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
     CHANGE ONE IMAGE EVERY 5 SECONDS
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
     NATURAL CURRENT LAYOUT
  ------------------------------------------------------- */

  const naturalLayout =
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
     FREEZE STAGE SHAPE FROM FIRST VALID LAYOUT

     This happens ONCE.

     After this point incoming ARs cannot change
     the outer stage aspect ratio.
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      stageAspectRatio ||
      !containerWidth ||
      !naturalLayout.height ||
      naturalLayout.height <= 0
    ) {
      return
    }


    setStageAspectRatio(
      containerWidth /
      naturalLayout.height
    )

  }, [
    stageAspectRatio,
    containerWidth,
    naturalLayout.height
  ])


  /* -------------------------------------------------------
     STAGE HEIGHT

     Responsive, but fixed in proportion.
  ------------------------------------------------------- */

  const stageHeight =
    stageAspectRatio &&
    containerWidth
      ? containerWidth /
        stageAspectRatio
      : naturalLayout.height


  /* -------------------------------------------------------
     FIT CURRENT GEOMETRY INTO FIXED STAGE
  ------------------------------------------------------- */

  const layout =
    useMemo(
      () =>
        fitLayoutToStage(
          naturalLayout,
          containerWidth,
          stageHeight
        ),
      [
        naturalLayout,
        containerWidth,
        stageHeight
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
            setTimeout(
              () => {
                setHideCursor(
                  true
                )
              },
              3000
            )
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
  }, [
    blackMode
  ])


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
        setIndex(
          idx
        )

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
            opacity:
              0.2
          }}
          animate={{
            opacity:
              0.2
          }}
          whileHover={{
            opacity:
              1
          }}
          transition={{
            duration:
              2
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
            opacity:
              0,

            scale:
              0.95
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
            opacity:
              1
          }}
          transition={{
            duration:
              2,

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
            ? 'fixed inset-0 bg-black z-50 overflow-hidden flex items-center justify-center'
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
                ? 'w-full h-full flex items-center justify-center'
                : 'w-full'
            }
          >

            <div
              ref={
                galleryRef
              }
              className="relative"
              style={{
                /*
                  NORMAL:
                    full available width

                  BLACK MODE:
                    fit the fixed-ratio stage entirely
                    inside the viewport.

                  Example:
                    if stage AR = 1.6,
                    width can never exceed
                    100vh × 1.6.
                */

                width:
                  blackMode &&
                  stageAspectRatio
                    ? `min(100vw, calc(100vh * ${stageAspectRatio}))`
                    : '100%',

                height:
                  stageAspectRatio &&
                  containerWidth
                    ? `${stageHeight}px`
                    : `${naturalLayout.height}px`
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
                      key={
                        idx
                      }
                      onClick={() =>
                        handleImageClick(
                          image?.src
                        )
                      }
                      className="absolute overflow-hidden cursor-zoom-in"
                      initial={
                        false
                      }
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
                        duration:
                          10,

                        ease:
                          [
                            0.45,
                            0,
                            0.2,
                            1
                          ]
                      }}
                      style={{
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
            setIndex(
              -1
            )
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
--------------------------------------------------------- */

function FadeSlot({
  image
}) {
  const [
    currentImage,
    setCurrentImage
  ] = useState(
    image
  )

  const [
    previousImage,
    setPreviousImage
  ] = useState(
    null
  )


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
        image?.src ??
        ''
      )
        .toLowerCase()
        .includes(
          '.webm'
        )
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

  }, [
    image?.id
  ])


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
        childList:
          true,

        subtree:
          true
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
        .includes(
          '.webm'
        ) ? (

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
            opacity:
              1
          }}
          animate={{
            opacity:
              0
          }}
          transition={{
            duration:
              2,

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
              opacity:
                1
            }}
            animate={{
              opacity:
                0
            }}
            transition={{
              duration:
                2,

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
        .includes(
          '.webm'
        ) ? (

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
            opacity:
              0
          }}
          animate={{
            opacity:
              1
          }}
          transition={{
            duration:
              2,

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
              opacity:
                0
            }}
            animate={{
              opacity:
                1
            }}
            transition={{
              duration:
                2,

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
