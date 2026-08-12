'use client'

import {
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react'

import { motion } from 'framer-motion'

import RootLayout from '../layout'
import Link from 'next/link'

import {
  RxDoubleArrowUp,
  RxCross1
} from 'react-icons/rx'

import { IoMdShuffle } from 'react-icons/io'
import { IoMoonOutline } from 'react-icons/io5'

import Loader from '../../components/loader/loader'
import Footer from '../../components/Footer'

import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

import AudioPlayer from '../../components/AudioPlayer'
import AnimatedLogo from '../../components/AnimatedLogo'


/* =========================================================
   TIMING
========================================================= */

const SLOT_CHANGE_INTERVAL = 5000
const WALL_CHANGE_INTERVAL = 60000

const SLOT_FADE_DURATION = 2
const WALL_FADE_DURATION = 5

const GAP = 10


/* =========================================================
   WEBM SPACING
========================================================= */

const WEBM_INTERVAL = 20

const MIN_IMAGES_BETWEEN_WEBMS =
  WEBM_INTERVAL - 1


function isWebm(photo) {
  return (
    photo?.src
      ?.toLowerCase()
      .includes('.webm') ??
    false
  )
}


/* =========================================================
   PRELOAD ONE MEDIA ITEM

   Critical for seamless fades.

   Nothing begins transitioning until the incoming media
   has actually loaded.
========================================================= */

function preloadMedia(photo) {
  return new Promise(resolve => {

    if (
      !photo ||
      !photo.src
    ) {
      resolve()
      return
    }


    if (
      isWebm(photo)
    ) {
      const video =
        document.createElement(
          'video'
        )

      video.preload =
        'auto'

      video.muted =
        true

      video.playsInline =
        true

      video.src =
        photo.src


      const finish =
        () => {

          video.onloadeddata =
            null

          video.onerror =
            null

          resolve()
        }


      /*
        loadeddata is preferable to metadata here because
        it means an actual frame is available to paint.
      */

      video.onloadeddata =
        finish

      video.onerror =
        finish

      video.load()

      return
    }


    const image =
      new Image()

    image.src =
      photo.src

    image.onload =
      resolve

    image.onerror =
      resolve
  })
}


/* =========================================================
   TWO PAINTS

   Allows newly mounted opacity-0 media to actually exist
   in a rendered browser frame before the transition begins.
========================================================= */

function afterTwoFrames(
  callback
) {
  let frame1
  let frame2

  frame1 =
    requestAnimationFrame(
      () => {

        frame2 =
          requestAnimationFrame(
            callback
          )
      }
    )


  return () => {

    if (frame1) {
      cancelAnimationFrame(
        frame1
      )
    }

    if (frame2) {
      cancelAnimationFrame(
        frame2
      )
    }
  }
}


/* =========================================================
   METADATA
========================================================= */

function parseImageMeta(
  dimensions
) {
  const parts =
    dimensions
      ?.split('|')
      .map(part =>
        part.trim()
      ) ?? []


  const declaredRatio =
    parseFloat(
      parts[0]
    )


  const dimensionMatch =
    parts[1]?.match(
      /(\d+)\s*[×x]\s*(\d+)/i
    )


  const width =
    dimensionMatch
      ? Number(
          dimensionMatch[1]
        )
      : null


  const height =
    dimensionMatch
      ? Number(
          dimensionMatch[2]
        )
      : null


  const intrinsicRatio =
    width &&
    height
      ? width / height
      : null


  return {
    declaredRatio:
      Number.isFinite(
        declaredRatio
      )
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


/* =========================================================
   DECLARED AR KEY

   Slot replacements must match EXACTLY.
========================================================= */

function getRatioKey(
  photo
) {
  const meta =
    parseImageMeta(
      photo?.dimensions
    )


  if (
    meta.declaredRatio !==
    null
  ) {
    return String(
      meta.declaredRatio
    )
  }


  return String(
    Number(
      meta.ratio
    ).toFixed(2)
  )
}


/* =========================================================
   OLD FADE STAGE

   Exactly the height of the old 3x3 16:9 layout
   at the current width.
========================================================= */

function getFadeStageHeight(
  width
) {
  if (!width) {
    return 0
  }


  const tileWidth =
    (
      width -
      GAP * 2
    ) /
    3


  const tileHeight =
    tileWidth /
    (16 / 9)


  return (
    tileHeight * 3 +
    GAP * 2
  )
}


/* =========================================================
   WALL CONFIGURATIONS

   Each consumes exactly nine images.
========================================================= */

const WALL_CONFIGURATIONS = [

  [
    [1, 2, 1],
    [2, 1, 2]
  ],

  [
    [2, 1, 1],
    [1, 2, 2]
  ],

  [
    [1, 1, 2],
    [2, 2, 1]
  ],

  [
    [2, 2],
    [1, 2, 2]
  ],

  [
    [1, 2, 2],
    [2, 2]
  ],

  [
    [1, 1, 1],
    [2, 2, 2]
  ],

  [
    [2, 2, 1],
    [1, 1, 2]
  ],

  [
    [2, 1, 2],
    [1, 2, 1]
  ]
]


/* =========================================================
   SOLVE ONE BAND
========================================================= */

function solveBand(
  items,
  pattern,
  containerWidth
) {
  let cursor = 0


  const columnCount =
    pattern.length


  const availableWidth =
    containerWidth -
    GAP *
      (
        columnCount -
        1
      )


  if (
    availableWidth <= 0
  ) {
    return null
  }


  const columns =
    pattern.map(
      count => {

        const columnItems =
          items.slice(
            cursor,
            cursor + count
          )


        cursor += count


        const stackWeight =
          columnItems.reduce(
            (
              total,
              item
            ) =>
              total +
              1 /
                item.frameRatio,
            0
          )


        const gapHeight =
          GAP *
          Math.max(
            0,
            columnItems.length -
              1
          )


        return {
          items:
            columnItems,

          stackWeight,

          gapHeight
        }
      }
    )


  const denominator =
    columns.reduce(
      (
        total,
        column
      ) =>
        total +
        1 /
          column.stackWeight,
      0
    )


  const gapAdjustment =
    columns.reduce(
      (
        total,
        column
      ) =>
        total +
        column.gapHeight /
          column.stackWeight,
      0
    )


  const bandHeight =
    (
      availableWidth +
      gapAdjustment
    ) /
    denominator


  const solvedColumns =
    columns.map(
      column => {

        const width =
          (
            bandHeight -
            column.gapHeight
          ) /
          column.stackWeight


        return {
          ...column,
          width
        }
      }
    )


  return {
    height:
      bandHeight,

    columns:
      solvedColumns
  }
}


/* =========================================================
   BUILD NATURAL WALL
========================================================= */

function buildWallLayout(
  wall,
  containerWidth
) {
  if (
    !wall ||
    !containerWidth ||
    wall.slots.length !== 9
  ) {
    return {
      rects: [],
      height: 0
    }
  }


  const rects =
    Array(9).fill(null)


  let slotCursor = 0
  let currentY = 0


  wall.configuration.forEach(
    (
      pattern,
      bandIndex
    ) => {

      const count =
        pattern.reduce(
          (
            total,
            value
          ) =>
            total +
            value,
          0
        )


      const bandItems =
        wall.slots
          .slice(
            slotCursor,
            slotCursor +
              count
          )
          .map(
            (
              slot,
              index
            ) => ({

              slotIndex:
                slotCursor +
                index,

              frameRatio:
                slot.frameRatio

            })
          )


      const solved =
        solveBand(
          bandItems,
          pattern,
          containerWidth
        )


      if (!solved) {
        return
      }


      let currentX = 0


      solved.columns.forEach(
        column => {

          let columnY =
            currentY


          column.items.forEach(
            item => {

              const height =
                column.width /
                item.frameRatio


              rects[
                item.slotIndex
              ] = {

                x:
                  currentX,

                y:
                  columnY,

                width:
                  column.width,

                height
              }


              columnY +=
                height +
                GAP
            }
          )


          currentX +=
            column.width +
            GAP
        }
      )


      currentY +=
        solved.height


      if (
        bandIndex <
        wall.configuration
          .length -
          1
      ) {
        currentY += GAP
      }


      slotCursor +=
        count
    }
  )


  return {
    rects,

    height:
      currentY
  }
}


/* =========================================================
   MAKE WALL
========================================================= */

function makeWall(
  images,
  configuration,
  id
) {
  return {

    id,

    configuration,

    slots:
      images.map(
        image => {

          const meta =
            parseImageMeta(
              image.dimensions
            )


          return {

            image,

            frameRatio:
              meta.ratio,

            ratioKey:
              getRatioKey(
                image
              )
          }
        }
      )
  }
}


/* =========================================================
   WALL LAYER
========================================================= */

function WallLayer({
  wall,
  containerWidth,
  stageHeight,
  onImageClick
}) {
  const layout =
    useMemo(
      () =>
        buildWallLayout(
          wall,
          containerWidth
        ),
      [
        wall,
        containerWidth
      ]
    )


  if (
    !wall ||
    !containerWidth ||
    !stageHeight
  ) {
    return null
  }


  /*
    Natural Tetris remains native-sized.

    We simply center it inside the invariant Fade stage.
  */

  const offsetY =
    (
      stageHeight -
      layout.height
    ) /
    2


  return (
    <div className="absolute inset-0 overflow-hidden">

      {wall.slots.map(
        (
          slot,
          index
        ) => {

          const rect =
            layout.rects[
              index
            ]


          if (!rect) {
            return null
          }


          return (
            <div
              key={
                index
              }
              className="absolute overflow-hidden cursor-zoom-in"
              style={{

                left:
                  `${rect.x}px`,

                top:
                  `${
                    rect.y +
                    offsetY
                  }px`,

                width:
                  `${rect.width}px`,

                height:
                  `${rect.height}px`

              }}
              onClick={() =>
                onImageClick(
                  slot.image?.src
                )
              }
            >

              <FadeSlot
                image={
                  slot.image
                }
              />

            </div>
          )
        }
      )}

    </div>
  )
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function FadeGallery() {

  /*
    IMPORTANT CHANGE:

    currentWall remains the current wall until the
    whole-wall crossfade is completely finished.

    nextWall is mounted separately underneath/above it.
  */

  const [
    currentWall,
    setCurrentWall
  ] = useState(null)


  const [
    nextWall,
    setNextWall
  ] = useState(null)


  const [
    wallFadeStarted,
    setWallFadeStarted
  ] = useState(false)


  const wallTransitioningRef =
    useRef(false)


  const poolRef =
    useRef([])


  const pendingWebmsRef =
    useRef([])


  const imagesSinceWebmRef =
    useRef(
      MIN_IMAGES_BETWEEN_WEBMS
    )


  const loadingRef =
    useRef(false)


  const [
    loader,
    __loader
  ] = useState(true)


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


  const cursorTimerRef =
    useRef(null)

  const activityTimerRef =
    useRef(null)

  const slotTimerRef =
    useRef(null)

  const wallTimerRef =
    useRef(null)

  const wallFadeTimerRef =
    useRef(null)

  const wallFrameCleanupRef =
    useRef(null)


  const lastSlotRef =
    useRef(-1)


  const lastUpdatedRef =
    useRef(
      Array(9).fill(0)
    )


  const fadeCount =
    useRef(0)


  const lastConfigurationRef =
    useRef(-1)


  /* -------------------------------------------------------
     LIGHTBOX
  ------------------------------------------------------- */

  const [
    index,
    setIndex
  ] = useState(-1)


  const [
    slides,
    setSlides
  ] = useState([])


  /* -------------------------------------------------------
     STAGE
  ------------------------------------------------------- */

  const galleryRef =
    useRef(null)


  const [
    containerWidth,
    setContainerWidth
  ] = useState(0)


  useEffect(() => {

    const element =
      galleryRef.current


    if (!element) {
      return
    }


    const measure =
      () => {

        const width =
          element
            .getBoundingClientRect()
            .width


        if (
          width > 0
        ) {

          setContainerWidth(
            width
          )
        }
      }


    measure()


    const observer =
      new ResizeObserver(
        measure
      )


    observer.observe(
      element
    )


    return () => {

      observer.disconnect()

    }

  }, [
    loader,
    blackMode
  ])


  const stageHeight =
    useMemo(
      () =>
        getFadeStageHeight(
          containerWidth
        ),
      [
        containerWidth
      ]
    )


  /* =======================================================
     FETCH
  ======================================================= */

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

        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images`
          )


        const data =
          await response.json()


        const images =
          data.images ||
          []


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
                  photo.src ??
                  ''


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
                  isWebm(
                    photo
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
            previous => [
              ...previous,
              ...newSlides
            ]
          )
        }

      } catch (err) {

        console.error(
          'Failed to fetch fade images:',
          err
        )

      } finally {

        loadingRef.current =
          false

      }
    }


  /* =======================================================
     WEBM-SPACED STREAM
  ======================================================= */

  const pullNextImage =
    () => {

      if (
        pendingWebmsRef
          .current
          .length >
          0 &&
        imagesSinceWebmRef
          .current >=
          MIN_IMAGES_BETWEEN_WEBMS
      ) {

        const webm =
          pendingWebmsRef
            .current
            .shift()


        imagesSinceWebmRef
          .current = 0


        return webm
      }


      while (
        poolRef.current
          .length >
        0
      ) {

        const image =
          poolRef.current
            .shift()


        if (
          isWebm(
            image
          )
        ) {

          if (
            pendingWebmsRef
              .current
              .length ===
              0 &&
            imagesSinceWebmRef
              .current >=
              MIN_IMAGES_BETWEEN_WEBMS
          ) {

            imagesSinceWebmRef
              .current = 0


            return image
          }


          pendingWebmsRef
            .current
            .push(
              image
            )


          continue
        }


        imagesSinceWebmRef
          .current =
            Math.min(

              MIN_IMAGES_BETWEEN_WEBMS,

              imagesSinceWebmRef
                .current +
                1
            )


        return image
      }


      return null
    }


  /* =======================================================
     AR-LOCKED REPLACEMENT
  ======================================================= */

  const pullMatchingImage =
    async ratioKey => {

      for (
        let attempt = 0;
        attempt < 6;
        attempt++
      ) {

        for (
          let i = 0;
          i <
          poolRef.current.length;
          i++
        ) {

          const candidate =
            poolRef.current[
              i
            ]


          if (
            getRatioKey(
              candidate
            ) !==
            ratioKey
          ) {
            continue
          }


          if (
            isWebm(
              candidate
            )
          ) {

            if (
              imagesSinceWebmRef
                .current <
              MIN_IMAGES_BETWEEN_WEBMS
            ) {
              continue
            }


            poolRef.current.splice(
              i,
              1
            )


            imagesSinceWebmRef
              .current = 0


            return candidate
          }


          poolRef.current.splice(
            i,
            1
          )


          imagesSinceWebmRef
            .current =
            Math.min(

              MIN_IMAGES_BETWEEN_WEBMS,

              imagesSinceWebmRef
                .current +
                1
            )


          return candidate
        }


        await fetchImages()
      }


      return null
    }


  /* =======================================================
     GET N IMAGES FOR NEW WALL
  ======================================================= */

  const getImagesForWall =
    async count => {

      const result = []

      let attempts = 0


      while (
        result.length <
          count &&
        attempts <
          30
      ) {

        let image =
          pullNextImage()


        if (!image) {

          await fetchImages()

          image =
            pullNextImage()
        }


        if (image) {

          result.push(
            image
          )
        }


        attempts++
      }


      return result
    }


  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const chooseConfiguration =
    () => {

      const candidates =
        WALL_CONFIGURATIONS
          .map(
            (
              config,
              index
            ) => ({

              config,

              index

            })
          )
          .filter(
            item =>
              item.index !==
              lastConfigurationRef
                .current
          )


      const chosen =
        candidates[
          Math.floor(
            Math.random() *
            candidates.length
          )
        ]


      lastConfigurationRef
        .current =
        chosen.index


      return chosen.config
    }


  /* =======================================================
     CREATE NEW WALL

     All nine pieces preload before the wall is returned.
  ======================================================= */

  const createNewWall =
    async () => {

      const images =
        await getImagesForWall(
          9
        )


      if (
        images.length <
        9
      ) {
        return null
      }


      /*
        Critical for grid-to-grid transition:
        preload every visible source before mounting nextWall.
      */

      await Promise.all(
        images.map(
          preloadMedia
        )
      )


      return makeWall(

        images,

        chooseConfiguration(),

        Date.now() +
        Math.random()
      )
    }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {

    let cancelled =
      false


    const initialize =
      async () => {

        __loader(
          true
        )


        await fetchImages()


        const wall =
          await createNewWall()


        if (
          !cancelled &&
          wall
        ) {

          setCurrentWall(
            wall
          )


          __loader(
            false
          )
        }
      }


    initialize()


    return () => {

      cancelled =
        true

    }

  }, [])


  /* =======================================================
     PICK SLOT
  ======================================================= */

  const pickSlot =
    () => {

      fadeCount.current++


      const sorted =
        lastUpdatedRef
          .current
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
            (
              a,
              b
            ) =>
              a.lastUpdate -
              b.lastUpdate
          )


      const candidates =
        sorted.filter(
          item =>
            item.index !==
            lastSlotRef.current
        )


      const chosen =
        candidates[
          Math.floor(
            Math.random() *
            candidates.length
          )
        ]


      lastUpdatedRef
        .current[
          chosen.index
        ] =
        fadeCount.current


      lastSlotRef.current =
        chosen.index


      return chosen.index
    }


  /* =======================================================
     INDIVIDUAL SLOT CHANGE

     No slot changes during a whole-wall transition.
  ======================================================= */

  useEffect(() => {

    if (
      !currentWall
    ) {
      return
    }


    slotTimerRef.current =
      setInterval(
        async () => {

          if (
            wallTransitioningRef
              .current
          ) {
            return
          }


          const slotIndex =
            pickSlot()


          const currentSlot =
            currentWall.slots[
              slotIndex
            ]


          if (
            !currentSlot
          ) {
            return
          }


          const replacement =
            await pullMatchingImage(
              currentSlot.ratioKey
            )


          if (
            !replacement
          ) {
            return
          }


          /*
            FadeSlot will perform its own preload before
            visually transitioning.
          */

          setCurrentWall(
            previous => {

              if (!previous) {
                return previous
              }


              const slots =
                previous.slots.map(
                  (
                    slot,
                    index
                  ) => {

                    if (
                      index !==
                      slotIndex
                    ) {
                      return slot
                    }


                    return {

                      ...slot,

                      image:
                        replacement
                    }
                  }
                )


              return {

                ...previous,

                slots

              }
            }
          )

        },
        SLOT_CHANGE_INTERVAL
      )


    return () => {

      clearInterval(
        slotTimerRef.current
      )

    }

  }, [
    currentWall?.id
  ])


  /* =======================================================
     WALL CHANGE

     currentWall stays untouched.

     nextWall:
       1. is completely generated
       2. all 9 media preload
       3. mounts at opacity 0
       4. waits two paints
       5. crossfade begins
       6. ONLY AFTER fade finishes does next become current
  ======================================================= */

  useEffect(() => {

    if (
      !currentWall
    ) {
      return
    }


    wallTimerRef.current =
      setInterval(
        async () => {

          if (
            wallTransitioningRef
              .current
          ) {
            return
          }


          wallTransitioningRef
            .current =
            true


          const preparedWall =
            await createNewWall()


          if (
            !preparedWall
          ) {

            wallTransitioningRef
              .current =
              false

            return
          }


          /*
            Mount invisible wall.
          */

          setWallFadeStarted(
            false
          )


          setNextWall(
            preparedWall
          )

        },
        WALL_CHANGE_INTERVAL
      )


    return () => {

      clearInterval(
        wallTimerRef.current
      )

    }

  }, [
    currentWall?.id
  ])


  /* =======================================================
     NEXT WALL HAS MOUNTED

     Wait two browser paints, THEN start crossfade.
  ======================================================= */

  useEffect(() => {

    if (
      !nextWall
    ) {
      return
    }


    wallFrameCleanupRef
      .current =
      afterTwoFrames(
        () => {

          setWallFadeStarted(
            true
          )


          wallFadeTimerRef
            .current =
            setTimeout(
              () => {

                /*
                  New wall becomes canonical only after
                  crossfade is fully finished.
                */

                setCurrentWall(
                  nextWall
                )


                setNextWall(
                  null
                )


                setWallFadeStarted(
                  false
                )


                wallTransitioningRef
                  .current =
                  false

              },
              WALL_FADE_DURATION *
                1000 +
                100
            )
        }
      )


    return () => {

      wallFrameCleanupRef
        .current?.()


      clearTimeout(
        wallFadeTimerRef
          .current
      )

    }

  }, [
    nextWall
  ])


  /* =======================================================
     BLACK MODE
  ======================================================= */

  const toggleBlackMode =
    async () => {

      if (
        !blackMode
      ) {

        document.body
          .style
          .backgroundColor =
          '#000000'


        if (
          document
            .documentElement
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

        document.body
          .style
          .backgroundColor =
          ''


        if (
          document
            .exitFullscreen
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
        activityTimerRef
          .current
      )


      setShowControls(
        true
      )


      activityTimerRef
        .current =
        setTimeout(
          () => {

            setShowControls(
              false
            )

          },
          5000
        )
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
        activityTimerRef
          .current
      )
    }

  }, [])


  useEffect(() => {

    if (
      !blackMode
    ) {
      return
    }


    const handleMouseMove =
      () => {

        clearTimeout(
          cursorTimerRef
            .current
        )


        setHideCursor(
          false
        )


        cursorTimerRef
          .current =
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
        cursorTimerRef
          .current
      )


      window.removeEventListener(
        'mousemove',
        handleMouseMove
      )
    }

  }, [
    blackMode
  ])


  useEffect(() => {

    if (
      hideCursor &&
      blackMode
    ) {

      document.body
        .classList
        .add(
          'blackmode-hide-cursor'
        )

    } else {

      document.body
        .classList
        .remove(
          'blackmode-hide-cursor'
        )
    }

  }, [
    hideCursor,
    blackMode
  ])


  /* =======================================================
     LIGHTBOX
  ======================================================= */

  const handleImageClick =
    imageSrc => {

      const idx =
        slides.findIndex(
          slide =>
            slide.src ===
              imageSrc ||
            slide
              .sources?.[0]
              ?.src ===
              imageSrc
        )


      if (
        idx !== -1
      ) {

        setIndex(
          idx
        )
      }
    }


  useEffect(() => {

    if (
      !slides.length
    ) {
      return
    }


    const observer =
      new MutationObserver(
        () => {

          document
            .querySelectorAll(
              '.yarl__button[title="Close"]'
            )
            .forEach(
              button => {

                button
                  .removeAttribute(
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


    return () => {

      observer.disconnect()

    }

  }, [
    slides
  ])


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <RootLayout>

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

            {/* Invariant old-Fade-sized stage */}

            <div
              ref={
                galleryRef
              }
              className="relative w-full overflow-hidden"
              style={{
                /*
                  Reserve essentially the correct footprint
                  immediately, before ResizeObserver fires.
                  Once measured, exact old-Fade height wins.
                */

                aspectRatio:
                  containerWidth
                    ? undefined
                    : '16 / 9',

                height:
                  containerWidth
                    ? `${stageHeight}px`
                    : undefined
              }}
            >

              {/* CURRENT WALL — never replaced early */}

              {currentWall && (

                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  initial={false}
                  animate={{
                    opacity:
                      wallFadeStarted
                        ? 0
                        : 1
                  }}
                  transition={{
                    duration:
                      WALL_FADE_DURATION,

                    ease:
                      'easeInOut'
                  }}
                >

                  <WallLayer
                    wall={
                      currentWall
                    }
                    containerWidth={
                      containerWidth
                    }
                    stageHeight={
                      stageHeight
                    }
                    onImageClick={
                      handleImageClick
                    }
                  />

                </motion.div>

              )}


              {/* NEXT WALL — mounts invisibly first */}

              {nextWall && (

                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  initial={{
                    opacity:
                      0
                  }}
                  animate={{
                    opacity:
                      wallFadeStarted
                        ? 1
                        : 0
                  }}
                  transition={{
                    duration:
                      WALL_FADE_DURATION,

                    ease:
                      'easeInOut'
                  }}
                >

                  <WallLayer
                    wall={
                      nextWall
                    }
                    containerWidth={
                      containerWidth
                    }
                    stageHeight={
                      stageHeight
                    }
                    onImageClick={
                      handleImageClick
                    }
                  />

                </motion.div>

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


/* =========================================================
   FADE SLOT

   EXPLICIT DOUBLE BUFFER

   currentImage never disappears until incomingImage:
   - has loaded
   - has mounted
   - has painted twice
   - has completed its opacity transition
========================================================= */

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
    incomingImage,
    setIncomingImage
  ] = useState(
    null
  )


  const [
    fadeStarted,
    setFadeStarted
  ] = useState(false)


  const fadeTimerRef =
    useRef(null)


  const frameCleanupRef =
    useRef(null)


  useEffect(() => {

    if (
      !image ||
      !image.src
    ) {
      return
    }


    if (
      image.id ===
      currentImage?.id
    ) {
      return
    }


    let cancelled =
      false


    const prepare =
      async () => {

        /*
          Incoming source is completely loaded BEFORE
          we even put it into the rendered slot.
        */

        await preloadMedia(
          image
        )


        if (
          cancelled
        ) {
          return
        }


        /*
          Mount at opacity 0.
        */

        setFadeStarted(
          false
        )


        setIncomingImage(
          image
        )
      }


    prepare()


    return () => {

      cancelled =
        true

    }

  }, [
    image?.id
  ])


  /*
    incomingImage now exists in React DOM.

    Give browser two real paint frames before changing
    either opacity.
  */

  useEffect(() => {

    if (
      !incomingImage
    ) {
      return
    }


    frameCleanupRef
      .current =
      afterTwoFrames(
        () => {

          setFadeStarted(
            true
          )


          fadeTimerRef
            .current =
            setTimeout(
              () => {

                /*
                  ONLY NOW do we discard outgoing media.
                */

                setCurrentImage(
                  incomingImage
                )


                setIncomingImage(
                  null
                )


                setFadeStarted(
                  false
                )

              },
              SLOT_FADE_DURATION *
                1000 +
                100
            )
        }
      )


    return () => {

      frameCleanupRef
        .current?.()


      clearTimeout(
        fadeTimerRef
          .current
      )

    }

  }, [
    incomingImage
  ])


  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* CURRENT / OUTGOING LAYER */}

      {currentImage && (

        isWebm(
          currentImage
        ) ? (

          <motion.video
            key={
              `current-video-${currentImage.id}`
            }
            src={
              currentImage.src
            }
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/assets/transparent.png"
            initial={false}
            animate={{
              opacity:
                fadeStarted
                  ? 0
                  : 1
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />

        ) : (

          <motion.img
            key={
              `current-image-${currentImage.id}`
            }
            src={
              currentImage.src
            }
            initial={false}
            animate={{
              opacity:
                fadeStarted
                  ? 0
                  : 1
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />

        )

      )}


      {/* INCOMING LAYER */}

      {incomingImage && (

        isWebm(
          incomingImage
        ) ? (

          <motion.video
            key={
              `incoming-video-${incomingImage.id}`
            }
            src={
              incomingImage.src
            }
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/assets/transparent.png"
            initial={{
              opacity:
                0
            }}
            animate={{
              opacity:
                fadeStarted
                  ? 1
                  : 0
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />

        ) : (

          <motion.img
            key={
              `incoming-image-${incomingImage.id}`
            }
            src={
              incomingImage.src
            }
            initial={{
              opacity:
                0
            }}
            animate={{
              opacity:
                fadeStarted
                  ? 1
                  : 0
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

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
