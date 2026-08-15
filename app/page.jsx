"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../components/loader/loader";
import MoreImageLoader from "../components/MoreImageLoader/index";
import Footer from "../components/Footer";
import RootLayout from "./layout";
import AnimatedLogo from "../components/AnimatedLogo";

import { IoMdList } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import { IoMdShuffle } from "react-icons/io";

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}


/* ---------------------------------------------------------
   LIGHTBOX WEBM

   Reserve the final WebM geometry before the real <video>
   element initializes. The video then fills that fixed box,
   so slide metadata cannot be pushed around while it loads.
--------------------------------------------------------- */

function LightboxWebm({
  slide,
  rect
}) {
  const ratio =
    slide.width &&
    slide.height
      ? slide.width /
        slide.height
      : 16 / 9

  const isDesktop =
    rect.width >= 768

  const maxWidth =
    rect.width *
    (
      isDesktop
        ? 0.96
        : 1
    )

  const maxHeight =
    isDesktop
      ? Math.max(
          1,
          window.innerHeight -
            160
        )
      : Math.max(
          1,
          rect.height
        )

  let width =
    maxWidth

  let height =
    width /
    ratio


  if (
    height >
    maxHeight
  ) {
    height =
      maxHeight

    width =
      height *
      ratio
  }


  return (
    <div
      className="tndr-lightbox-webm-box"
      style={{
        width:
          `${width}px`,

        height:
          `${height}px`,

        flex:
          '0 0 auto',

        position:
          'relative',

        margin:
          isDesktop
            ? '26px auto 0'
            : '0 auto'
      }}
    >
      <video
        className="tndr-lightbox-webm"
        src={
          slide.sources?.[0]?.src
        }
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={
          slide.poster
        }
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


/*
  DESKTOP START VARIETY

  Main previously always began at DESKTOP_SEQUENCE[0], which is
  [1, 2, 2] and therefore strongly favors one large upper-left tile.

  Pick one sane phase once per page load instead. We deliberately
  exclude the single-column [1] entry as an initial composition.
*/
const DESKTOP_START_INDICES = [
  0,  // [1, 2, 2]   left-heavy
  1,  // [2, 1, 2]   center-heavy
  3,  // [2, 2, 1]   right-heavy
  4,  // [1, 2, 1]
  5,  // [1, 2, 2, 2]
  6,  // [2, 1, 1]
  7,  // [2, 1, 2]
  8,  // [2, 1]
  9,  // [1, 1, 2]
  10, // [2, 2, 1]
  11, // [2, 2, 1, 2]
  12, // [1, 2, 2]
  13, // [1, 2, 1]
  15, // [2, 1, 2]
  16, // [2, 2, 1]
  17, // [1, 2]
  18, // [1, 1, 2]
  19, // [2, 1, 1]
]


function chooseDesktopStartIndex() {
  return DESKTOP_START_INDICES[
    Math.floor(
      Math.random() *
      DESKTOP_START_INDICES.length
    )
  ]
}


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

const LOCAL_ORDER_WEIGHT = 0.08


/* ---------------------------------------------------------
   ORDER-PRESERVING BAND SOLVER

   Main keeps the Firebase / filename stream canonical.
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
--------------------------------------------------------- */

function buildWall(
  preparedImages,
  containerWidth,
  desktopStartIndex = 0
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

    const patternOffset =
      isDesktop
        ? desktopStartIndex
        : 0


    let pattern =
      patterns[
        (
          bandIndex +
          patternOffset
        ) %
        patterns.length
      ]


    if (
      isDesktop &&
      pattern.length === 1 &&
      pattern[0] === 1
    ) {

      const candidate =
        preparedImages[
          imageCursor
        ]


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
      pattern.reduce(
        (sum, count) =>
          sum + count,
        0
      )


    const remaining =
      preparedImages.length -
      imageCursor


    if (
      remaining <
      requiredImages
    ) {
      break
    }


    const bandImages =
      preparedImages.slice(
        imageCursor,
        imageCursor +
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
  photo,
  mobileSeed
) {
  const ratio =
    photo._meta.ratio

  const roll =
    mobileRoll(
      `${mobileSeed}-${photo.id}`
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
  preparedImages,
  mobileSeed
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
        current,
        mobileSeed
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
        next,
        mobileSeed
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
  onImageClick,
  mobileSeed
}) {

  const rows =
    useMemo(
      () =>
        buildMobileRows(
          images,
          mobileSeed
        ),
      [
        images,
        mobileSeed
      ]
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
                      photo.id
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
                      photo.id
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
                        photo.id
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
  onImageClick,
  desktopStartIndex
}) {

  const bands =
    useMemo(
      () =>
        buildWall(
          images,
          containerWidth,
          desktopStartIndex
        ),
      [
        images,
        containerWidth,
        desktopStartIndex
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
                          photo.id
                        }
                        className="relative w-full shrink-0 overflow-hidden cursor-zoom-in"
                        style={{
                          aspectRatio:
                            `${photo._meta.ratio}`
                        }}
                        onClick={() =>
                          onImageClick(
                            photo.id
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

  const desktopStartIndexRef =
    useRef(
      chooseDesktopStartIndex()
    )

  const mobileSeedRef =
    useRef(
      Math.floor(
        Math.random() *
        1000000000
      )
    )

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
            mobileSeed={
              mobileSeedRef.current
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
            desktopStartIndex={
              desktopStartIndexRef.current
            }
          />

        )

      )}

    </div>
  )
}


/* ---------------------------------------------------------
   PAGE
--------------------------------------------------------- */

export default function Page() {
  const [images, setImages] = useState([])
  const [nextPageToken, setNextPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loader, __loader] = useState(true)

  const [index, setIndex] = useState(-1)

  const wasCalled =
    useRef(false)


  /* -------------------------------------------------------
     LIGHTBOX SLIDES

     Important: slides remain in canonical Firebase / filename
     order even when the wall makes a tiny local visual swap.
  ------------------------------------------------------- */

  const slides =
    useMemo(
      () =>
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
              isWebm(photo)
            ) {
              return {
                type: 'tndr-webm',
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
              type: 'image',
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
        ),
      [images]
    )


  /* -------------------------------------------------------
     ORDERED IMAGE FETCH

     This is intentionally main-page's existing endpoint.
     Nothing here randomizes the catalog stream.
  ------------------------------------------------------- */

  const fetchImages =
    async token => {
      try {
        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-images`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json'
              },
              body:
                JSON.stringify({
                  lastVisibleDocId:
                    token
                })
            }
          )


        if (
          response.ok
        ) {
          const data =
            await response.json()


          const newImages =
            data.images || []


          if (
            newImages.length === 0
          ) {
            setHasMore(false)
            setNextPageToken(null)
            return
          }


          setImages(
            prevImages => {
              const existingNames =
                new Set(
                  prevImages.map(
                    img => img.name
                  )
                )


              const uniqueImages =
                newImages.filter(
                  img =>
                    !existingNames.has(
                      img.name
                    )
                )


              return [
                ...prevImages,
                ...uniqueImages
              ]
            }
          )


          if (
            !data.nextPageToken
          ) {
            setHasMore(false)
            setNextPageToken(null)
          } else {
            setNextPageToken(
              data.nextPageToken
            )
          }
        } else {
          console.error(
            'Failed to fetch images'
          )
          setHasMore(false)
        }
      } catch (err) {
        console.error(
          'Failed to fetch images:',
          err
        )
        setHasMore(false)
      } finally {
        __loader(false)
      }
    }


  /* -------------------------------------------------------
     LIGHTBOX CLICK

     The visual wall can locally nudge adjacent files, so we
     resolve the clicked image back to its canonical array index.
  ------------------------------------------------------- */

  const handleImageClick =
    imageId => {
      const idx =
        images.findIndex(
          img =>
            img.id === imageId
        )


      if (
        idx !== -1
      ) {
        setIndex(idx)
      }
    }


  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(
    () => {
      if (
        wasCalled.current
      ) {
        return
      }


      wasCalled.current =
        true


      __loader(true)
      fetchImages(null)
    },
    []
  )


  /* -------------------------------------------------------
     REMOVE LIGHTBOX CLOSE TITLE
  ------------------------------------------------------- */

  useEffect(
    () => {
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


      return () => {
        observer.disconnect()
      }
    },
    [slides]
  )


  /*
     LIGHTBOX INTERACTION

     Keep main's existing YARL rendering intact.
     Left-click almost anywhere closes, while right-click remains
     native and metadata stays selectable.
  */

  useEffect(
    () => {

      if (
        index < 0
      ) {
        return
      }


      const handleLightboxClick =
        event => {

          if (
            event.button !== 0
          ) {
            return
          }


          const target =
            event.target


          if (
            !(target instanceof Element)
          ) {
            return
          }


          const lightbox =
            target.closest(
              '.yarl__root'
            )


          if (!lightbox) {
            return
          }


          if (
            target.closest(
              '.yarl-slide-content, ' +
              '.yarl__slide_title, ' +
              '.yarl__slide_description, ' +
              'button, a, input, textarea, select, ' +
              '[role="button"], [contenteditable="true"]'
            )
          ) {
            return
          }


          setIndex(
            -1
          )
        }


      document.addEventListener(
        'click',
        handleLightboxClick,
        true
      )


      return () => {

        document.removeEventListener(
          'click',
          handleLightboxClick,
          true
        )
      }

    },
    [index]
  )


  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <RootLayout>
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center space-y-6">

          <Link
            href="/"
            className="block w-40"
          >
            <AnimatedLogo />
          </Link>


          <div className="flex gap-8 items-center">

            <Link href="/indx">
              <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
            </Link>


            <Link href="/ordr">
              <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
            </Link>


            <Link href="/rndm">
              <IoMdShuffle className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
            </Link>

          </div>
        </div>
      </div>


      {loader ? (

        <Loader />

      ) : (

        <div className="px-4 lg:px-16 pb-10">
          <InfiniteScroll
            dataLength={
              images.length
            }
            next={() =>
              fetchImages(
                nextPageToken
              )
            }
            hasMore={
              hasMore
            }
            loader={
              <MoreImageLoader />
            }
          >
            <TetrisWall
              images={
                images
              }
              onImageClick={
                handleImageClick
              }
            />
          </InfiniteScroll>
        </div>

      )}


      {!loader && (
        <Footer />
      )}


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
            slide:
              ({ slide, rect }) =>
                slide.type ===
                'tndr-webm'
                  ? (
                      <LightboxWebm
                        slide={
                          slide
                        }
                        rect={
                          rect
                        }
                      />
                    )
                  : undefined,

            slideFooter:
              ({ slide }) => (
                <div
                  className={cn(
                    "lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content select-text",
                    slide.type === 'tndr-webm' &&
                      'relative top-auto bottom-unset'
                  )}
                >
                  {slide.title && (
                    <div className="yarl__slide_title">
                      {slide.title}
                    </div>
                  )}


                  <div
                    className={cn(
                      '!space-y-0',
                      slide.director &&
                        '!mb-5'
                    )}
                  >
                    {slide.director && (
                      <div className="yarl__slide_description !text-[#99AABB]">
                        <span className="font-medium">
                          {slide.director}
                        </span>
                      </div>
                    )}


                    {slide.description && (
                      <div className="yarl__slide_description">
                        {slide.description}
                      </div>
                    )}
                  </div>
                </div>
              )
          }}
          />
        </>
      )}
    </RootLayout>
  )
}
