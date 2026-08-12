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
   TWO PAINTS
========================================================= */

function afterTwoFrames(callback) {
  let frame1 = null
  let frame2 = null

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
        Wait until a real video frame is available.
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
   DECLARED AR CATEGORY

   Individual replacements remain AR-locked.
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
   TETRIS CONFIGURATIONS

   Exactly nine images each.

   Each outer array is a set of horizontal bands.
   Each number describes how many images are stacked
   vertically in that column.

   Example:

     [1, 2, 1]

   = three columns
     column 1 has one image
     column 2 has two
     column 3 has one
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
   BUILD PREFERRED BAND

   This asks:

   If these images could preserve their exact ARs while
   filling the full stage width, how tall would this band
   naturally want to be?

   We use that only to determine relative proportions.

   It does NOT determine the final wall height.
========================================================= */

function getPreferredBand(
  items,
  pattern,
  stageWidth
) {
  let cursor = 0


  const columnCount =
    pattern.length


  const availableWidth =
    stageWidth -
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
                item.ratio,
            0
          )


        const verticalGap =
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

          verticalGap
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
        column.verticalGap /
          column.stackWeight,
      0
    )


  const preferredHeight =
    (
      availableWidth +
      gapAdjustment
    ) /
    denominator


  return {

    columns,

    preferredHeight
  }
}


/* =========================================================
   SOLVE ONE BAND INSIDE A FIXED HEIGHT

   This is the important new part.

   bandWidth is fixed.
   bandHeight is fixed.

   Therefore:
     - no external resizing
     - no overlap
     - no empty band space

   We first calculate each column's preferred width from
   its images, then normalize all column widths so they
   fill the entire stage width.

   Inside each stacked column, preferred image heights
   are likewise normalized so the column fills the exact
   band height.

   Thus every rectangle is complete and contiguous.
========================================================= */

function solveFixedBand(
  items,
  pattern,
  stageWidth,
  bandHeight
) {
  let cursor = 0


  const columnCount =
    pattern.length


  const availableColumnWidth =
    stageWidth -
    GAP *
      (
        columnCount -
        1
      )


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
                item.ratio,
            0
          )


        const verticalGap =
          GAP *
          Math.max(
            0,
            columnItems.length -
              1
          )


        /*
          Width this column would prefer if all contained
          images kept their exact AR while filling the
          chosen band height.
        */

        const preferredWidth =
          (
            bandHeight -
            verticalGap
          ) /
          stackWeight


        return {

          items:
            columnItems,

          verticalGap,

          preferredWidth
        }
      }
    )


  const totalPreferredWidth =
    columns.reduce(
      (
        total,
        column
      ) =>
        total +
        column.preferredWidth,
      0
    )


  const widthScale =
    totalPreferredWidth > 0
      ? availableColumnWidth /
        totalPreferredWidth
      : 1


  let currentX = 0

  const rects = []


  columns.forEach(
    column => {

      const columnWidth =
        column.preferredWidth *
        widthScale


      const availableStackHeight =
        bandHeight -
        column.verticalGap


      /*
        Native preferred heights at the FINAL column width.
      */

      const preferredHeights =
        column.items.map(
          item =>
            columnWidth /
            item.ratio
        )


      const preferredHeightTotal =
        preferredHeights.reduce(
          (
            total,
            height
          ) =>
            total +
            height,
          0
        )


      /*
        Normalize vertical sizes so this stack exactly fills
        its fixed-height band.
      */

      const heightScale =
        preferredHeightTotal > 0
          ? availableStackHeight /
            preferredHeightTotal
          : 1


      let currentY = 0


      column.items.forEach(
        (
          item,
          itemIndex
        ) => {

          const height =
            preferredHeights[
              itemIndex
            ] *
            heightScale


          rects.push({

            slotIndex:
              item.slotIndex,

            x:
              currentX,

            y:
              currentY,

            width:
              columnWidth,

            height
          })


          currentY +=
            height +
            GAP
        }
      )


      currentX +=
        columnWidth +
        GAP
    }
  )


  return rects
}


/* =========================================================
   FIXED-STAGE TETRIS SOLVER

   The stage is immutable.

   We determine how much height each band WANTS based on
   the nine source ARs, then normalize all band heights so
   their combined height is exactly:

     stageHeight - inter-band gutters

   Every band then gets solved exactly inside that space.

   RESULT:
   - exact outer width
   - exact outer height
   - exact 10px gaps
   - zero overlaps
   - zero holes
   - nine rectangles
========================================================= */

function buildFixedStageLayout(
  images,
  configuration,
  stageWidth,
  stageHeight
) {
  if (
    !images ||
    images.length !== 9 ||
    !stageWidth ||
    !stageHeight
  ) {

    return {
      rects: [],
      score:
        Infinity
    }
  }


  let cursor = 0


  const preparedBands =
    configuration.map(
      pattern => {

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


        const bandImages =
          images
            .slice(
              cursor,
              cursor +
                count
            )
            .map(
              (
                image,
                localIndex
              ) => ({

                image,

                slotIndex:
                  cursor +
                  localIndex,

                ratio:
                  parseImageMeta(
                    image.dimensions
                  ).ratio
              })
            )


        cursor += count


        const preferred =
          getPreferredBand(
            bandImages,
            pattern,
            stageWidth
          )


        return {

          pattern,

          items:
            bandImages,

          preferredHeight:
            preferred
              ?.preferredHeight ||
            1
        }
      }
    )


  const interBandGaps =
    GAP *
    Math.max(
      0,
      preparedBands.length -
        1
    )


  const availableBandHeight =
    stageHeight -
    interBandGaps


  const preferredHeightTotal =
    preparedBands.reduce(
      (
        total,
        band
      ) =>
        total +
        band.preferredHeight,
      0
    )


  let currentY = 0

  const finalRects =
    Array(9).fill(null)


  preparedBands.forEach(
    (
      band,
      bandIndex
    ) => {

      const bandHeight =
        preferredHeightTotal > 0
          ? availableBandHeight *
            (
              band.preferredHeight /
              preferredHeightTotal
            )
          : availableBandHeight /
            preparedBands.length


      const solvedRects =
        solveFixedBand(
          band.items,
          band.pattern,
          stageWidth,
          bandHeight
        )


      solvedRects.forEach(
        rect => {

          finalRects[
            rect.slotIndex
          ] = {

            x:
              rect.x,

            y:
              currentY +
              rect.y,

            width:
              rect.width,

            height:
              rect.height
          }
        }
      )


      currentY +=
        bandHeight


      if (
        bandIndex <
        preparedBands.length -
          1
      ) {

        currentY += GAP
      }
    }
  )


  /*
    Score the crop/distortion implied by this arrangement.

    log(cellAR / imageAR) is symmetrical:
    being twice as wide is penalized the same as
    being twice as tall.

    Lower score = better fit.
  */

  let score = 0


  finalRects.forEach(
    (
      rect,
      index
    ) => {

      if (!rect) {
        score += 1000
        return
      }


      const imageRatio =
        parseImageMeta(
          images[
            index
          ].dimensions
        ).ratio


      const cellRatio =
        rect.width /
        rect.height


      score +=
        Math.abs(
          Math.log(
            cellRatio /
            imageRatio
          )
        )
    }
  )


  return {

    rects:
      finalRects,

    score
  }
}


/* =========================================================
   PICK BEST CONFIGURATION FOR THESE NINE IMAGES

   We evaluate all available Tetris patterns against the
   exact fixed stage and choose the one requiring the least
   AR compromise.

   Tiny random jitter prevents one pattern from winning
   every near-tie.
========================================================= */

function chooseBestConfiguration(
  images,
  stageWidth,
  stageHeight,
  previousIndex = -1
) {
  const candidates =
    WALL_CONFIGURATIONS.map(
      (
        configuration,
        index
      ) => {

        const layout =
          buildFixedStageLayout(
            images,
            configuration,
            stageWidth,
            stageHeight
          )


        let score =
          layout.score


        /*
          Slight preference not to repeat the exact same
          configuration consecutively, but image fit wins
          if the difference is meaningful.
        */

        if (
          index ===
          previousIndex
        ) {
          score += 0.06
        }


        /*
          Minuscule tie-break randomness.
        */

        score +=
          Math.random() *
          0.015


        return {

          index,

          configuration,

          score
        }
      }
    )


  candidates.sort(
    (
      a,
      b
    ) =>
      a.score -
      b.score
  )


  return candidates[0]
}


/* =========================================================
   MAKE WALL
========================================================= */

function makeWall(
  images,
  configuration,
  configurationIndex,
  id
) {
  return {

    id,

    configuration,

    configurationIndex,

    slots:
      images.map(
        image => ({

          image,

          ratioKey:
            getRatioKey(
              image
            )
        })
      )
  }
}


/* =========================================================
   MEDIA LAYER
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
    isWebm(
      photo
    )
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
   PERSISTENT SLOT A/B BUFFERS
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


  const activeLayerRef =
    useRef('A')


  const transitionRef =
    useRef(false)


  const fadeTimerRef =
    useRef(null)


  const frameCleanupRef =
    useRef(null)


  useEffect(() => {

    activeLayerRef.current =
      activeLayer

  }, [
    activeLayer
  ])


  useEffect(() => {

    if (
      !image ||
      !image.src
    ) {
      return
    }


    const currentPhoto =
      activeLayerRef.current ===
      'A'
        ? layerA
        : layerB


    if (
      image.id ===
      currentPhoto?.id
    ) {
      return
    }


    if (
      transitionRef.current
    ) {
      return
    }


    let cancelled =
      false


    const prepare =
      async () => {

        transitionRef.current =
          true


        await preloadMedia(
          image
        )


        if (
          cancelled
        ) {

          transitionRef.current =
            false

          return
        }


        const inactiveLayer =
          activeLayerRef.current ===
          'A'
            ? 'B'
            : 'A'


        if (
          inactiveLayer === 'A'
        ) {

          setLayerA(
            image
          )

        } else {

          setLayerB(
            image
          )
        }


        frameCleanupRef.current =
          afterTwoFrames(
            () => {

              setFadeTarget(
                inactiveLayer
              )


              fadeTimerRef.current =
                setTimeout(
                  () => {

                    /*
                      Crucial:
                      the newly visible node remains the
                      visible node. We merely change which
                      buffer is designated active.
                    */

                    setActiveLayer(
                      inactiveLayer
                    )


                    activeLayerRef.current =
                      inactiveLayer


                    setFadeTarget(
                      null
                    )


                    transitionRef.current =
                      false

                  },
                  SLOT_FADE_DURATION *
                    1000 +
                    120
                )
            }
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


  useEffect(() => {

    return () => {

      frameCleanupRef
        .current?.()


      clearTimeout(
        fadeTimerRef.current
      )
    }

  }, [])


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

   The OUTER BUFFER stays mounted.

   When a hidden wall buffer is repopulated, its internal
   slots receive keys containing wall.id. That means we can
   replace hidden stale content cleanly without making the
   currently visible wall participate in the remount.

   Once a new wall becomes visible, those nodes remain
   mounted through completion of their wall fade.
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
      () => {

        if (
          !wall ||
          !stageWidth ||
          !stageHeight
        ) {
          return {
            rects: []
          }
        }


        return buildFixedStageLayout(

          wall.slots.map(
            slot =>
              slot.image
          ),

          wall.configuration,

          stageWidth,

          stageHeight
        )
      },
      [
        wall,
        stageWidth,
        stageHeight
      ]
    )


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

      {wall &&
        wall.slots.map(
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
                  `${wall.id}-${index}`
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
                    `${rect.height}px`
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
     WALL A/B BUFFERS
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


  const frontBufferRef =
    useRef('A')


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


  const lastConfigurationRef =
    useRef(-1)


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

     The invisible 3x3 grid below literally establishes
     old Fade's footprint in normal document flow.

     So:
       - correct on first paint
       - no footer slide
       - responsive at 2K / 4K
       - exact 3x3 16:9 + 10px gaps dimensions
  ------------------------------------------------------- */

  const stageRef =
    useRef(null)


  const [
    stageSize,
    setStageSize
  ] = useState({

    width:
      0,

    height:
      0
  })


  useEffect(() => {

    frontBufferRef.current =
      frontBuffer

  }, [
    frontBuffer
  ])


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
     1-IN-20 WEBM STREAM
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


        if (!image) {

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
     CREATE NEW FIXED-STAGE WALL

     Stage dimensions must already be known because
     configuration choice now depends on the exact stage.
  ======================================================= */

  const createNewWall =
    async () => {

      if (
        !stageSize.width ||
        !stageSize.height
      ) {

        return null
      }


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


      const best =
        chooseBestConfiguration(

          images,

          stageSize.width,

          stageSize.height,

          lastConfigurationRef
            .current
        )


      lastConfigurationRef
        .current =
        best.index


      return makeWall(

        images,

        best.configuration,

        best.index,

        Date.now() +
        Math.random()
      )
    }


  /* =======================================================
     INITIAL WALL

     We must wait until the invisible old-Fade sizer has
     supplied actual dimensions.
  ======================================================= */

  const initializedRef =
    useRef(false)


  useEffect(() => {

    if (
      initializedRef.current ||
      !stageSize.width ||
      !stageSize.height
    ) {

      return
    }


    initializedRef.current =
      true


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


          frontBufferRef.current =
            'A'


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

  }, [
    stageSize.width,
    stageSize.height
  ])


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


          const activeBuffer =
            frontBufferRef.current


          const wall =
            activeBuffer === 'A'
              ? wallA
              : wallB


          if (
            !wall
          ) {

            return
          }


          const slotIndex =
            pickSlot()


          const slot =
            wall.slots[
              slotIndex
            ]


          if (!slot) {
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


          if (
            activeBuffer === 'A'
          ) {

            setWallA(
              previous => {

                if (!previous) {
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

                if (!previous) {
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
    frontBuffer,
    wallA,
    wallB
  ])


  /* =======================================================
     WHOLE WALL CHANGE

     Persistent A/B buffers.

     Visible wall is never modified during preparation.

     Hidden buffer gets entirely new content.
     Two paint frames.
     A/B crossfade.
     Target stays visible afterward.

     No black frame required anywhere.
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


          const activeBuffer =
            frontBufferRef.current


          const targetBuffer =
            activeBuffer === 'A'
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
            Refill ONLY hidden buffer.
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


          wallFrameCleanupRef.current =
            afterTwoFrames(
              () => {

                /*
                  Start crossfade only after hidden wall
                  has actually existed in painted DOM.
                */

                setWallFadeTarget(
                  targetBuffer
                )


                wallFadeTimerRef.current =
                  setTimeout(
                    () => {

                      /*
                        Do not destroy either wall.

                        Simply declare target buffer the new
                        front buffer. Its opacity is already 1.
                      */

                      setFrontBuffer(
                        targetBuffer
                      )


                      frontBufferRef.current =
                        targetBuffer


                      setWallFadeTarget(
                        null
                      )


                      wallTransitioningRef
                        .current =
                        false

                    },
                    WALL_FADE_DURATION *
                      1000 +
                      150
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
    stageSize.width,
    stageSize.height
  ])


  /* =======================================================
     WALL OPACITY
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


        {/*

          IMPORTANT:

          The old-Fade sizer is rendered regardless of the
          loading state, so its correct height exists in the
          document immediately.

        */}

        <div
          className={
            blackMode
              ? 'absolute inset-0 flex items-center justify-center'
              : 'w-full'
          }
        >

          <div
            ref={
              stageRef
            }
            className="relative w-full overflow-hidden"
          >

            {/* ==============================================
                EXACT OLD FADE FOOTPRINT

                3 x 3
                each cell 16:9
                10px gaps

                Invisible, but owns stage height.
            ============================================== */}

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


            {loader && (

              <div className="absolute inset-0 flex items-start justify-center">

                <Loader />

              </div>

            )}


            {!loader && (

              <>

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

              </>

            )}

          </div>

        </div>

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
