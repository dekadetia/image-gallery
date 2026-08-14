'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown, TbClockUp } from 'react-icons/tb'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Footer from '../../components/Footer'
import Fuse from 'fuse.js'
import MoreImageLoader from '../../components/MoreImageLoader'
import RootLayout from '../layout'
import AnimatedLogo from '../../components/AnimatedLogo'
import InfiniteScroll from 'react-infinite-scroll-component'
import Loader from '../../components/loader/loader'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function dedupeById(items) {
  const seen = new Set()
  return (items || []).filter(item => {
    const key = item?.id || item?.src
    if (!key) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function LightboxWebm({ slide, rect }) {
  const ratio =
    slide.width && slide.height
      ? slide.width / slide.height
      : 16 / 9

  const isDesktop = rect.width >= 768
  const maxWidth = rect.width * (isDesktop ? 0.96 : 1)
  const maxHeight = isDesktop
    ? Math.max(1, window.innerHeight - 160)
    : Math.max(1, rect.height)

  let width = maxWidth
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return (
    <div
      className="tndr-lightbox-webm-box"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        flex: '0 0 auto',
        position: 'relative',
        margin: isDesktop ? '26px auto 0' : '0 auto',
      }}
    >
      <video
        className="tndr-lightbox-webm"
        src={slide.sources?.[0]?.src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={slide.poster}
      />
    </div>
  )
}

const GAP = 10
const MOBILE_BREAKPOINT = 768


/* ---------------------------------------------------------
   MEDIA TYPE
--------------------------------------------------------- */

function isWebm(photo) {
  return (
    photo?.src
      ?.toLowerCase()
      .includes('.webm') ?? false
  )
}


/* ---------------------------------------------------------
   LAZY WEBM

   Only mount a real <video> while the tile is within
   800px of the viewport.

   Once it moves sufficiently far away, the <video>
   disappears completely from the DOM, freeing decoder
   and buffering resources while preserving tile geometry.
--------------------------------------------------------- */

function LazyWebm({
  src,
  className = ''
}) {
  const wrapperRef =
    useRef(null)

  const [
    isNearby,
    setIsNearby
  ] = useState(false)


  useEffect(() => {
    const element =
      wrapperRef.current

    if (!element) {
      return
    }


    const observer =
      new IntersectionObserver(
        entries => {
          const entry =
            entries[0]

          setIsNearby(
            entry.isIntersecting
          )
        },
        {
          root: null,

          rootMargin:
            '800px 0px',

          threshold: 0
        }
      )


    observer.observe(
      element
    )


    return () => {
      observer.disconnect()
    }
  }, [])


  return (
    <div
      ref={wrapperRef}
      className="w-full h-full"
    >

      {isNearby ? (

        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/transparent.png"
          className={className}
        />

      ) : (

        <div className="w-full h-full" />

      )}

    </div>
  )
}


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
   PREPARE IMAGES
--------------------------------------------------------- */

function prepareImages(images) {
  return images.map(image => ({
    ...image,

    _meta:
      parseImageMeta(
        image.dimensions
      )
  }))
}


/* ---------------------------------------------------------
   DESKTOP / TABLET PATTERNS
--------------------------------------------------------- */

const DESKTOP_SEQUENCE = [
  [1, 2, 2],
  [2, 1, 2],
  [1, 2],
  [2, 2, 1],

  [1, 2, 1],
  [1, 2, 2, 2],
  [2, 1, 1],
  [2, 1, 2],

  [2, 1],
  [1, 1, 2],
  [2, 2, 1],
  [2, 2, 1, 2],

  [1, 2, 2],
  [1, 2, 1],
  [1],
  [2, 1, 2],

  [2, 2, 1],
  [1, 2],
  [1, 1, 2],
  [2, 1, 1]
]


const TABLET_PATTERNS = [
  [1, 2, 2],
  [2, 1, 2],
  [2, 2, 1],

  [1, 3, 1],
  [3, 1, 1],
  [1, 1, 3]
]


function getPatterns(containerWidth) {
  if (containerWidth < 1024) {
    return TABLET_PATTERNS
  }

  return DESKTOP_SEQUENCE
}


/* ---------------------------------------------------------
   BUILD ONE DESKTOP / TABLET BAND
--------------------------------------------------------- */

function buildBand(
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
            1 / image._meta.ratio,
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


/* ---------------------------------------------------------
   BUILD DESKTOP / TABLET WALL
--------------------------------------------------------- */

// /ordr is stricter than main: geometry can justify a tiny local nudge,
// but order gets twice main's displacement cost.
const LOCAL_ORDER_WEIGHT = 0.16


/* ---------------------------------------------------------
   ORDER-PRESERVING BAND SOLVER

   /ordr keeps the active sort/search stream canonical.
   Inside each individual Tetris band, however, we may make
   one or two tiny adjacent swaps when they materially improve
   the geometry.

   That means:

     A B C D E F

   can become something like:

     A C B D F E

   but images never jump across band boundaries and there is
   no broad shuffle of the catalog.
--------------------------------------------------------- */

function bandGeometryScore(band) {
  if (
    !band ||
    !band.columns?.length
  ) {
    return Infinity
  }


  const widths =
    band.columns.map(
      column => column.width
    )


  const averageWidth =
    widths.reduce(
      (sum, width) =>
        sum + width,
      0
    ) /
    widths.length


  if (
    !Number.isFinite(averageWidth) ||
    averageWidth <= 0
  ) {
    return Infinity
  }


  const balancePenalty =
    widths.reduce(
      (sum, width) => {
        const distance =
          Math.log(
            width /
            averageWidth
          )

        return (
          sum +
          distance * distance
        )
      },
      0
    ) /
    widths.length


  const narrowest =
    Math.min(...widths)


  const narrowPenalty =
    narrowest <
    averageWidth * 0.52
      ? (
          averageWidth * 0.52 -
          narrowest
        ) /
        averageWidth
      : 0


  return (
    balancePenalty +
    narrowPenalty * 0.8
  )
}


function orderDisplacementScore(
  original,
  candidate
) {
  const originalPositions =
    new Map(
      original.map(
        (image, index) => [
          image.id ?? image.name ?? index,
          index
        ]
      )
    )


  return candidate.reduce(
    (score, image, index) => {
      const key =
        image.id ??
        image.name ??
        index


      const originalIndex =
        originalPositions.get(key)


      if (
        originalIndex === undefined
      ) {
        return score
      }


      return (
        score +
        Math.abs(
          originalIndex - index
        )
      )
    },
    0
  )
}


function getLocalOrderCandidates(images) {
  const candidates = [
    images
  ]


  for (
    let i = 0;
    i < images.length - 1;
    i++
  ) {
    const once =
      [...images]


    ;[
      once[i],
      once[i + 1]
    ] = [
      once[i + 1],
      once[i]
    ]


    candidates.push(
      once
    )


    for (
      let j = i + 2;
      j < images.length - 1;
      j++
    ) {
      const twice =
        [...once]


      ;[
        twice[j],
        twice[j + 1]
      ] = [
        twice[j + 1],
        twice[j]
      ]


      candidates.push(
        twice
      )
    }
  }


  return candidates
}


function buildOrderedBand(
  images,
  pattern,
  containerWidth
) {
  const candidates =
    getLocalOrderCandidates(
      images
    )


  let best = null


  candidates.forEach(
    candidateImages => {
      const band =
        buildBand(
          candidateImages,
          pattern,
          containerWidth
        )


      if (!band) {
        return
      }


      const geometryScore =
        bandGeometryScore(
          band
        )


      const displacement =
        orderDisplacementScore(
          images,
          candidateImages
        )


      const score =
        geometryScore +
        displacement *
          LOCAL_ORDER_WEIGHT

