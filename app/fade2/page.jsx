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

const MOBILE_SELECTION_POOL = 14

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


function getMediaKey(photo) {
  return (
    photo?.id ||
    photo?.src ||
    ''
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


    let finished =
      false


    const finish =
      () => {

        if (finished) {
          return
        }


        finished =
          true


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
   AR FIT
========================================================= */

function ratioDistance(
  imageRatio,
  targetRatio
) {
  if (
    !imageRatio ||
    !targetRatio
  ) {

    return 100
  }


  return Math.abs(
    Math.log(
      imageRatio /
      targetRatio
    )
  )
}


function ratioPenalty(
  imageRatio,
  targetRatio
) {
  const distance =
    ratioDistance(
      imageRatio,
      targetRatio
    )


  let penalty =
    distance *
    distance *
    8


  if (
    distance >
    Math.log(1.35)
  ) {

    penalty +=
      (
        distance -
        Math.log(1.35)
      ) *
      8
  }


  return penalty
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


      const verticalGap =
        GAP *
        Math.max(
          0,
          column.items.length -
            1
        )


      const availableStackHeight =
        bandHeight -
        verticalGap


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
   MOBILE TEMPLATES

   These fill the entire fixed Fade2 mobile stage.

   The OUTER page gutters are separate and handled by the
   page wrapper below.
========================================================= */

const MOBILE_TEMPLATES = [

  {

    id:
      'balanced-a',

    rows: [

      {
        count: 2,
        weight: 0.22
      },

      {
        count: 1,
        weight: 0.28
      },

      {
        count: 2,
        weight: 0.22
      },

      {
        count: 1,
        weight: 0.28
      }
    ]
  },

  {

    id:
      'balanced-b',

    rows: [

      {
        count: 1,
        weight: 0.28
      },

      {
        count: 2,
        weight: 0.22
      },

      {
        count: 1,
        weight: 0.28
      },

      {
        count: 2,
        weight: 0.22
      }
    ]
  },

  {

    id:
      'mixed-a',

    rows: [

      {
        count: 1,
        weight: 0.26
      },

      {
        count: 2,
        weight: 0.24
      },

      {
        count: 2,
        weight: 0.24
      },

      {
        count: 1,
        weight: 0.26
      }
    ]
  },

  {

    id:
      'portrait',

    rows: [

      {
        count: 2,
        weight: 1
      },

      {
        count: 2,
        weight: 1
      },

      {
        count: 2,
        weight: 1
      }
    ]
  },

  {

    id:
      'wide',

    rows: [

      {
        count: 1,
        weight: 0.21
      },

      {
        count: 1,
        weight: 0.21
      },

      {
        count: 2,
        weight: 0.16
      },

      {
        count: 1,
        weight: 0.21
      },

      {
        count: 1,
        weight: 0.21
      }
    ]
  }
]


function getMobileTemplate(
  id
) {
  return (
    MOBILE_TEMPLATES.find(
      template =>
        template.id === id
    ) ||
    MOBILE_TEMPLATES[0]
  )
}


/* =========================================================
   MOBILE TEMPLATE GEOMETRY
========================================================= */

function buildMobileTemplateLayout(
  template,
  stageWidth,
  stageHeight
) {
  if (
    !template ||
    !stageWidth ||
    !stageHeight
  ) {

    return {

      rects: [],

      targetRatios: []
    }
  }


  const rowCount =
    template.rows.length


  const availableHeight =
    stageHeight -
    GAP *
      Math.max(
        0,
        rowCount -
          1
      )


  const totalWeight =
    template.rows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.weight,
      0
    )


  const rects = []

  const targetRatios = []


  let slotIndex = 0

  let currentY = 0


  template.rows.forEach(
    (
      row,
      rowIndex
    ) => {

      const rowHeight =
        availableHeight *
        (
          row.weight /
          totalWeight
        )


      if (
        row.count === 1
      ) {

        rects.push({

          slotIndex,

          x: 0,

          y:
            currentY,

          width:
            stageWidth,

          height:
            rowHeight
        })


        targetRatios.push(
          stageWidth /
          rowHeight
        )


        slotIndex += 1

      } else {

        const cellWidth =
          (
            stageWidth -
            GAP
          ) /
          2


        for (
          let column = 0;
          column < 2;
          column++
        ) {

          rects.push({

            slotIndex,

            x:
              column *
              (
                cellWidth +
                GAP
              ),

            y:
              currentY,

            width:
              cellWidth,

            height:
              rowHeight
          })


          targetRatios.push(
            cellWidth /
            rowHeight
          )


          slotIndex += 1
        }
      }


      currentY +=
        rowHeight


      if (
        rowIndex <
        template.rows.length -
          1
      ) {

        currentY += GAP
      }
    }
  )


  return {

    rects,

    targetRatios
  }
}


/* =========================================================
   MOBILE ASSIGNMENT
========================================================= */

function solveMobileAssignment(
  candidates,
  targetRatios
) {
  if (
    candidates.length <
    MOBILE_WALL_COUNT ||
    targetRatios.length !==
    MOBILE_WALL_COUNT
  ) {

    return null
  }


  const ranked =
    candidates
      .map(
        (
          image,
          originalIndex
        ) => {

          const ratio =
            parseImageMeta(
              image.dimensions
            ).ratio


          const bestPossibleFit =
            Math.min(
              ...targetRatios.map(
                targetRatio =>
                  ratioPenalty(
                    ratio,
                    targetRatio
                  )
              )
            )


          return {

            image,

            originalIndex,

            bestPossibleFit
          }
        }
      )
      .sort(
        (
          a,
          b
        ) => {

          if (
            a.bestPossibleFit !==
            b.bestPossibleFit
          ) {

            return (
              a.bestPossibleFit -
              b.bestPossibleFit
            )
          }


          return (
            a.originalIndex -
            b.originalIndex
          )
        }
      )
      .slice(
        0,
        MOBILE_SELECTION_POOL
      )


  if (
    ranked.length <
    MOBILE_WALL_COUNT
  ) {

    return null
  }


  const memo =
    new Map()


  const search =
    (
      slotIndex,
      usedMask
    ) => {

      if (
        slotIndex ===
        MOBILE_WALL_COUNT
      ) {

        return {

          score: 0,

          picks: []
        }
      }


      const memoKey =
        `${slotIndex}:${usedMask}`


      if (
        memo.has(
          memoKey
        )
      ) {

        return memo.get(
          memoKey
        )
      }


      let best =
        null


      for (
        let candidateIndex = 0;
        candidateIndex <
        ranked.length;
        candidateIndex++
      ) {

        const bit =
          1 <<
          candidateIndex


        if (
          usedMask &
          bit
        ) {

          continue
        }


        const candidate =
          ranked[
            candidateIndex
          ]


        const imageRatio =
          parseImageMeta(
            candidate.image.dimensions
          ).ratio


        const localScore =
          ratioPenalty(

            imageRatio,

            targetRatios[
              slotIndex
            ]
          ) +

          candidate.originalIndex *
          0.00025


        const remainder =
          search(

            slotIndex + 1,

            usedMask |
            bit
          )


        if (!remainder) {
          continue
        }


        const totalScore =
          localScore +
          remainder.score


        if (
          !best ||
          totalScore <
          best.score
        ) {

          best = {

            score:
              totalScore,

            picks: [

              candidate.image,

              ...remainder.picks
            ]
          }
        }
      }


      memo.set(
        memoKey,
        best
      )


      return best
    }


  return search(
    0,
    0
  )
}


function chooseBestMobileComposition(
  candidates,
  stageWidth,
  stageHeight
) {
  if (
    candidates.length <
    MOBILE_WALL_COUNT
  ) {

    return null
  }


  let best =
    null


  MOBILE_TEMPLATES.forEach(
    template => {

      const geometry =
        buildMobileTemplateLayout(

          template,

          stageWidth,

          stageHeight
        )


      const assignment =
        solveMobileAssignment(

          candidates,

          geometry.targetRatios
        )


      if (!assignment) {
        return
      }


      const totalScore =
        assignment.score +
        Math.random() *
          0.01


      if (
        !best ||
        totalScore <
        best.score
      ) {

        best = {

          score:
            totalScore,

          template,

          images:
            assignment.picks,

          targetRatios:
            geometry.targetRatios
        }
      }
    }
  )


  return best
}


/* =========================================================
   WALL OBJECTS
========================================================= */

function makeDesktopWall(
  images,
  configuration,
  configurationIndex,
  id
) {
  return {

    id,

    mode:
      'desktop',

    configuration,

    configurationIndex,

    slots:
      images.map(
        image => ({

          image,

          ratioKey:
            getRatioKey(
              image
            ),

          targetRatio:
            null
        })
      )
  }
}


function makeMobileWall(
  composition,
  id
) {
  return {

    id,

    mode:
      'mobile',

    mobileTemplateId:
      composition.template.id,

    slots:
      composition.images.map(
        (
          image,
          index
        ) => ({

          image,

          ratioKey:
            getRatioKey(
              image
            ),

          targetRatio:
            composition
              .targetRatios[
                index
              ]
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
      getMediaKey(image) ===
      getMediaKey(
        currentPhoto
      )
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
    image?.id,
    image?.src
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


        if (
          wall.mode ===
          'mobile'
        ) {

          const template =
            getMobileTemplate(
              wall.mobileTemplateId
            )


          return buildMobileTemplateLayout(

            template,

            stageWidth,

            stageHeight
          )
        }


        return buildDesktopLayout(

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


  const wallARef =
    useRef(null)


  const wallBRef =
    useRef(null)


  useEffect(() => {

    wallARef.current =
      wallA

  }, [
    wallA
  ])


  useEffect(() => {

    wallBRef.current =
      wallB

  }, [
    wallB
  ])


  const [
    frontBuffer,
    setFrontBuffer
  ] = useState('A')


  const frontBufferRef =
    useRef('A')


  useEffect(() => {

    frontBufferRef.current =
      frontBuffer

  }, [
    frontBuffer
  ])


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

     NORMAL MOBILE PAGE:
       /wall-style outer gutter = 16px each side
       stage width = viewport minus those gutters
       stage AR = 9:19.5

     BLACK MODE:
       no outer page gutter
       stage = full width
       stage AR = 9:19.5
       vertical overflow/crop is allowed

     DESKTOP:
       existing 16:9 stage
  ======================================================= */

  const stageRef =
    useRef(null)


  const [
    stageSize,
    setStageSize
  ] = useState({

    width: 0,

    height: 0
  })


  const stageSizeRef =
    useRef({

      width: 0,

      height: 0
    })


  useEffect(() => {

    stageSizeRef.current =
      stageSize

  }, [
    stageSize
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

          const next = {

            width:
              rect.width,

            height:
              rect.height
          }


          stageSizeRef.current =
            next


          setStageSize(
            next
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


  const addSlides =
    images => {

      if (
        !images.length
      ) {

        return
      }


      setSlides(
        previous => {

          const existingKeys =
            new Set(
              previous.map(
                slide =>
                  slide.src ||
                  slide
                    .sources?.[0]
                    ?.src
              )
            )


          const additions =
            images
              .filter(
                image =>
                  !existingKeys.has(
                    image.src
                  )
              )
              .map(
                makeSlide
              )


          return [
            ...previous,
            ...additions
          ]
        }
      )
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


        addSlides(
          images
        )
      }


      return images
    }


  const ensurePoolSize =
    async (
      minimum,
      maxFetches = 3
    ) => {

      let fetchCount = 0


      while (
        poolRef.current.length <
          minimum &&
        fetchCount <
          maxFetches
      ) {

        const fetched =
          await fetchImages()


        fetchCount++


        if (
          !fetched.length
        ) {

          break
        }
      }
    }


  /* =======================================================
     WEBM ACCOUNTING
  ======================================================= */

  const noteImageConsumed =
    image => {

      if (
        isWebm(image)
      ) {

        imagesSinceWebmRef.current =
          0

        return
      }


      imagesSinceWebmRef.current =
        Math.min(

          MIN_IMAGES_BETWEEN_WEBMS,

          imagesSinceWebmRef
            .current +
            1
        )
    }


  const noteImagesConsumed =
    images => {

      images.forEach(
        noteImageConsumed
      )
    }


  /* =======================================================
     NORMAL STREAM
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


        noteImageConsumed(
          webm
        )


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
            imagesSinceWebmRef
              .current >=
            MIN_IMAGES_BETWEEN_WEBMS
          ) {

            noteImageConsumed(
              image
            )


            return image
          }


          pendingWebmsRef
            .current
            .push(
              image
            )


          continue
        }


        noteImageConsumed(
          image
        )


        return image
      }


      return null
    }


  const getImagesForWall =
    async count => {

      const result = []


      for (
        let attempt = 0;
        attempt < 30 &&
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
          poolRef.current.length ===
            0
        ) {

          break
        }
      }


      return result
    }


  /* =======================================================
     DESKTOP EXACT-AR REPLACEMENT
  ======================================================= */

  const pullExactDesktopMatch =
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
            ) &&
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


          noteImageConsumed(
            candidate
          )


          return candidate
        }


        await fetchImages()
      }


      return null
    }


  /* =======================================================
     MOBILE SOFT-AR REPLACEMENT
  ======================================================= */

  const pullBestMobileMatch =
    async targetRatio => {

      let bestCandidate =
        null


      let bestIndex =
        -1


      let bestDistance =
        Infinity


      for (
        let attempt = 0;
        attempt < 4;
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
            isWebm(candidate) &&
            imagesSinceWebmRef
              .current <
            MIN_IMAGES_BETWEEN_WEBMS
          ) {

            continue
          }


          const candidateRatio =
            parseImageMeta(
              candidate.dimensions
            ).ratio


          const distance =
            ratioDistance(

              candidateRatio,

              targetRatio
            )


          if (
            distance <
            bestDistance
          ) {

            bestCandidate =
              candidate

            bestIndex =
              i

            bestDistance =
              distance
          }
        }


        if (
          bestCandidate &&
          bestDistance <=
          Math.log(1.25)
        ) {

          break
        }


        await fetchImages()
      }


      if (
        !bestCandidate ||
        bestIndex < 0
      ) {

        return null
      }


      poolRef.current.splice(
        bestIndex,
        1
      )


      noteImageConsumed(
        bestCandidate
      )


      return bestCandidate
    }


  /* =======================================================
     DESKTOP WALL BUILDER
  ======================================================= */

  const buildDesktopWall =
    (
      images,
      width,
      height
    ) => {

      const best =
        chooseBestConfiguration(

          images,

          width,

          height,

          lastConfigurationRef
            .current
        )


      lastConfigurationRef.current =
        best.index


      return makeDesktopWall(

        images,

        best.configuration,

        best.index,

        Date.now() +
        Math.random()
      )
    }


  /* =======================================================
     MOBILE CANDIDATE FILTER
  ======================================================= */

  const getMobileEligibleCandidates =
    images => {

      const result = []

      let webmIncluded =
        false


      for (
        const image of images
      ) {

        if (
          !isWebm(image)
        ) {

          result.push(
            image
          )

          continue
        }


        if (
          webmIncluded
        ) {

          continue
        }


        if (
          imagesSinceWebmRef
            .current <
          MIN_IMAGES_BETWEEN_WEBMS
        ) {

          continue
        }


        webmIncluded =
          true


        result.push(
          image
        )
      }


      return result
    }


  /* =======================================================
     MOBILE WALL FROM CANDIDATES
  ======================================================= */

  const buildMobileWallFromCandidates =
    (
      candidates,
      width,
      height
    ) => {

      const eligible =
        getMobileEligibleCandidates(
          candidates
        )


      const composition =
        chooseBestMobileComposition(

          eligible,

          width,

          height
        )


      if (!composition) {

        return null
      }


      return {

        wall:
          makeMobileWall(

            composition,

            Date.now() +
            Math.random()
          ),

        images:
          composition.images
      }
    }


  /* =======================================================
     CREATE MOBILE WALL
  ======================================================= */

  const createMobileWall =
    async ({
      preload = true
    } = {}) => {

      const {
        width,
        height
      } =
        stageSizeRef.current


      if (
        !width ||
        !height
      ) {

        return null
      }


      await ensurePoolSize(
        MOBILE_SELECTION_POOL
      )


      const result =
        buildMobileWallFromCandidates(

          poolRef.current,

          width,

          height
        )


      if (!result) {

        return null
      }


      const selectedKeys =
        new Set(
          result.images.map(
            getMediaKey
          )
        )


      poolRef.current =
        poolRef.current.filter(
          image =>
            !selectedKeys.has(
              getMediaKey(image)
            )
        )


      noteImagesConsumed(
        result.images
      )


      if (
        preload
      ) {

        await Promise.all(
          result.images.map(
            preloadMedia
          )
        )
      }


      return result.wall
    }


  /* =======================================================
     CREATE DESKTOP WALL
  ======================================================= */

  const createDesktopWall =
    async ({
      preload = true
    } = {}) => {

      const {
        width,
        height
      } =
        stageSizeRef.current


      if (
        !width ||
        !height
      ) {

        return null
      }


      const images =
        await getImagesForWall(
          DESKTOP_WALL_COUNT
        )


      if (
        images.length <
        DESKTOP_WALL_COUNT
      ) {

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


      return buildDesktopWall(

        images,

        width,

        height
      )
    }


  /* =======================================================
     INITIALIZATION
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


          if (
            !firstBatch.length
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


          addSlides(
            firstBatch
          )


          const mobile =
            window
              .matchMedia(
                `(max-width: ${
                  MOBILE_BREAKPOINT -
                  1
                }px)`
              )
              .matches


          let wall =
            null


          if (
            mobile
          ) {

            const result =
              buildMobileWallFromCandidates(

                firstBatch,

                stageSize.width,

                stageSize.height
              )


            if (
              result
            ) {

              wall =
                result.wall


              const selectedKeys =
                new Set(
                  result.images.map(
                    getMediaKey
                  )
                )


              poolRef.current.push(

                ...firstBatch.filter(
                  image =>
                    !selectedKeys.has(
                      getMediaKey(
                        image
                      )
                    )
                )
              )


              noteImagesConsumed(
                result.images
              )
            }

          } else {

            const selected = []

            const leftovers = []


            for (
              const image of firstBatch
            ) {

              if (
                selected.length >=
                DESKTOP_WALL_COUNT
              ) {

                leftovers.push(
                  image
                )

                continue
              }


              if (
                isWebm(image) &&
                imagesSinceWebmRef
                  .current <
                MIN_IMAGES_BETWEEN_WEBMS
              ) {

                pendingWebmsRef
                  .current
                  .push(
                    image
                  )

                continue
              }


              selected.push(
                image
              )


              noteImageConsumed(
                image
              )
            }


            if (
              selected.length ===
              DESKTOP_WALL_COUNT
            ) {

              wall =
                buildDesktopWall(

                  selected,

                  stageSize.width,

                  stageSize.height
                )


              poolRef.current.push(
                ...leftovers
              )
            }
          }


          if (
            cancelled
          ) {

            return
          }


          if (!wall) {

            poolRef.current.push(
              ...firstBatch
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


          setWallA(
            wall
          )


          wallARef.current =
            wall


          setWallB(
            null
          )


          wallBRef.current =
            null


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


  /* =======================================================
     BREAKPOINT REBUILD
  ======================================================= */

  const breakpointSwapRef =
    useRef(0)


  useEffect(() => {

    const mediaQuery =
      window.matchMedia(
        `(max-width: ${
          MOBILE_BREAKPOINT -
          1
        }px)`
      )


    let currentMode =
      mediaQuery.matches


    const handleChange =
      async event => {

        const nowMobile =
          event.matches


        if (
          nowMobile ===
          currentMode
        ) {

          return
        }


        currentMode =
          nowMobile


        const swapId =
          ++breakpointSwapRef.current


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
            ? wallARef.current
            : wallBRef.current


        if (!activeWall) {

          wallTransitioningRef.current =
            false

          return
        }


        /*
          Wait for the CSS stage to switch from 16:9 to
          9:19.5 or vice versa before calculating the new
          composition.
        */

        await new Promise(
          resolve => {

            requestAnimationFrame(
              () => {

                requestAnimationFrame(
                  resolve
                )
              }
            )
          }
        )


        if (
          swapId !==
          breakpointSwapRef.current
        ) {

          return
        }


        const {
          width,
          height
        } =
          stageSizeRef.current


        /* -----------------------------------------------
           DESKTOP -> MOBILE
        ----------------------------------------------- */

        if (
          nowMobile
        ) {

          const activeImages =
            activeWall.slots.map(
              slot =>
                slot.image
            )


          const candidates = [

            ...activeImages,

            ...poolRef.current
          ]


          const result =
            buildMobileWallFromCandidates(

              candidates,

              width,

              height
            )


          if (!result) {

            wallTransitioningRef.current =
              false

            return
          }


          const selectedKeys =
            new Set(
              result.images.map(
                getMediaKey
              )
            )


          poolRef.current =
            candidates.filter(
              image =>
                !selectedKeys.has(
                  getMediaKey(image)
                )
            )


          noteImagesConsumed(
            result.images
          )


          const mobileWall =
            result.wall


          setWallA(
            mobileWall
          )


          wallARef.current =
            mobileWall


          setWallB(
            null
          )


          wallBRef.current =
            null


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


        /* -----------------------------------------------
           MOBILE -> DESKTOP
        ----------------------------------------------- */

        const desktopImages =
          activeWall.slots
            .map(
              slot =>
                slot.image
            )
            .slice(
              0,
              MOBILE_WALL_COUNT
            )


        while (
          desktopImages.length <
          DESKTOP_WALL_COUNT
        ) {

          let next =
            pullNextImage()


          if (!next) {

            const fetched =
              await fetchImages()


            if (
              swapId !==
              breakpointSwapRef.current
            ) {

              return
            }


            if (
              !fetched.length
            ) {

              break
            }


            next =
              pullNextImage()
          }


          if (
            next
          ) {

            desktopImages.push(
              next
            )
          }
        }


        if (
          desktopImages.length <
          DESKTOP_WALL_COUNT
        ) {

          wallTransitioningRef.current =
            false

          return
        }


        const desktopWall =
          buildDesktopWall(

            desktopImages,

            width,

            height
          )


        setWallA(
          desktopWall
        )


        wallARef.current =
          desktopWall


        setWallB(
          null
        )


        wallBRef.current =
          null


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


    mediaQuery.addEventListener(
      'change',
      handleChange
    )


    return () => {

      mediaQuery.removeEventListener(
        'change',
        handleChange
      )
    }

  }, [])


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
              ? wallARef.current
              : wallBRef.current


          if (!wall) {

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


          if (!slot) {

            return
          }


          let replacement


          if (
            wall.mode ===
            'mobile'
          ) {

            replacement =
              await pullBestMobileMatch(
                slot.targetRatio
              )

          } else {

            replacement =
              await pullExactDesktopMatch(
                slot.ratioKey
              )
          }


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


                const next = {

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


                wallARef.current =
                  next


                return next
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


                const next = {

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


                wallBRef.current =
                  next


                return next
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


          wallTransitioningRef.current =
            true


          const mobile =
            window
              .matchMedia(
                `(max-width: ${
                  MOBILE_BREAKPOINT -
                  1
                }px)`
              )
              .matches


          const activeBuffer =
            frontBufferRef.current


          const targetBuffer =
            activeBuffer === 'A'
              ? 'B'
              : 'A'


          const newWall =
            mobile
              ? await createMobileWall({
                  preload: true
                })
              : await createDesktopWall({
                  preload: true
                })


          if (
            !newWall
          ) {

            wallTransitioningRef.current =
              false

            return
          }


          if (
            targetBuffer === 'A'
          ) {

            setWallA(
              newWall
            )


            wallARef.current =
              newWall

          } else {

            setWallB(
              newWall
            )


            wallBRef.current =
              newWall
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


                      wallTransitioningRef.current =
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
    currentWall?.id
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
            ease: 'easeInOut'
          }}
          className="fixed top-4 right-4 text-2xl z-[9999] cursor-pointer text-white"
          aria-label="Exit Blackmode"
        >

          <RxCross1 />

        </motion.button>

      )}


      {/*
        NORMAL PAGE:

        Mobile outer gutters deliberately match /wall:
          16px left
          16px right

        Desktop keeps the existing 64px lg gutters.

        BLACK MODE:

        No page gutters at all.
        The mobile Fade2 canvas becomes full viewport width.
      */}

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
            NORMAL MOBILE:

              available width =
                viewport width - 32px

              stage =
                9:19.5 inside that width

            BLACK MODE MOBILE:

              available width =
                full viewport width

              stage =
                9:19.5 at full width

              any excess vertical extent is deliberately
              cropped by the fullscreen wrapper.

            DESKTOP:

              16:9
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
