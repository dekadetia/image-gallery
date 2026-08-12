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
   TWO BROWSER PAINTS

   Used after a hidden buffer has mounted and before
   opacity begins changing.
========================================================= */

function afterTwoFrames(callback) {
  let frame1
  let frame2

  frame1 =
    requestAnimationFrame(() => {

      frame2 =
        requestAnimationFrame(
          callback
        )
    })


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
   MEDIA PRELOAD

   This is only preparation.

   The actual rendered A/B layer then gets two additional
   paint frames before a fade begins.
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
        We wait for an actual decoded frame,
        not merely metadata.
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

    image.onload =
      resolve

    image.onerror =
      resolve

    image.src =
      photo.src
  })
}


/* =========================================================
   METADATA
========================================================= */

function parseImageMeta(dimensions) {
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
   EXACT DECLARED AR CATEGORY

   Slot swaps must use the same category.

   1.33 stays 1.33
   1.85 stays 1.85
   2.39 stays 2.39
   etc.
========================================================= */

function getRatioKey(photo) {
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
   WALL CONFIGURATIONS

   Every configuration contains exactly nine images.

   Every configuration currently has TWO bands.

   Band 1 will always be pinned to the top of the stage.
   Band 2 will always be pinned to the bottom.

   Therefore arbitrary ARs can NEVER change the outer
   stage dimensions.

   If the two bands require too much height, they overlap.

   If they require less height, they separate.

   That variation happens INSIDE the stage only.
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

   Same Wall principle:

   - full available width
   - native slot ARs
   - uniform 10px gutters
   - all columns within a band share a bottom edge
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


  if (
    solvedColumns.some(
      column =>
        !Number.isFinite(
          column.width
        ) ||
        column.width <= 0
    )
  ) {
    return null
  }


  return {

    height:
      bandHeight,

    columns:
      solvedColumns
  }
}


/* =========================================================
   FIXED-STAGE WALL SOLVER

   THIS IS DIFFERENT FROM THE PREVIOUS FADE2.

   We do NOT:

   - calculate one natural total wall height
   - center it
   - clip it
   - scale it

   Instead each band is solved independently at the full
   stage width.

   With two bands:

   BAND 1 y = 0
   BAND 2 y = stageHeight - bandHeight

   Thus every configuration occupies exactly the same
   outer stage.

   Any geometric incompatibility becomes internal overlap.
========================================================= */

function buildFixedStageLayout(
  wall,
  stageWidth,
  stageHeight
) {
  if (
    !wall ||
    !stageWidth ||
    !stageHeight ||
    wall.slots.length !== 9
  ) {

    return {
      rects: []
    }
  }


  const rects =
    Array(9).fill(null)


  let slotCursor = 0


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
              localIndex
            ) => ({

              slotIndex:
                slotCursor +
                localIndex,

              frameRatio:
                slot.frameRatio
            })
          )


      const solved =
        solveBand(
          bandItems,
          pattern,
          stageWidth
        )


      if (!solved) {

        slotCursor +=
          count

        return
      }


      /*
        First band pins to TOP.

        Last band pins to BOTTOM.

        There are currently always exactly two bands,
        but interpolation makes this safe if we ever
        experiment with three.
      */

      let bandY = 0


      if (
        wall.configuration
          .length > 1
      ) {

        const progress =
          bandIndex /
          (
            wall.configuration
              .length -
            1
          )


        bandY =
          progress *
          (
            stageHeight -
            solved.height
          )
      }


      let currentX = 0


      solved.columns.forEach(
        column => {

          let columnY =
            bandY


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


      slotCursor +=
        count
    }
  )


  return {
    rects
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
   MEDIA ELEMENT

   Used by persistent slot buffers.
========================================================= */

function MediaLayer({
  photo,
  opacity,
  duration
}) {
  if (
    !photo ||
    !photo.src
  ) {
    return null
  }


  if (
    isWebm(photo)
  ) {

    return (
      <motion.video
        src={
          photo.src
        }
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/assets/transparent.png"
        initial={false}
        animate={{
          opacity
        }}
        transition={{
          duration,

          ease:
            'easeInOut'
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
    )
  }


  return (
    <motion.img
      src={
        photo.src
      }
      initial={false}
      animate={{
        opacity
      }}
      transition={{
        duration,

        ease:
          'easeInOut'
      }}
      className="absolute inset-0 w-full h-full object-cover"
      alt=""
    />
  )
}


/* =========================================================
   PERSISTENT A/B SLOT

   This fixes the post-fade flicker.

   Layer A and Layer B remain mounted.

   Example:

   A visible
   B hidden

   new image:
     preload
     replace hidden B
     let B paint twice
     crossfade A -> B
     B remains visible
     A remains mounted but hidden

   Next change reverses direction.

   NO visible layer is remounted when the fade ends.
========================================================= */

function PersistentFadeSlot({
  image
}) {
  const [
    layerA,
    setLayerA
  ] = useState(
    image
  )


  const [
    layerB,
    setLayerB
  ] = useState(null)


  const [
    activeLayer,
    setActiveLayer
  ] = useState('A')


  const [
    fadeTarget,
    setFadeTarget
  ] = useState(null)


  const transitionRef =
    useRef(false)


  const fadeTimerRef =
    useRef(null)


  const frameCleanupRef =
    useRef(null)


  const pendingImageRef =
    useRef(null)


  /*
    Receive replacement from parent.
  */

  useEffect(() => {

    if (
      !image ||
      !image.src
    ) {
      return
    }


    const current =
      activeLayer === 'A'
        ? layerA
        : layerB


    if (
      image.id ===
      current?.id
    ) {
      return
    }


    /*
      If a fade is already running, remember the latest
      requested replacement and deal with it afterward.
    */

    if (
      transitionRef.current
    ) {

      pendingImageRef.current =
        image

      return
    }


    let cancelled =
      false


    const prepare =
      async photo => {

        transitionRef.current =
          true


        await preloadMedia(
          photo
        )


        if (
          cancelled
        ) {

          transitionRef.current =
            false

          return
        }


        const inactive =
          activeLayer === 'A'
            ? 'B'
            : 'A'


        /*
          Replace ONLY the hidden buffer.
        */

        if (
          inactive === 'A'
        ) {

          setLayerA(
            photo
          )

        } else {

          setLayerB(
            photo
          )
        }


        /*
          After React mounts the new hidden source,
          let the browser actually paint it before
          touching opacity.
        */

        frameCleanupRef.current =
          afterTwoFrames(
            () => {

              setFadeTarget(
                inactive
              )


              fadeTimerRef.current =
                setTimeout(
                  () => {

                    /*
                      Do NOT clear either layer.

                      Simply declare the newly visible
                      buffer active.

                      It stays mounted continuously.
                    */

                    setActiveLayer(
                      inactive
                    )


                    setFadeTarget(
                      null
                    )


                    transitionRef.current =
                      false


                    /*
                      If another replacement arrived while
                      fading, parent state will eventually
                      trigger another prop change. Keeping
                      this reference prevents us from
                      accidentally losing awareness of it.
                    */

                    pendingImageRef.current =
                      null

                  },
                  SLOT_FADE_DURATION *
                    1000 +
                    100
                )
            }
          )
      }


    prepare(
      image
    )


    return () => {

      cancelled =
        true

    }

  }, [
    image?.id
  ])


  useEffect(() => {

    return () => {

      frameCleanupRef
        .current?.()


      clearTimeout(
        fadeTimerRef.current
      )
    }

  }, [])


  /*
    Opacity logic.

    During fade:
      old active -> 0
      target     -> 1

    Otherwise:
      active -> 1
      hidden -> 0
  */

  const opacityA =
    fadeTarget
      ? (
          fadeTarget === 'A'
            ? 1
            : 0
        )
      : (
          activeLayer === 'A'
            ? 1
            : 0
        )


  const opacityB =
    fadeTarget
      ? (
          fadeTarget === 'B'
            ? 1
            : 0
        )
      : (
          activeLayer === 'B'
            ? 1
            : 0
        )


  return (
    <div className="relative w-full h-full overflow-hidden">

      <MediaLayer
        photo={
          layerA
        }
        opacity={
          opacityA
        }
        duration={
          fadeTarget
            ? SLOT_FADE_DURATION
            : 0
        }
      />


      <MediaLayer
        photo={
          layerB
        }
        opacity={
          opacityB
        }
        duration={
          fadeTarget
            ? SLOT_FADE_DURATION
            : 0
        }
      />

    </div>
  )
}


/* =========================================================
   WALL BUFFER

   Each buffer has its own full nine-slot Wall.

   The whole buffer itself does NOT resize.
========================================================= */

function WallBuffer({
  wall,
  stageWidth,
  stageHeight,
  opacity,
  fadeDuration,
  onImageClick
}) {
  const layout =
    useMemo(
      () =>
        buildFixedStageLayout(
          wall,
          stageWidth,
          stageHeight
        ),
      [
        wall,
        stageWidth,
        stageHeight
      ]
    )


  if (
    !wall
  ) {
    return null
  }


  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={false}
      animate={{
        opacity
      }}
      transition={{
        duration:
          fadeDuration,

        ease:
          'easeInOut'
      }}
    >

      {wall.slots.map(
        (
          slot,
          index
        ) => {

          const rect =
            layout.rects[
              index
            ]


          if (
            !rect
          ) {
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
                  `${rect.y}px`,

                width:
                  `${rect.width}px`,

                height:
                  `${rect.height}px`,

                /*
                  Later bands sit above earlier bands
                  if internal overlap occurs.
                */

                zIndex:
                  index
              }}
              onClick={() =>
                onImageClick(
                  slot.image?.src
                )
              }
            >

              <PersistentFadeSlot
                image={
                  slot.image
                }
              />

            </div>
          )
        }
      )}

    </motion.div>
  )
}


/* =========================================================
   MAIN
========================================================= */

export default function FadeGallery() {

  /* -------------------------------------------------------
     PERSISTENT WALL BUFFERS

     Both stay mounted.

     wallA / wallB hold their own complete configurations.

     frontBuffer says which is canonical after a fade.

     fadeTarget is non-null only during a wall crossfade.
  ------------------------------------------------------- */

  const [
    wallA,
    setWallA
  ] = useState(null)


  const [
    wallB,
    setWallB
  ] = useState(null)


  const [
    frontBuffer,
    setFrontBuffer
  ] = useState('A')


  const [
    wallFadeTarget,
    setWallFadeTarget
  ] = useState(null)


  const wallTransitioningRef =
    useRef(false)


  const wallFadeTimerRef =
    useRef(null)


  const wallFrameCleanupRef =
    useRef(null)


  /* -------------------------------------------------------
     IMAGE POOL
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     BLACK MODE
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     TIMERS
  ------------------------------------------------------- */

  const slotTimerRef =
    useRef(null)


  const wallTimerRef =
    useRef(null)


  /* -------------------------------------------------------
     SLOT CHOICE
  ------------------------------------------------------- */

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
     STAGE SIZE

     stageRef includes a real invisible 3×3 old-Fade grid.

     That hidden grid is in normal document flow, so the
     browser knows the correct stage height IMMEDIATELY.

     There is no zero-height first frame and therefore
     no Footer slide.
  ------------------------------------------------------- */

  const stageRef =
    useRef(null)


  const [
    stageSize,
    setStageSize
  ] = useState({
    width: 0,
    height: 0
  })


  useEffect(() => {

    const element =
      stageRef.current


    if (!element) {
      return
    }


    const measure =
      () => {

        const rect =
          element
            .getBoundingClientRect()


        if (
          rect.width > 0 &&
          rect.height > 0
        ) {

          setStageSize({

            width:
              rect.width,

            height:
              rect.height
          })
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

      } catch (error) {

        console.error(
          'Failed to fetch fade images:',
          error
        )

      } finally {

        loadingRef.current =
          false
      }
    }


  /* =======================================================
     1-IN-20 STREAM
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
     EXACT-AR SLOT REPLACEMENT
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
            poolRef.current[i]


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
     GET N IMAGES
  ======================================================= */

  const getImagesForWall =
    async count => {

      const result = []

      let attempts = 0


      while (
        result.length <
          count &&
        attempts <
          40
      ) {

        let image =
          pullNextImage()


        if (
          !image
        ) {

          await fetchImages()


          image =
            pullNextImage()
        }


        if (
          image
        ) {

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
     BUILD NEW WALL

     All nine sources preload BEFORE the hidden wall
     buffer is populated.
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
     INITIAL WALL
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

          setWallA(
            wall
          )


          setFrontBuffer(
            'A'
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
     CURRENT VISIBLE WALL
  ======================================================= */

  const currentWall =
    frontBuffer === 'A'
      ? wallA
      : wallB


  /* =======================================================
     SLOT PICK
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

     Only the CURRENTLY VISIBLE wall receives these changes.

     Exact AR match required.

     No slot changes while an entire wall is crossfading.
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


          const slot =
            currentWall.slots[
              slotIndex
            ]


          if (
            !slot
          ) {

            return
          }


          const replacement =
            await pullMatchingImage(
              slot.ratioKey
            )


          if (
            !replacement
          ) {

            return
          }


          /*
            Update only the currently front wall.

            Geometry values remain untouched.
          */

          if (
            frontBuffer === 'A'
          ) {

            setWallA(
              previous => {

                if (
                  !previous
                ) {

                  return previous
                }


                return {

                  ...previous,

                  slots:
                    previous.slots.map(
                      (
                        existing,
                        index
                      ) =>
                        index ===
                        slotIndex
                          ? {
                              ...existing,

                              image:
                                replacement
                            }
                          : existing
                    )
                }
              }
            )

          } else {

            setWallB(
              previous => {

                if (
                  !previous
                ) {

                  return previous
                }


                return {

                  ...previous,

                  slots:
                    previous.slots.map(
                      (
                        existing,
                        index
                      ) =>
                        index ===
                        slotIndex
                          ? {
                              ...existing,

                              image:
                                replacement
                            }
                          : existing
                    )
                }
              }
            )
          }

        },
        SLOT_CHANGE_INTERVAL
      )


    return () => {

      clearInterval(
        slotTimerRef.current
      )
    }

  }, [
    currentWall?.id,
    frontBuffer
  ])


  /* =======================================================
     WHOLE-WALL TRANSITION

     A visible -> B hidden
       prepare B
       mount B opacity 0
       two paints
       crossfade
       B stays visible forever
       A stays mounted opacity 0

     Next transition reverses.

     NOTHING is removed when the fade finishes.
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


          const targetBuffer =
            frontBuffer === 'A'
              ? 'B'
              : 'A'


          const newWall =
            await createNewWall()


          if (
            !newWall
          ) {

            wallTransitioningRef
              .current =
              false

            return
          }


          /*
            Populate the currently hidden buffer.

            The visible one is completely untouched.
          */

          if (
            targetBuffer === 'A'
          ) {

            setWallA(
              newWall
            )

          } else {

            setWallB(
              newWall
            )
          }


          setWallFadeTarget(
            null
          )


          /*
            Wait for hidden buffer to mount and paint.
          */

          wallFrameCleanupRef.current =
            afterTwoFrames(
              () => {

                /*
                  Now begin A/B opacity exchange.
                */

                setWallFadeTarget(
                  targetBuffer
                )


                wallFadeTimerRef.current =
                  setTimeout(
                    () => {

                      /*
                        Target buffer is now the canonical
                        visible wall.

                        IMPORTANT:
                        neither buffer is cleared.
                      */

                      setFrontBuffer(
                        targetBuffer
                      )


                      setWallFadeTarget(
                        null
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

        },
        WALL_CHANGE_INTERVAL
      )


    return () => {

      clearInterval(
        wallTimerRef.current
      )
    }

  }, [
    currentWall?.id,
    frontBuffer
  ])


  /* =======================================================
     WHOLE-WALL OPACITIES
  ======================================================= */

  let opacityA =
    frontBuffer === 'A'
      ? 1
      : 0


  let opacityB =
    frontBuffer === 'B'
      ? 1
      : 0


  if (
    wallFadeTarget === 'A'
  ) {

    opacityA = 1
    opacityB = 0
  }


  if (
    wallFadeTarget === 'B'
  ) {

    opacityA = 0
    opacityB = 1
  }


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

          } catch (error) {

            console.warn(
              'Fullscreen request failed:',
              error
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

          } catch (error) {

            console.warn(
              'Exiting fullscreen failed:',
              error
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


      activityTimerRef.current =
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
     CLEANUP
  ======================================================= */

  useEffect(() => {

    return () => {

      clearInterval(
        slotTimerRef.current
      )


      clearInterval(
        wallTimerRef.current
      )


      clearTimeout(
        wallFadeTimerRef.current
      )


      wallFrameCleanupRef
        .current?.()
    }

  }, [])


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <RootLayout>

      {/* Moon */}

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


      {/* Exit Black Mode */}

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

        {/* Navigation */}

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

            {/* =================================================
                FIXED OLD-FADE STAGE

                The invisible grid establishes the EXACT
                footprint of nine uniform old-Fade tiles:

                3 columns
                3 rows
                16:9 each
                10px gaps

                Because this grid participates in normal
                document flow, stage height is correct on
                the FIRST paint.

                The A/B Tetris buffers are absolute overlays
                and can never alter its dimensions.
            ================================================= */}

            <div
              ref={
                stageRef
              }
              className="relative w-full overflow-hidden"
            >

              {/* INVISIBLE OLD FADE SIZER */}

              <div
                aria-hidden="true"
                className="invisible pointer-events-none grid grid-cols-3 gap-[10px] w-full"
              >

                {Array.from({
                  length: 9
                }).map(
                  (
                    _,
                    index
                  ) => (

                    <div
                      key={
                        `fade-sizer-${index}`
                      }
                      className="w-full aspect-[16/9]"
                    />

                  )
                )}

              </div>


              {/* WALL BUFFER A */}

              <WallBuffer
                wall={
                  wallA
                }
                stageWidth={
                  stageSize.width
                }
                stageHeight={
                  stageSize.height
                }
                opacity={
                  opacityA
                }
                fadeDuration={
                  wallFadeTarget
                    ? WALL_FADE_DURATION
                    : 0
                }
                onImageClick={
                  handleImageClick
                }
              />


              {/* WALL BUFFER B */}

              <WallBuffer
                wall={
                  wallB
                }
                stageWidth={
                  stageSize.width
                }
                stageHeight={
                  stageSize.height
                }
                opacity={
                  opacityB
                }
                fadeDuration={
                  wallFadeTarget
                    ? WALL_FADE_DURATION
                    : 0
                }
                onImageClick={
                  handleImageClick
                }
              />

            </div>

          </div>

        )}

      </div>


      {!loader &&
        !blackMode && (

          <Footer />

        )}


      {/* Lightbox */}

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


      {/* Audio */}

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
