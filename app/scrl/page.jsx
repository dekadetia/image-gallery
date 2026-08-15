'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Link from 'next/link'
import { IoMdShuffle } from 'react-icons/io'
import { RxDoubleArrowUp, RxCross1 } from 'react-icons/rx'
import { IoMoonOutline } from 'react-icons/io5'
import Footer from '../../components/Footer'
import RootLayout from '../layout'
import AnimatedLogo from '../../components/AnimatedLogo'
import MoreImageLoader from '../../components/MoreImageLoader'
import Loader from '../../components/loader/loader'
import InfiniteScroll from 'react-infinite-scroll-component'
import AudioPlayer from '../../components/AudioPlayer'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const GAP = 10
const MOBILE_BREAKPOINT = 768

const WEBM_INTERVAL = 20
const MIN_IMAGES_BETWEEN_WEBMS =
  WEBM_INTERVAL - 1


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

  SCRL previously always began at DESKTOP_SEQUENCE[0], which is
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
      buildBand(
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

export default function Scrl2() {

  const [
    index,
    setIndex
  ] = useState(-1)

  const [
    Images,
    setImages
  ] = useState([])

  const [
    loader,
    __loader
  ] = useState(true)

  const [
    autosMode,
    setAutosMode
  ] = useState(false)

  const [
    hideCursor,
    setHideCursor
  ] = useState(false)

  const [
    showControls,
    setShowControls
  ] = useState(false)


  const scrollRafRef =
    useRef(null)

  const cursorTimerRef =
    useRef(null)

  const activityTimerRef =
    useRef(null)

  const wasCalled =
    useRef(false)

  const seenImageIds =
    useRef(
      new Set()
    )


  /*
    WebMs that arrive before they're eligible
    wait here rather than being discarded.
  */

  const pendingWebmsRef =
    useRef([])


  /*
    Start at 19 so the first WebM is immediately eligible.
  */

  const imagesSinceWebmRef =
    useRef(
      MIN_IMAGES_BETWEEN_WEBMS
    )


  /* -------------------------------------------------------
     WEBM SPACING

     After a WebM is emitted, 19 other images must pass
     before the next WebM may enter the visible stream.

     Early WebMs remain queued rather than being discarded.
     The state persists across InfiniteScroll fetches.
  ------------------------------------------------------- */

  const applyWebmSpacing =
    incomingImages => {

      const output = []


      const flushPendingWebm =
        () => {

          if (
            pendingWebmsRef
              .current
              .length === 0
          ) {
            return false
          }


          if (
            imagesSinceWebmRef
              .current <
            MIN_IMAGES_BETWEEN_WEBMS
          ) {
            return false
          }


          const nextWebm =
            pendingWebmsRef
              .current
              .shift()


          output.push(
            nextWebm
          )


          imagesSinceWebmRef
            .current = 0


          return true
        }


      for (
        const image of
        incomingImages
      ) {

        /*
          Give an older queued WebM priority once
          it becomes eligible.
        */

        flushPendingWebm()


        if (
          isWebm(image)
        ) {

          if (
            pendingWebmsRef
              .current
              .length === 0 &&
            imagesSinceWebmRef
              .current >=
              MIN_IMAGES_BETWEEN_WEBMS
          ) {

            output.push(
              image
            )


            imagesSinceWebmRef
              .current = 0

          } else {

            pendingWebmsRef
              .current
              .push(
                image
              )

          }


          continue
        }


        /*
          Normal still image.
        */

        output.push(
          image
        )


        imagesSinceWebmRef
          .current =
            Math.min(
              MIN_IMAGES_BETWEEN_WEBMS,

              imagesSinceWebmRef
                .current +
                1
            )


        /*
          If this was the 19th intervening image,
          an older queued WebM may follow it now.
        */

        flushPendingWebm()
      }


      return output
    }


  /* -------------------------------------------------------
     RESET WEBM STREAM

     Shuffle starts a completely fresh Wall stream.
  ------------------------------------------------------- */

  const resetWebmSpacing =
    () => {

      pendingWebmsRef
        .current = []


      imagesSinceWebmRef
        .current =
        MIN_IMAGES_BETWEEN_WEBMS
    }


  /* -------------------------------------------------------
     LIGHTBOX SLIDES
  ------------------------------------------------------- */

  const slides =
    useMemo(
      () =>
        Images.map(
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
              isWebm(photo)
            ) {

              return {
                type:
                  'video',

                width,
                height,

                title:
                  `${photo.caption}`,

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
                `${photo.caption}`,

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
      [Images]
    )


  /* -------------------------------------------------------
     GET IMAGES
  ------------------------------------------------------- */

  const getImages =
    async load => {

      if (
        load !==
        'load more'
      ) {
        __loader(
          true
        )
      }


      try {

        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
            {
              method:
                'GET',

              headers: {
                'Content-Type':
                  'application/json'
              }
            }
          )


        if (
          response.ok
        ) {

          const data =
            await response.json()


          const images =
            data.images


          const uniqueImages =
            images.filter(
              img =>
                !seenImageIds
                  .current
                  .has(
                    img.id
                  )
            )


          uniqueImages.forEach(
            img =>
              seenImageIds
                .current
                .add(
                  img.id
                )
          )


          const spacedImages =
            applyWebmSpacing(
              uniqueImages
            )


          if (
            spacedImages.length
          ) {

            setImages(
              prev => [
                ...prev,
                ...spacedImages
              ]
            )
          }

        } else {

          console.error(
            'Failed to get files'
          )

        }

      } catch (error) {

        console.log(
          error
        )

      } finally {

        __loader(
          false
        )

      }
    }


  /* -------------------------------------------------------
     SHUFFLE
  ------------------------------------------------------- */

  const getRandmImages =
    async () => {

      __loader(
        true
      )


      setImages(
        []
      )


      seenImageIds.current =
        new Set()


      resetWebmSpacing()


      try {

        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
            {
              method:
                'GET',

              headers: {
                'Content-Type':
                  'application/json'
              }
            }
          )


        if (
          response.ok
        ) {

          const data =
            await response.json()


          const images =
            data.images


          images.forEach(
            img =>
              seenImageIds
                .current
                .add(
                  img.id
                )
          )


          const spacedImages =
            applyWebmSpacing(
              images
            )


          setImages(
            spacedImages
          )

        } else {

          console.error(
            'Failed to get files'
          )

        }

      } catch (error) {

        console.log(
          error
        )

      } finally {

        __loader(
          false
        )

      }
    }


  /* -------------------------------------------------------
     LIGHTBOX
  ------------------------------------------------------- */

  const handleCloseLightbox =
    () => {

      setIndex(
        -1
      )
    }


  const handleImageClick =
    imageId => {

      const idx =
        Images.findIndex(
          img =>
            img.id ===
            imageId
        )


      if (
        idx !== -1
      ) {

        setIndex(
          idx
        )
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


      getImages()

    },
    []
  )


  /* -------------------------------------------------------
     AUTO SCROLL

     Time-based so the visual speed stays consistent even
     when video decode or layout work causes frame drops.
  ------------------------------------------------------- */

  useEffect(
    () => {

      if (
        loader
      ) {
        return
      }


      const isFirefox =
        typeof navigator !== 'undefined' &&
        /firefox/i.test(
          navigator.userAgent
        )


      const speed =
        isFirefox ? 120 : 60


      let last =
        performance.now()


      let cancelled =
        false


      const step =
        now => {

          if (
            cancelled
          ) {
            return
          }


          const dt =
            now - last


          last =
            now


          window.scrollBy(
            0,
            (speed * dt) / 1000
          )


          if (
            window.scrollY +
              window.innerHeight >=
            document.body.scrollHeight - 2
          ) {

            window.scrollTo(
              0,
              0
            )


            last =
              performance.now()
          }


          scrollRafRef.current =
            requestAnimationFrame(
              step
            )
        }


      let settleFrame1 =
        null


      let settleFrame2 =
        null


      settleFrame1 =
        requestAnimationFrame(
          () => {

            settleFrame2 =
              requestAnimationFrame(
                () => {

                  if (
                    cancelled
                  ) {
                    return
                  }


                  last =
                    performance.now()


                  scrollRafRef.current =
                    requestAnimationFrame(
                      step
                    )
                }
              )
          }
        )


      return () => {

        cancelled =
          true


        if (
          settleFrame1
        ) {
          cancelAnimationFrame(
            settleFrame1
          )
        }


        if (
          settleFrame2
        ) {
          cancelAnimationFrame(
            settleFrame2
          )
        }


        if (
          scrollRafRef.current
        ) {

          cancelAnimationFrame(
            scrollRafRef.current
          )
        }
      }
    },
    [loader]
  )


  /* -------------------------------------------------------
     AUTOS MODE CONTROLS
  ------------------------------------------------------- */

  const handleUserActivity =
    () => {

      clearTimeout(
        activityTimerRef.current
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


  useEffect(
    () => {

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
    },
    []
  )


  useEffect(
    () => {

      if (
        !autosMode
      ) {
        return
      }


      document.body.classList.add(
        'autosmode'
      )


      if (
        document.documentElement
          .requestFullscreen &&
        !document.fullscreenElement
      ) {

        document.documentElement
          .requestFullscreen()
          .catch(
            err => {

              console.warn(
                'Fullscreen request failed:',
                err
              )
            }
          )
      }


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

        document.body.classList.remove(
          'autosmode'
        )


        if (
          document.fullscreenElement &&
          document.exitFullscreen
        ) {

          document
            .exitFullscreen()
            .catch(
              err => {

                console.warn(
                  'Exiting fullscreen failed:',
                  err
                )
              }
            )
        }


        clearTimeout(
          cursorTimerRef.current
        )

        window.removeEventListener(
          'mousemove',
          handleMouseMove
        )
      }
    },
    [autosMode]
  )


  useEffect(
    () => {

      if (
        hideCursor &&
        autosMode
      ) {

        document.body.classList.add(
          'blackmode-hide-cursor'
        )

      } else {

        document.body.classList.remove(
          'blackmode-hide-cursor'
        )
      }


      return () => {

        document.body.classList.remove(
          'blackmode-hide-cursor'
        )
      }
    },
    [hideCursor, autosMode]
  )


  const toggleAutosMode =
    async () => {

      if (
        !autosMode
      ) {

        document.body.style.backgroundColor =
          '#000000'


        if (
          document.documentElement
            .requestFullscreen &&
          !document.fullscreenElement
        ) {

          try {

            await document.documentElement
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
          document.fullscreenElement &&
          document.exitFullscreen
        ) {

          try {

            await document
              .exitFullscreen()

          } catch (err) {

            console.warn(
              'Exiting autosMode failed:',
              err
            )
          }
        }
      }


      setAutosMode(
        !autosMode
      )
    }


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
          childList:
            true,

          subtree:
            true
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

     Keep SCRL's existing YARL rendering intact.
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


          handleCloseLightbox()
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

      {/* AutosMode toggle */}

      {!autosMode && (

        <motion.button
          onClick={
            toggleAutosMode
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
          className="fixed top-4 right-4 text-2xl z-50 cursor-pointer text-white"
          aria-label="Enter AutosMode"
        >

          <IoMoonOutline />

        </motion.button>

      )}


      {autosMode && (

        <motion.button
          onClick={
            toggleAutosMode
          }
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity:
              showControls ? 1 : 0,

            scale:
              showControls ? 1 : 0.95
          }}
          whileHover={{
            opacity: 1
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut'
          }}
          className="fixed top-4 right-4 text-2xl z-50 cursor-pointer text-white"
          aria-label="Exit AutosMode"
        >

          <RxCross1 />

        </motion.button>

      )}


      <div className={autosMode ? 'w-full z-50' : 'px-4 lg:px-16 pb-10'}>

        {/* Navigation */}

        {!autosMode && (

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

              <Link href="/fade">

                <img
                  src="/assets/crossfade.svg"
                  className="w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 align-middle mr-[3.75px]"
                  alt=""
                />

              </Link>


              <RxDoubleArrowUp
                className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle"
              />


              <Link href="/rndm">

                <IoMdShuffle
                  className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle ml-[3.75px]"
                />

              </Link>

            </div>

          </div>

          </div>

        )}


        {/* Responsive wall */}

        {loader ? (

          <Loader />

        ) : (

          <InfiniteScroll
            dataLength={
              Images.length
            }
            next={() =>
              getImages(
                'load more'
              )
            }
            hasMore={
              true
            }
            loader={
              <MoreImageLoader />
            }
          >

            <TetrisWall
              images={
                Images
              }
              onImageClick={
                handleImageClick
              }
            />

          </InfiniteScroll>

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
            close={
              handleCloseLightbox
            }
            plugins={[
              Video
            ]}
            render={{
              slideFooter:
                ({
                  slide
                }) => (

                  <div
                    className={cn(
                      "lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content select-text",

                      slide.type ===
                        'video' &&
                        'relative top-auto bottom-unset'
                    )}
                  >

                    {slide.title && (

                      <div className="yarl__slide_title">

                        {
                          slide.title
                        }

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

      </div>


      {autosMode && (

        <AudioPlayer
          blackMode={
            autosMode
          }
          showControls={
            showControls
          }
        />

      )}


      {!loader &&
        !autosMode && (

          <Footer />

        )}

    </RootLayout>
  )
}
