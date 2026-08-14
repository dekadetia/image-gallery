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


      if (
        !best ||
        score < best.score
      ) {
        best = {
          band,
          score
        }
      }
    }
  )


  return (
    best?.band ||
    buildBand(
      images,
      pattern,
      containerWidth
    )
  )
}


/* ---------------------------------------------------------
   BUILD DESKTOP / TABLET WALL

   The normal wall follows the rotating Tetris sequence. When
   the final batch is smaller than the next scheduled pattern,
   choose a compact exact-fit pattern instead of dropping the
   remainder. This same path handles searches with only 1–4
   results; there is no separate tiny-results renderer.
--------------------------------------------------------- */

const SMALL_EXACT_PATTERNS = {
  1: [
    [1]
  ],

  2: [
    [1, 1]
  ],

  3: [
    [1, 2],
    [2, 1],
    [1, 1, 1]
  ],

  4: [
    [2, 2],
    [1, 2, 1],
    [2, 1, 1],
    [1, 1, 2]
  ]
}


function patternImageCount(
  pattern
) {
  return pattern.reduce(
    (sum, count) =>
      sum + count,
    0
  )
}


function chooseBestExactPattern(
  images,
  candidatePatterns,
  containerWidth
) {
  let best = null


  candidatePatterns.forEach(
    pattern => {
      const band =
        buildOrderedBand(
          images,
          pattern,
          containerWidth
        )


      if (!band) {
        return
      }


      const score =
        bandGeometryScore(
          band
        )


      if (
        !best ||
        score < best.score
      ) {
        best = {
          pattern,
          band,
          score
        }
      }
    }
  )


  return best
}


function chooseRemainderBand(
  remainingImages,
  patterns,
  containerWidth
) {
  const remainingCount =
    remainingImages.length


  const exactPatterns = [
    ...(
      SMALL_EXACT_PATTERNS[
        remainingCount
      ] ||
      []
    ),

    ...patterns.filter(
      pattern =>
        patternImageCount(
          pattern
        ) ===
        remainingCount
    )
  ]


  const uniqueExactPatterns =
    Array.from(
      new Map(
        exactPatterns.map(
          pattern => [
            pattern.join(','),
            pattern
          ]
        )
      ).values()
    )


  if (
    uniqueExactPatterns.length
  ) {
    return chooseBestExactPattern(
      remainingImages,
      uniqueExactPatterns,
      containerWidth
    )
  }


  /*
    If there is no exact normal pattern for this remainder,
    consume the largest sane normal pattern that leaves a
    1–4-image tail. The next loop iteration will solve that tail
    through SMALL_EXACT_PATTERNS.
  */

  const partialCandidates =
    patterns
      .map(
        pattern => ({
          pattern,
          count:
            patternImageCount(
              pattern
            )
        })
      )
      .filter(
        candidate =>
          candidate.count <
            remainingCount &&
          remainingCount -
            candidate.count <=
            4
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      )


  for (
    const candidate of
    partialCandidates
  ) {
    const images =
      remainingImages.slice(
        0,
        candidate.count
      )


    const solved =
      chooseBestExactPattern(
        images,
        [candidate.pattern],
        containerWidth
      )


    if (solved) {
      return {
        ...solved,
        consumeCount:
          candidate.count
      }
    }
  }


  return null
}


function buildWall(
  preparedImages,
  containerWidth
) {
  if (
    !containerWidth ||
    !preparedImages.length
  ) {
    return []
  }


  const patterns =
    getPatterns(
      containerWidth
    )


  const isDesktop =
    containerWidth >= 1024


  const bands = []

  let imageCursor = 0
  let bandIndex = 0


  while (
    imageCursor <
    preparedImages.length
  ) {
    const remainingImages =
      preparedImages.slice(
        imageCursor
      )


    const remaining =
      remainingImages.length


    let pattern =
      patterns[
        bandIndex %
        patterns.length
      ]


    if (
      isDesktop &&
      pattern.length === 1 &&
      pattern[0] === 1
    ) {
      const candidate =
        remainingImages[0]


      const candidateRatio =
        candidate?._meta?.ratio ||
        0


      if (
        candidateRatio < 1.85
      ) {
        pattern = [
          1,
          2,
          1
        ]
      }
    }


    const requiredImages =
      patternImageCount(
        pattern
      )


    if (
      remaining >=
      requiredImages
    ) {
      const bandImages =
        remainingImages.slice(
          0,
          requiredImages
        )


      const band =
        buildOrderedBand(
          bandImages,
          pattern,
          containerWidth
        )


      if (band) {
        bands.push(
          band
        )
      }


      imageCursor +=
        requiredImages

      bandIndex += 1
      continue
    }


    const remainder =
      chooseRemainderBand(
        remainingImages,
        patterns,
        containerWidth
      )


    if (!remainder) {
      break
    }


    bands.push(
      remainder.band
    )


    imageCursor +=
      remainder.consumeCount ||
      remaining


    bandIndex += 1
  }


  return bands
}


/* ---------------------------------------------------------
   DETERMINISTIC MOBILE ROLL
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   MOBILE SIZE CLASS

   > 1.85
     100% full

   > 1.70 through 1.85
     20% full
     80% pair

   <= 1.70
     5% full
     95% pair
--------------------------------------------------------- */

function getMobileSizeClass(
  photo
) {
  const ratio =
    photo._meta.ratio

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


/* ---------------------------------------------------------
   MOBILE ROW BUILDER

   Maximum two images per row.
--------------------------------------------------------- */

function buildMobileRows(
  preparedImages
) {
  const rows = []

  let cursor = 0


  while (
    cursor <
    preparedImages.length
  ) {

    const current =
      preparedImages[
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

      rows.push({
        type:
          'full',

        images:
          [current]
      })


      cursor += 1

      continue
    }


    const next =
      preparedImages[
        cursor + 1
      ]


    if (!next) {

      rows.push({
        type:
          'full',

        images:
          [current]
      })


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

      rows.push({
        type:
          'pair',

        images: [
          current,
          next
        ]
      })


      cursor += 2

      continue
    }


    rows.push({
      type:
        'full',

      images:
        [current]
    })


    cursor += 1
  }


  return rows
}


/* ---------------------------------------------------------
   SOLVE A MOBILE PAIR
--------------------------------------------------------- */

function solveMobilePair(
  images,
  containerWidth
) {
  const availableWidth =
    containerWidth -
    GAP


  const ratioTotal =
    images.reduce(
      (sum, image) =>
        sum +
        image._meta.ratio,
      0
    )


  const height =
    availableWidth /
    ratioTotal


  const solvedImages =
    images.map(
      image => ({
        ...image,

        _mobileWidth:
          height *
          image._meta.ratio
      })
    )


  return {
    height,

    images:
      solvedImages
  }
}


/* ---------------------------------------------------------
   MEDIA TILE

   Static images now use native browser lazy loading.

   WebMs use LazyWebm so only nearby videos exist as
   actual <video> elements.
--------------------------------------------------------- */

function WallMedia({
  photo
}) {

  if (
    isWebm(photo)
  ) {

    return (
      <LazyWebm
        src={
          photo.src
        }
        className="block w-full h-full object-cover"
      />
    )
  }


  return (
    <img
      alt={
        photo.name
      }
      src={
        photo.src
      }
      loading="lazy"
      decoding="async"
      className="block w-full h-full object-cover"
    />
  )
}


/* ---------------------------------------------------------
   MOBILE WALL
--------------------------------------------------------- */

function MobileWall({
  images,
  containerWidth,
  onImageClick
}) {

  const rows =
    useMemo(
      () =>
        buildMobileRows(
          images
        ),
      [images]
    )


  return (
    <div className="w-full">

      {rows.map(
        (
          row,
          rowIndex
        ) => {

          if (
            row.type ===
            'full'
          ) {

            const photo =
              row.images[0]


            return (
              <div
                key={
                  `mobile-row-${rowIndex}`
                }
                className="w-full"
                style={{
                  marginBottom:
                    rowIndex <
                    rows.length - 1
                      ? `${GAP}px`
                      : 0
                }}
              >

                <div
                  className="relative w-full shrink-0 overflow-hidden cursor-zoom-in"
                  style={{
                    aspectRatio:
                      `${photo._meta.ratio}`
                  }}
                  onClick={() =>
                    onImageClick(
                      photo.id || photo.src
                    )
                  }
                >

                  <WallMedia
                    photo={
                      photo
                    }
                  />

                </div>

              </div>
            )
          }


          const solved =
            solveMobilePair(
              row.images,
              containerWidth
            )


          return (
            <div
              key={
                `mobile-row-${rowIndex}`
              }
              className="w-full flex"
              style={{
                gap:
                  `${GAP}px`,

                height:
                  `${solved.height}px`,

                marginBottom:
                  rowIndex <
                  rows.length - 1
                    ? `${GAP}px`
                    : 0
              }}
            >

              {solved.images.map(
                photo => (

                  <div
                    key={
                      photo.id || photo.src
                    }
                    className="relative shrink-0 overflow-hidden cursor-zoom-in"
                    style={{
                      width:
                        `${photo._mobileWidth}px`,

                      height:
                        `${solved.height}px`
                    }}
                    onClick={() =>
                      onImageClick(
                        photo.id || photo.src
                      )
                    }
                  >

                    <WallMedia
                      photo={
                        photo
                      }
                    />

                  </div>

                )
              )}

            </div>
          )
        }
      )}

    </div>
  )
}


/* ---------------------------------------------------------
   DESKTOP / TABLET WALL
--------------------------------------------------------- */

function PackedWall({
  images,
  containerWidth,
  onImageClick
}) {

  const bands =
    useMemo(
      () =>
        buildWall(
          images,
          containerWidth
        ),
      [
        images,
        containerWidth
      ]
    )


  return (
    <div className="w-full">

      {bands.map(
        (
          band,
          bandIndex
        ) => (

          <div
            key={
              `band-${bandIndex}`
            }
            className="w-full flex"
            style={{
              gap:
                `${GAP}px`,

              height:
                `${band.height}px`,

              marginBottom:
                bandIndex <
                bands.length - 1
                  ? `${GAP}px`
                  : 0
            }}
          >

            {band.columns.map(
              (
                column,
                columnIndex
              ) => (

                <div
                  key={
                    `column-${bandIndex}-${columnIndex}`
                  }
                  className="flex flex-col shrink-0"
                  style={{
                    width:
                      `${column.width}px`,

                    height:
                      `${band.height}px`,

                    gap:
                      `${GAP}px`
                  }}
                >

                  {column.items.map(
                    photo => (

                      <div
                        key={
                          photo.id || photo.src
                        }
                        className="relative w-full shrink-0 overflow-hidden cursor-zoom-in"
                        style={{
                          aspectRatio:
                            `${photo._meta.ratio}`
                        }}
                        onClick={() =>
                          onImageClick(
                            photo.id || photo.src
                          )
                        }
                      >

                        <WallMedia
                          photo={
                            photo
                          }
                        />

                      </div>

                    )
                  )}

                </div>

              )
            )}

          </div>

        )
      )}

    </div>
  )
}


/* ---------------------------------------------------------
   RESPONSIVE WALL
--------------------------------------------------------- */

function TetrisWall({
  images,
  onImageClick
}) {

  const wallRef =
    useRef(null)

  const [
    containerWidth,
    setContainerWidth
  ] = useState(0)


  useEffect(() => {

    if (
      !wallRef.current
    ) {
      return
    }


    const measure =
      () => {

        const width =
          wallRef.current
            .getBoundingClientRect()
            .width


        setContainerWidth(
          width
        )
      }


    measure()


    const resizeObserver =
      new ResizeObserver(
        measure
      )


    resizeObserver.observe(
      wallRef.current
    )


    return () => {
      resizeObserver.disconnect()
    }

  }, [])


  const preparedImages =
    useMemo(
      () =>
        prepareImages(
          images
        ),
      [images]
    )


  const isMobile =
    containerWidth > 0 &&
    containerWidth <
      MOBILE_BREAKPOINT


  return (
    <div
      ref={
        wallRef
      }
      className="w-full"
    >

      {containerWidth > 0 && (

        isMobile ? (

          <MobileWall
            images={
              preparedImages
            }
            containerWidth={
              containerWidth
            }
            onImageClick={
              onImageClick
            }
          />

        ) : (

          <PackedWall
            images={
              preparedImages
            }
            containerWidth={
              containerWidth
            }
            onImageClick={
              onImageClick
            }
          />

        )

      )}

    </div>
  )
}




function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/['\u2018\u2019\u201A\u201B\u2032\u2035]/g, '')
    .replace(/["\u201C\u201D\u201E\u201F\u2033\u2036]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}


export default function Order() {
  const PAGE_SIZE = 99

  const searchHasMountedRef = useRef(false)
  const searchInputRef = useRef(null)
  const [isSorted, setSorted] = useState(false)
  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const [SearchResults, setSearchResults] = useState([])
  const [FullImages, setFullImages] = useState([])

const fuse = useMemo(() => {
  const normalizedImages = FullImages.map(photo => ({
    ...photo,
    _searchCaption: normalizeSearchText(photo.caption),
    _searchAlphaname: normalizeSearchText(photo.alphaname),
    _searchDirector: normalizeSearchText(photo.director),
  }))

  return new Fuse(normalizedImages, {
    keys: [
      { name: '_searchCaption', weight: 0.7 },
      { name: '_searchAlphaname', weight: 0.2 },
      { name: '_searchDirector', weight: 0.1 },
    ],
    threshold: 0.3,
    distance: 100,
    includeScore: true,
  })
}, [FullImages])

  const wasCalled = useRef(false)
  const requestIdRef = useRef(0)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loader, __loader] = useState(true)
  const [sort_loader, __sort_loader] = useState(true)

const [order_key, __order_key] = useState(null)
const [order_value, __order_value] = useState(null)
const [order_key_2, __order_key_2] = useState(null)
const [order_value_2, __order_value_2] = useState(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef(null)
  const searchRequestIdRef = useRef(0)

  /* ---------------------------------------------------
      UNIVERSAL FIXED SLIDE BUILDER (for images + videos)

      Slides always remain in the canonical sort/search order.
      The wall may make tiny local visual swaps, but the lightbox
      never inherits those presentation-only permutations.
     --------------------------------------------------- */
  function buildSlidesFromPhotos(images) {
    return (images || [])
      .filter(p => !!p?.src)
      .map(photo => {
        const meta = parseImageMeta(photo.dimensions)
        const width = meta.width || 1920
        const height = meta.height || Math.round(width / meta.ratio)

        const base = {
          src: photo.src,
          width,
          height,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director,
          year: photo.year,
        }

        if (isWebm(photo)) {
          return {
            ...base,
            type: 'tndr-webm',
            sources: [{ src: photo.src, type: 'video/webm' }],
            poster: '/assets/transparent.png',
            autoPlay: true,
            muted: true,
            loop: true,
            controls: false,
          }
        }

        return { ...base, type: 'image' }
      })
  }

  /* ---------------------------------------------------
           HELPER: build payload without null/undefined
     --------------------------------------------------- */
  function buildOrderPayload({
    order_by_key,
    order_by_value,
    order_by_key_2,
    order_by_value_2,
    size_limit,
    lastVisibleDocId,
  }) {
    const payload = {
      order_by_key,
      order_by_value,
      size_limit,
    }

    // IMPORTANT: omit optional keys entirely if not provided
    if (order_by_key_2) payload.order_by_key_2 = order_by_key_2
    if (order_by_value_2) payload.order_by_value_2 = order_by_value_2
    if (lastVisibleDocId) payload.lastVisibleDocId = lastVisibleDocId

    return payload
  }

  /* ---------------------------------------------------
                FETCH PAGINATED ORDERED IMAGES (default)
     --------------------------------------------------- */
  const getImages = async token => {
      const requestId = ++requestIdRef.current
    try {
      const payload = buildOrderPayload({
        order_by_key: 'alphaname',
        order_by_value: 'asc',
        size_limit: PAGE_SIZE,
        lastVisibleDocId: token,
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        console.error('getImages non-OK:', response.status, txt)
        return
      }

const data = await response.json()

if (requestId !== requestIdRef.current) return

const images = data.images || []

      if (images.length === 0) {
        setHasMore(false)
        return
      }

      setNextPageToken(data.nextPageToken)

      setImages(prev => {
        const seen = new Set(prev.map(i => i.id))
        const unique = images.filter(i => !seen.has(i.id))
        return [...prev, ...unique]
      })

      const newSlides = buildSlidesFromPhotos(images)
      setSlides(prev => {
        const seen = new Set(prev.map(s => s.src))
        const unique = newSlides.filter(s => !seen.has(s.src))
        return [...prev, ...unique]
      })
    } catch (err) {
      console.error('Error fetching files:', err)
    } finally {
      __loader(false)
    }
  }

  /* ---------------------------------------------------
                    FETCH ALL IMAGES (search)
     --------------------------------------------------- */
  const getAllImagesNoLimit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images-no-limit`
      )

      // DON'T let a 500 here cascade into other issues
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('getAllImagesNoLimit non-OK:', res.status, txt)
        return
      }

      const data = await res.json()
      if (data.success) {
        setFullImages(dedupeById(data.images))
      }
    } catch (err) {
      console.error('Error preloading all images:', err)
    }
  }

  /* ---------------------------------------------------
                     SORTED LOAD
     --------------------------------------------------- */
  const sortImages = async (
    order_key,
    order_value,
    order_key_2,
    order_value_2,
    size,
    token
  ) => {
      const requestId = ++requestIdRef.current
    try {
      __order_key(order_key)
      __order_value(order_value)
      __order_key_2(order_key_2)
      __order_value_2(order_value_2)
      __sort_loader(true)

      // ✅ FIX: map local param names -> payload names (prevents ReferenceError)
      const payload = buildOrderPayload({
        order_by_key: order_key,
        order_by_value: order_value,
        order_by_key_2: order_key_2,
        order_by_value_2: order_value_2,
        size_limit: size,
        lastVisibleDocId: token,
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        console.error('sortImages non-OK:', response.status, txt, payload)
        setHasMore(false)
        return
      }

const data = await response.json()

if (requestId !== requestIdRef.current) return

const images = data.images || []

      if (images.length === 0) {
        setHasMore(false)
        return
      }

      setNextPageToken(data.nextPageToken)

      setImages(prev => {
        const seen = new Set(prev.map(i => i.id))
        const unique = images.filter(i => !seen.has(i.id))
        return [...prev, ...unique]
      })

      const newSlides = buildSlidesFromPhotos(images)
      setSlides(prev => {
        const seen = new Set(prev.map(s => s.src))
        const unique = newSlides.filter(s => !seen.has(s.src))
        return [...prev, ...unique]
      })
    } catch (err) {
      console.error('Sort fetch error:', err)
    } finally {
      __sort_loader(false)
      __loader(false)
    }
  }

  /* ---------------------------------------------------
         CLEAR STATE WHEN CHANGING SORT / SEARCH
     --------------------------------------------------- */
  const clearValues = () =>
    new Promise(resolve => {
      setImages([])
      setSearchResults([])
      setSlides([])
      setNextPageToken(null)
      setHasMore(true)
      resolve()
    })

  const applySearchResults = results => {
    const deduped = dedupeById(results)
    const firstPage = deduped.slice(0, PAGE_SIZE)

    setIndex(-1)
    setSearchResults(deduped)
    setImages(firstPage)
    setSlides(buildSlidesFromPhotos(firstPage))
    setNextPageToken(null)
    setHasMore(deduped.length > PAGE_SIZE)
  }

  const loadMoreSearchResults = () => {
    setImages(prev => {
      const nextItems = SearchResults.slice(prev.length, prev.length + PAGE_SIZE)
      const updated = [...prev, ...nextItems]

      setSlides(buildSlidesFromPhotos(updated))
      setHasMore(updated.length < SearchResults.length)

      return updated
    })
  }

  const loadMoreByCondition = () => {
    if (searchQuery.trim()) {
      loadMoreSearchResults()
      return
    }

    if (order_key === 'alphaname') {
      sortImages(order_key, order_value, null, null, PAGE_SIZE, nextPageToken)
    } else if (order_key === 'year' && order_key_2 === 'alphaname') {
      sortImages(order_key, order_value, order_key_2, order_value_2, PAGE_SIZE, nextPageToken)
    } else {
      getImages(nextPageToken)
    }
  }

  /* ---------------------------------------------------
            INITIAL PAGE LOAD
     --------------------------------------------------- */
useEffect(() => {
  wasCalled.current = true

  clearValues().then(() => {
    __loader(true)
    getAllImagesNoLimit()

    setSorted(true)
    __order_key('year')
    __order_value('desc')
    __order_key_2('alphaname')
    __order_value_2('asc')

    sortImages('year', 'desc', 'alphaname', 'asc', PAGE_SIZE, null)
  })
}, [])

  /* ---------------------------------------------------
      REMOVE Lightbox "title=Close" (your existing patch)
     --------------------------------------------------- */
  useEffect(() => {
    if (!slides.length) return
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.yarl__button[title="Close"]').forEach(btn =>
        btn.removeAttribute('title')
      )
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [slides])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 0)
    }
  }, [searchOpen])

  /* ---------------------------------------------------
                      SEARCH LOGIC
     --------------------------------------------------- */
useEffect(() => {
  if (!searchHasMountedRef.current) {
    searchHasMountedRef.current = true
    return
  }

  if (debounceRef.current) clearTimeout(debounceRef.current)

  debounceRef.current = setTimeout(async () => {
    const rawQuery = normalizeSearchText(searchQuery)

    if (!rawQuery) {
      clearValues().then(() => {
        setSorted(true)
        sortImages('year', 'desc', 'alphaname', 'asc', PAGE_SIZE, null)
      })
      return
    }

      if (
        /^\d{4}$/.test(rawQuery) ||
        /^\d{3}$/.test(rawQuery) ||
        /^\d{3}x$/.test(rawQuery) ||
        /^\d{4}s$/.test(rawQuery)
      ) {
        fetchBackendSearch(rawQuery)
        return
      }
      /*
        First do a punctuation-insensitive literal substring pass.
        This makes straight quotes, curly quotes, and omitted quotes
        genuinely interchangeable for normal title/director searches.

        Fuse remains the fallback for fuzzy matching.
      */
      const directResults = FullImages.filter(photo => {
        const searchable = [
          photo.caption,
          photo.alphaname,
          photo.director,
        ]
          .map(normalizeSearchText)
          .filter(Boolean)

        return searchable.some(value =>
          value.includes(rawQuery)
        )
      })

      if (directResults.length > 0) {
        applySearchResults(directResults)
        return
      }

      const results = fuse.search(rawQuery).map(r => r.item)

      if (results.length === 0) {
        fetchBackendSearch(rawQuery)
        return
      }

      applySearchResults(results)
    }, 300)

  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }
  }, [searchQuery, FullImages])

  async function fetchBackendSearch(queryText) {
    const searchRequestId = ++searchRequestIdRef.current

    try {
      __loader(true)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/search-ordered-images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryText }),
        }
      )

      if (searchRequestId !== searchRequestIdRef.current) return

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('Backend search non-OK:', res.status, txt)
        return
      }

      const data = await res.json()

      if (searchRequestId !== searchRequestIdRef.current) return

      applySearchResults(data.results || [])
    } catch (err) {
      if (searchRequestId === searchRequestIdRef.current) {
        console.error('Backend search failed:', err)
      }
    } finally {
      if (searchRequestId === searchRequestIdRef.current) {
        __loader(false)
      }
    }
  }

  /* ---------------------------------------------------
               WALL CLICK -> CANONICAL LIGHTBOX INDEX

      The Tetris wall can locally nudge adjacent items. Resolve
      the clicked photo back to Images so slide order stays true
      to the active chronology/alphabetical/search ordering.
     --------------------------------------------------- */
  const handleImageClick = imageId => {
    const idx = Images.findIndex(image =>
      (image?.id || image?.src) === imageId
    )

    if (idx >= 0) setIndex(idx)
  }

  /* ---------------------------------------------------
                        RENDER
     --------------------------------------------------- */
  return (
    <RootLayout>
      {/* NAVIGATION */}
      <div className="w-full flex justify-center items-center pt-9 pb-[1.69rem]">
        <div className="w-full grid place-items-center space-y-6">
          <Link href="/">
            <div id="logo" className="w-40 h-auto cursor-pointer">
              <AnimatedLogo />
            </div>
          </Link>

          <div className="h-12 overflow-hidden w-full grid place-items-center !mt-[1rem] !mb-0">
            {searchOpen ? (
              <div className="w-full lg:w-[32.1%] flex justify-center mt-2 mb-6 px-4">
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        searchInputRef.current.blur()
                        setSearchOpen(false)
                        setSearchQuery('')
                      }
                    }}
                    className="w-full pl-1.5 pr-10 pt-[.45rem] pb-[.5rem] border-b border-b-white bg-transparent focus:outline-none text-sm"
                  />
                  <div onClick={() => setSearchOpen(false)} className="cursor-pointer">
                    <RxCross1 className="absolute right-3 top-2.5 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-[2.3rem] items-center -mt-[2px]">
                <BsSortAlphaDown
                  className="cursor-pointer text-2xl hover:scale-105 transition-all"
                  onClick={() => {
                    clearValues().then(() => {
                      __loader(true)
                      sortImages('alphaname', 'asc', null, null, PAGE_SIZE, null)
                    })
                  }}
                />

                <div onClick={() => setSearchOpen(true)}>
                  <FaMagnifyingGlass className="cursor-pointer text-xl hover:scale-105 transition-all" />
                </div>

                {!isSorted ? (
                  <TbClockDown
                    className="cursor-pointer text-2xl hover:scale-105 transition-all"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        setSorted(true)
                        sortImages('year', 'desc', 'alphaname', 'asc', PAGE_SIZE, null)
                      })
                    }}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer text-2xl hover:scale-105 transition-all"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        setSorted(false)
                        sortImages('year', 'asc', 'alphaname', 'asc', PAGE_SIZE, null)
                      })
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRID */}
      {!loader ? (
        <div className="px-4 lg:px-16 pb-10 relative top-[.5px]">
          <InfiniteScroll
            className="mt-[-2px]"
            dataLength={Images.length}
            next={loadMoreByCondition}
            hasMore={hasMore}
            loader={hasMore ? <MoreImageLoader /> : null}
          >
            <TetrisWall
              images={Images}
              onImageClick={handleImageClick}
            />
          </InfiniteScroll>

          {/* LIGHTBOX */}
          {slides && (
            <>
              <style jsx global>{`
                .yarl__slide .tndr-lightbox-webm-box {
                  box-sizing: border-box;
                }

                .yarl__slide video.tndr-lightbox-webm {
                  position: absolute !important;
                  inset: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  height: 100% !important;
                  max-height: 100% !important;
                  object-fit: contain !important;
                  display: block !important;
                  margin: 0 !important;
                }
              `}</style>

              <Lightbox
                index={index}
                slides={slides}
                open={index >= 0}
                close={() => setIndex(-1)}
                plugins={[Video]}
                render={{
                  slide: ({ slide, rect }) =>
                    slide.type === 'tndr-webm' ? (
                      <LightboxWebm slide={slide} rect={rect} />
                    ) : undefined,

                  slideFooter: ({ slide }) => (
                    <div
                      className={cn(
                        'lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content',
                        slide.type === 'tndr-webm' && 'relative top-auto bottom-unset'
                      )}
                    >
                      {slide.title && (
                        <div className="yarl__slide_title">{slide.title}</div>
                      )}

                      <div className={cn('!space-y-0', slide.director && '!mb-5')}>
                        {slide.director && (
                          <div className="yarl__slide_description !text-[#99AABB]">
                            <span className="font-medium">{slide.director}</span>
                          </div>
                        )}
                        {slide.description && (
                          <div className="yarl__slide_description">{slide.description}</div>
                        )}
                      </div>
                    </div>
                  ),
                }}
              />
            </>
          )}
        </div>
      ) : (
        <Loader />
      )}

      {!loader && <Footer />}
    </RootLayout>
  )
}
