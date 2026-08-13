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


const SLOT_CHANGE_INTERVAL = 5000
const WALL_CHANGE_INTERVAL = 60000

const SLOT_FADE_DURATION = 2
const WALL_FADE_DURATION = 5

const GAP = 10
const MOBILE_BREAKPOINT = 768

const DESKTOP_WALL_COUNT = 9
const MOBILE_WALL_COUNT = 6

const WEBM_INTERVAL = 20

const MIN_IMAGES_BETWEEN_WEBMS =
  WEBM_INTERVAL - 1


/* =========================================================
   MEDIA
========================================================= */

function isWebm(photo) {
  return (
    photo?.src
      ?.toLowerCase()
      .includes('.webm') ??
    false
  )
}


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


function preloadMedia(photo) {
  return new Promise(resolve => {

    if (
      !photo ||
      !photo.src
    ) {
      resolve()
      return
    }


    let finished = false


    const finish =
      () => {

        if (finished) {
          return
        }


        finished = true


        clearTimeout(
          timeout
        )


        resolve()
      }


    const timeout =
      setTimeout(
        finish,
        5000
      )


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
      finish

    image.onerror =
      finish

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
   LIGHTBOX
========================================================= */

function makeSlide(photo) {
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
    isWebm(photo)
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


/* =========================================================
   DESKTOP TETRIS
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


function buildDesktopLayout(
  images,
  configuration,
  stageWidth,
  stageHeight
) {
  if (
    !images ||
    images.length !==
      DESKTOP_WALL_COUNT ||
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
    Array(
      DESKTOP_WALL_COUNT
    ).fill(
      null
    )


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

        currentY +=
          GAP
      }
    }
  )


  let score = 0


  finalRects.forEach(
    (
      rect,
      index
    ) => {

      if (!rect) {

        score +=
          1000

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
          buildDesktopLayout(
            images,
            configuration,
            stageWidth,
            stageHeight
          )


        let score =
          layout.score


        if (
          index ===
          previousIndex
        ) {

          score +=
            0.06
        }


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
   MOBILE GRAMMAR
========================================================= */

function mobileRoll(id) {
  const value =
    String(id ?? '')

  let hash = 0


  for (
    let i = 0;
    i < value.length;
    i++
  ) {

    hash =
      (
        (hash << 5) -
        hash
      ) +
      value.charCodeAt(i)

    hash |= 0
  }


  return (
    Math.abs(hash) %
    100
  )
}


function getMobileSizeClass(photo) {
  const ratio =
    parseImageMeta(
      photo.dimensions
    ).ratio


  const roll =
    mobileRoll(
      photo.id
    )


  if (
    ratio > 1.85
  ) {
    return 'full'
  }


  if (
    ratio > 1.70
  ) {

    return (
      roll < 20
        ? 'full'
        : 'pair'
    )
  }


  return (
    roll < 5
      ? 'full'
      : 'pair'
  )
}


function buildMobileRowsPattern(images) {
  const rows = []

  let cursor = 0


  while (
    cursor <
    images.length
  ) {

    const current =
      images[
        cursor
      ]


    const currentClass =
      getMobileSizeClass(
        current
      )


    if (
      currentClass ===
      'full'
    ) {

      rows.push([
        cursor
      ])

      cursor += 1

      continue
    }


    const next =
      images[
        cursor + 1
      ]


    if (!next) {

      rows.push([
        cursor
      ])

      cursor += 1

      continue
    }


    const nextClass =
      getMobileSizeClass(
        next
      )


    if (
      nextClass ===
      'pair'
    ) {

      rows.push([
        cursor,
        cursor + 1
      ])

      cursor += 2

      continue
    }


    rows.push([
      cursor
    ])

    cursor += 1
  }


  return rows
}


/* =========================================================
   MOBILE LAYOUT

   Native mobile wall is always six images.

   Geometry is allowed to float vertically inside the
   permanent stage rather than brutally filling it.
========================================================= */

function buildMobileLayout(
  images,
  rowsPattern,
  stageWidth,
  stageHeight
) {
  if (
    !images ||
    images.length !==
      MOBILE_WALL_COUNT ||
    !rowsPattern?.length ||
    !stageWidth ||
    !stageHeight
  ) {

    return {
      rects: []
    }
  }


  const preparedRows =
    rowsPattern.map(
      slotIndexes => {

        const rowImages =
          slotIndexes
            .map(
              slotIndex => {

                const image =
                  images[
                    slotIndex
                  ]


                if (!image) {
                  return null
                }


                return {

                  image,

                  slotIndex,

                  ratio:
                    parseImageMeta(
                      image.dimensions
                    ).ratio
                }
              }
            )
            .filter(Boolean)


        if (
          !rowImages.length
        ) {

          return null
        }


        let naturalHeight


        if (
          rowImages.length === 1
        ) {

          naturalHeight =
            stageWidth /
            rowImages[0].ratio

        } else {

          const availableWidth =
            stageWidth -
            GAP


          const ratioTotal =
            rowImages.reduce(
              (
                total,
                item
              ) =>
                total +
                item.ratio,
              0
            )


          naturalHeight =
            ratioTotal > 0
              ? availableWidth /
                ratioTotal
              : availableWidth /
                2
        }


        return {

          items:
            rowImages,

          naturalHeight
        }
      }
    )
    .filter(Boolean)


  const rowGapTotal =
    GAP *
    Math.max(
      0,
      preparedRows.length -
        1
    )


  const availableHeight =
    stageHeight -
    rowGapTotal


  const naturalHeightTotal =
    preparedRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.naturalHeight,
      0
    )


  /*
    If natural content is taller than the fixed canvas,
    shrink the composition uniformly.

    If it is shorter, do not stretch it.
  */

  const scale =
    naturalHeightTotal >
    availableHeight
      ? availableHeight /
        naturalHeightTotal
      : 1


  const scaledNaturalTotal =
    naturalHeightTotal *
    scale


  const unusedHeight =
    Math.max(
      0,
      availableHeight -
        scaledNaturalTotal
    )


  let currentY =
    unusedHeight /
    2


  const rects =
    Array(
      MOBILE_WALL_COUNT
    ).fill(
      null
    )


  preparedRows.forEach(
    (
      row,
      rowIndex
    ) => {

      const rowHeight =
        row.naturalHeight *
        scale


      if (
        row.items.length === 1
      ) {

        const item =
          row.items[0]


        const width =
          Math.min(
            stageWidth,
            rowHeight *
              item.ratio
          )


        rects[
          item.slotIndex
        ] = {

          x:
            (
              stageWidth -
              width
            ) /
            2,

          y:
            currentY,

          width,

          height:
            rowHeight
        }

      } else {

        const availableWidth =
          stageWidth -
          GAP


        const naturalWidths =
          row.items.map(
            item =>
              item.ratio *
              rowHeight
          )


        const naturalWidthTotal =
          naturalWidths.reduce(
            (
              total,
              width
            ) =>
              total +
              width,
            0
          )


        const pairScale =
          naturalWidthTotal >
          availableWidth
            ? availableWidth /
              naturalWidthTotal
            : 1


        const widths =
          naturalWidths.map(
            width =>
              width *
              pairScale
          )


        const finalRowHeight =
          rowHeight *
          pairScale


        const usedWidth =
          widths.reduce(
            (
              total,
              width
            ) =>
              total +
              width,
            0
          ) +
          GAP


        let currentX =
          (
            stageWidth -
            usedWidth
          ) /
          2


        row.items.forEach(
          (
            item,
            itemIndex
          ) => {

            const width =
              widths[
                itemIndex
              ]


            rects[
              item.slotIndex
            ] = {

              x:
                currentX,

              y:
                currentY,

              width,

              height:
                finalRowHeight
            }


            currentX +=
              width


            if (
              itemIndex <
              row.items.length -
                1
            ) {

              currentX +=
                GAP
            }
          }
        )
      }


      currentY +=
        rowHeight


      if (
        rowIndex <
        preparedRows.length -
          1
      ) {

        currentY +=
          GAP
      }
    }
  )


  return {
    rects
  }
}


/* =========================================================
   WALL OBJECT
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

    mobileRows:
      images.length ===
      MOBILE_WALL_COUNT
        ? buildMobileRowsPattern(
            images
          )
        : null,

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

   Media itself never intercepts taps.
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
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      alt=""
      draggable={false}
    />
  )
}


/* =========================================================
   PERSISTENT SLOT A/B
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
    <div className="relative w-full h-full overflow-hidden pointer-events-none">

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

   No cross-breakpoint fallback.

   Mobile renderer expects six.
   Desktop renderer expects nine.

   Breakpoint effect below guarantees the front wall is
   immediately rebuilt to the right count.
========================================================= */

function WallBuffer({
  wall,
  stageWidth,
  stageHeight,
  opacity,
  fadeDuration,
  interactive,
  onImageClick
}) {
  const isMobile =
    stageWidth > 0 &&
    stageWidth <
      MOBILE_BREAKPOINT


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


        const images =
          wall.slots.map(
            slot =>
              slot.image
          )


        if (
          isMobile
        ) {

          if (
            images.length !==
            MOBILE_WALL_COUNT
          ) {

            return {
              rects: []
            }
          }


          return buildMobileLayout(

            images,

            wall.mobileRows,

            stageWidth,

            stageHeight
          )
        }


        if (
          images.length !==
          DESKTOP_WALL_COUNT
        ) {

          return {
            rects: []
          }
        }


        return buildDesktopLayout(

          images,

          wall.configuration,

          stageWidth,

          stageHeight
        )
      },
      [
        wall,
        stageWidth,
        stageHeight,
        isMobile
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
      style={{
        pointerEvents:
          interactive
            ? 'auto'
            : 'none'
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
                className="absolute overflow-hidden cursor-zoom-in touch-manipulation"
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
   PAGE
========================================================= */

export default function FadeGallery() {

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


  const lastSlotRef =
    useRef(-1)


  const lastUpdatedRef =
    useRef(
      Array(
        DESKTOP_WALL_COUNT
      ).fill(0)
    )


  const fadeCount =
    useRef(0)


  const [
    index,
    setIndex
  ] = useState(-1)


  const [
    slides,
    setSlides
  ] = useState([])


  /* =======================================================
     STAGE
  ======================================================= */

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

  }, [])


  /* =======================================================
     FETCH
  ======================================================= */

  const fetchImageBatch =
    async () => {

      if (
        loadingRef.current
      ) {
        return []
      }


      loadingRef.current =
        true


      try {

        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images`
          )


        if (
          !response.ok
        ) {

          throw new Error(
            `Fade image fetch failed: ${response.status}`
          )
        }


        const data =
          await response.json()


        return (
          data.images ||
          []
        )

      } catch (error) {

        console.error(
          'Failed to fetch fade images:',
          error
        )


        return []

      } finally {

        loadingRef.current =
          false
      }
    }


  const fetchImages =
    async () => {

      const images =
        await fetchImageBatch()


      if (
        images.length
      ) {

        poolRef.current.push(
          ...images
        )


        setSlides(
          previous => [
            ...previous,
            ...images.map(
              makeSlide
            )
          ]
        )
      }


      return images
    }


  /* =======================================================
     INITIAL SELECTION
  ======================================================= */

  const takeInitialWallImages =
    (
      images,
      count
    ) => {

      const selected = []
      const leftovers = []


      let imagesSinceWebm =
        MIN_IMAGES_BETWEEN_WEBMS


      for (
        const image of images
      ) {

        if (
          selected.length >=
          count
        ) {

          leftovers.push(
            image
          )

          continue
        }


        if (
          isWebm(image)
        ) {

          if (
            imagesSinceWebm >=
            MIN_IMAGES_BETWEEN_WEBMS
          ) {

            selected.push(
              image
            )


            imagesSinceWebm =
              0

          } else {

            pendingWebmsRef
              .current
              .push(
                image
              )
          }


          continue
        }


        selected.push(
          image
        )


        imagesSinceWebm =
          Math.min(

            MIN_IMAGES_BETWEEN_WEBMS,

            imagesSinceWebm +
              1
          )
      }


      imagesSinceWebmRef.current =
        imagesSinceWebm


      return {

        selected,

        leftovers
      }
    }


  /* =======================================================
     WEBM STREAM
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
          .current =
          0


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
              .current =
              0


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
              .current =
              0


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
     GET WALL IMAGES
  ======================================================= */

  const getImagesForWall =
    async count => {

      const result = []


      for (
        let attempt = 0;
        attempt < 20 &&
        result.length < count;
        attempt++
      ) {

        let image =
          pullNextImage()


        if (
          image
        ) {

          result.push(
            image
          )

          continue
        }


        const fetched =
          await fetchImages()


        if (
          !fetched.length &&
          poolRef.current.length === 0
        ) {

          break
        }
      }


      return result
    }


  /* =======================================================
     WALL BUILDERS
  ======================================================= */

  const buildMobileWall =
    images => {

      return makeWall(

        images,

        WALL_CONFIGURATIONS[0],

        0,

        Date.now() +
        Math.random()
      )
    }


  const buildDesktopWall =
    (
      images,
      width = stageSize.width,
      height = stageSize.height
    ) => {

      const best =
        chooseBestConfiguration(

          images,

          width,

          height,

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


  const buildWallFromImages =
    images => {

      if (
        images.length ===
        MOBILE_WALL_COUNT
      ) {

        return buildMobileWall(
          images
        )
      }


      return buildDesktopWall(
        images
      )
    }


  const createNewWall =
    async ({
      preload = true
    } = {}) => {

      if (
        !stageSize.width ||
        !stageSize.height
      ) {

        return null
      }


      const count =
        stageSize.width <
        MOBILE_BREAKPOINT
          ? MOBILE_WALL_COUNT
          : DESKTOP_WALL_COUNT


      const images =
        await getImagesForWall(
          count
        )


      if (
        images.length <
        count
      ) {

        console.warn(
          `Fade2 needed ${count} images but only obtained ${images.length}`
        )


        return null
      }


      if (
        preload
      ) {

        await Promise.all(
          images.map(
            preloadMedia
          )
        )
      }


      return buildWallFromImages(
        images
      )
    }


  /* =======================================================
     FAST INITIALIZATION
  ======================================================= */

  const initInProgressRef =
    useRef(false)


  const initRetryRef =
    useRef(null)


  useEffect(() => {

    if (
      !stageSize.width ||
      !stageSize.height ||
      wallA ||
      initInProgressRef.current
    ) {

      return
    }


    let cancelled =
      false


    const initialize =
      async () => {

        initInProgressRef.current =
          true


        try {

          const firstBatch =
            await fetchImageBatch()


          if (
            cancelled
          ) {
            return
          }


          const count =
            stageSize.width <
            MOBILE_BREAKPOINT
              ? MOBILE_WALL_COUNT
              : DESKTOP_WALL_COUNT


          if (
            firstBatch.length <
            count
          ) {

            initInProgressRef.current =
              false


            initRetryRef.current =
              setTimeout(
                initialize,
                1200
              )


            return
          }


          const {
            selected,
            leftovers
          } =
            takeInitialWallImages(
              firstBatch,
              count
            )


          if (
            selected.length <
            count
          ) {

            poolRef.current.push(
              ...leftovers
            )


            initInProgressRef.current =
              false


            initRetryRef.current =
              setTimeout(
                initialize,
                1200
              )


            return
          }


          const wall =
            buildWallFromImages(
              selected
            )


          setWallA(
            wall
          )


          setWallB(
            null
          )


          setFrontBuffer(
            'A'
          )


          frontBufferRef.current =
            'A'


          __loader(
            false
          )


          initInProgressRef.current =
            false


          poolRef.current.push(
            ...leftovers
          )


          requestAnimationFrame(
            () => {

              if (
                cancelled
              ) {
                return
              }


              setSlides(
                firstBatch.map(
                  makeSlide
                )
              )
            }
          )

        } catch (error) {

          console.error(
            'Fade2 initialization failed:',
            error
          )


          initInProgressRef.current =
            false


          if (
            !cancelled
          ) {

            initRetryRef.current =
              setTimeout(
                initialize,
                1200
              )
          }
        }
      }


    initialize()


    return () => {

      cancelled =
        true


      clearTimeout(
        initRetryRef.current
      )


      initInProgressRef.current =
        false
    }

  }, [
    stageSize.width,
    stageSize.height,
    wallA
  ])


  const currentWall =
    frontBuffer === 'A'
      ? wallA
      : wallB


  /* =========================================================
     BREAKPOINT MODE SWAP

     THIS IS THE IMPORTANT CHANGE.

     We do NOT preserve the wrong wall count.

     9 -> 6 immediately on entering mobile.
     6 -> 9 immediately on entering desktop.

     No breakpoint fade.
  ========================================================= */

  const viewportModeRef =
    useRef(null)


  const breakpointSwapRef =
    useRef(0)


  useEffect(() => {

    if (
      !stageSize.width ||
      !stageSize.height ||
      !currentWall
    ) {

      return
    }


    const nowMobile =
      stageSize.width <
      MOBILE_BREAKPOINT


    /*
      First measurement only establishes the current mode.
    */

    if (
      viewportModeRef.current ===
      null
    ) {

      viewportModeRef.current =
        nowMobile

      return
    }


    /*
      Width changed but breakpoint did not.
    */

    if (
      viewportModeRef.current ===
      nowMobile
    ) {

      return
    }


    viewportModeRef.current =
      nowMobile


    const swapId =
      ++breakpointSwapRef.current


    /*
      Kill any whole-wall transition currently underway.

      Breakpoint changes are authoritative.
    */

    clearTimeout(
      wallFadeTimerRef.current
    )


    wallFrameCleanupRef
      .current?.()


    wallFrameCleanupRef.current =
      null


    setWallFadeTarget(
      null
    )


    wallTransitioningRef.current =
      true


    const activeWall =
      frontBufferRef.current ===
      'A'
        ? wallA
        : wallB


    if (
      !activeWall
    ) {

      wallTransitioningRef.current =
        false

      return
    }


    const activeImages =
      activeWall.slots.map(
        slot =>
          slot.image
      )


    /* -----------------------------------------------------
       DESKTOP -> MOBILE

       This path is genuinely immediate because we already
       have 9 images. Keep six and put the remaining three
       back into the future pool.
    ----------------------------------------------------- */

    if (
      nowMobile
    ) {

      const mobileImages =
        activeImages.slice(
          0,
          MOBILE_WALL_COUNT
        )


      const returnedImages =
        activeImages.slice(
          MOBILE_WALL_COUNT
        )


      /*
        Put dropped desktop frames back near the front of
        the pool rather than losing them.
      */

      if (
        returnedImages.length
      ) {

        poolRef.current.unshift(
          ...returnedImages
        )
      }


      const mobileWall =
        buildMobileWall(
          mobileImages
        )


      /*
        Direct install.
        No crossfade.
      */

      setWallA(
        mobileWall
      )


      setWallB(
        null
      )


      setFrontBuffer(
        'A'
      )


      frontBufferRef.current =
        'A'


      lastSlotRef.current =
        -1


      lastUpdatedRef.current =
        Array(
          DESKTOP_WALL_COUNT
        ).fill(0)


      wallTransitioningRef.current =
        false


      return
    }


    /* -----------------------------------------------------
       MOBILE -> DESKTOP

       Keep the six current images and obtain three more.

       Usually these are already in the pool and the swap
       completes effectively immediately.

       If the pool must fetch, we wait only for those three.
    ----------------------------------------------------- */

    let cancelled =
      false


    const switchToDesktop =
      async () => {

        const desktopImages = [
          ...activeImages.slice(
            0,
            MOBILE_WALL_COUNT
          )
        ]


        while (
          desktopImages.length <
          DESKTOP_WALL_COUNT
        ) {

          const image =
            pullNextImage()


          if (
            image
          ) {

            desktopImages.push(
              image
            )

            continue
          }


          const fetched =
            await fetchImages()


          if (
            cancelled ||
            swapId !==
            breakpointSwapRef.current
          ) {

            return
          }


          if (
            !fetched.length &&
            poolRef.current.length ===
              0
          ) {

            break
          }
        }


        if (
          cancelled ||
          swapId !==
          breakpointSwapRef.current
        ) {

          return
        }


        if (
          desktopImages.length <
          DESKTOP_WALL_COUNT
        ) {

          console.warn(
            'Fade2 could not complete desktop breakpoint rebuild'
          )


          wallTransitioningRef.current =
            false

          return
        }


        /*
          stageSize already reflects the new desktop
          16:9 stage at this point.
        */

        const desktopWall =
          buildDesktopWall(

            desktopImages,

            stageSize.width,

            stageSize.height
          )


        setWallA(
          desktopWall
        )


        setWallB(
          null
        )


        setFrontBuffer(
          'A'
        )


        frontBufferRef.current =
          'A'


        lastSlotRef.current =
          -1


        lastUpdatedRef.current =
          Array(
            DESKTOP_WALL_COUNT
          ).fill(0)


        wallTransitioningRef.current =
          false
      }


    switchToDesktop()


    return () => {

      cancelled =
        true
    }

  }, [
    stageSize.width,
    stageSize.height
  ])


  /* =======================================================
     SLOT PICK
  ======================================================= */

  const pickSlot =
    count => {

      fadeCount.current++


      const relevantUpdates =
        lastUpdatedRef
          .current
          .slice(
            0,
            count
          )


      const sorted =
        relevantUpdates
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


      if (
        !candidates.length
      ) {

        return 0
      }


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
     SLOT CHANGES
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
            pickSlot(
              wall.slots.length
            )


          const slot =
            wall.slots[
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


          if (
            activeBuffer === 'A'
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
    frontBuffer,
    wallA,
    wallB
  ])


  /* =======================================================
     WHOLE WALL CHANGES
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
            await createNewWall({
              preload:
                true
            })


          if (
            !newWall
          ) {

            wallTransitioningRef
              .current =
              false

            return
          }


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

                setWallFadeTarget(
                  targetBuffer
                )


                wallFadeTimerRef.current =
                  setTimeout(
                    () => {

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


      clearTimeout(
        initRetryRef.current
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


        <div
          className={
            blackMode
              ? 'absolute inset-0 flex items-center justify-center'
              : 'w-full'
          }
        >

          {/*
            MOBILE:
              6 images
              9:19.5 portrait
              full width

            DESKTOP:
              9 images
              16:9

            Crossing md changes the actual wall count
            immediately. There is no temporary fallback.
          */}

          <div
            ref={
              stageRef
            }
            className="relative w-full overflow-hidden aspect-[9/19.5] md:aspect-[16/9]"
          >

            {loader && (

              <div className="absolute inset-0 flex items-start justify-center">

                <Loader />

              </div>

            )}


            {!loader && (

              <>

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
                  interactive={
                    wallFadeTarget
                      ? wallFadeTarget === 'A'
                      : frontBuffer === 'A'
                  }
                  onImageClick={
                    handleImageClick
                  }
                />


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
                  interactive={
                    wallFadeTarget
                      ? wallFadeTarget === 'B'
                      : frontBuffer === 'B'
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
