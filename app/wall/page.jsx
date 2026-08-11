'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Link from 'next/link'
import { IoMdShuffle } from 'react-icons/io'
import { RxDoubleArrowUp } from 'react-icons/rx'
import Footer from '../../components/Footer'
import RootLayout from '../layout'
import AnimatedLogo from '../../components/AnimatedLogo'
import MoreImageLoader from '../../components/MoreImageLoader'
import Loader from '../../components/loader/loader'
import InfiniteScroll from 'react-infinite-scroll-component'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const GAP = 10
const MOBILE_BREAKPOINT = 768


/* ---------------------------------------------------------
   METADATA

   Example:
   1.33:1 | 1436×1080 | 334 KB | WEBP
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
      intrinsicRatio ||
      declaredRatio ||
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

  if (availableImageWidth <= 0) {
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
          (sum, image) => {
            return (
              sum +
              1 / image._meta.ratio
            )
          },
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
      (sum, column) => {
        return (
          sum +
          1 / column.stackWeight
        )
      },
      0
    )


  const gapAdjustment =
    columns.reduce(
      (sum, column) => {
        return (
          sum +
          column.verticalGapHeight /
            column.stackWeight
        )
      },
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
    height: bandHeight,
    columns: solvedColumns
  }
}


/* ---------------------------------------------------------
   BUILD DESKTOP / TABLET WALL
--------------------------------------------------------- */

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
    let pattern =
      patterns[
        bandIndex %
        patterns.length
      ]


    /*
      DESKTOP HERO RULE

      [1] becomes full width only if the
      candidate is at least 1.85.
    */

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
      bands.push(band)
    }


    imageCursor +=
      requiredImages

    bandIndex += 1
  }


  return bands
}


/* ---------------------------------------------------------
   DETERMINISTIC MOBILE ROLL

   The same image gets the same mobile classification
   on every render.
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

   There are now ONLY TWO possibilities:

   FULL
     image gets its own row

   PAIR
     image is eligible to share a row with one other image


   > 1.85
     100% full

   > 1.70 through 1.85
     35% full
     65% pair

   <= 1.70
     15% full
     85% pair
--------------------------------------------------------- */

function getMobileSizeClass(
  photo
) {
  const ratio =
    photo._meta.ratio

  const roll =
    mobileRoll(photo.id)


  /*
    Wide formats always get the entire row.
  */

  if (ratio > 1.85) {
    return 'full'
  }


  /*
    1.71 through 1.85

    35% full
    65% pair
  */

  if (ratio > 1.70) {
    return (
      roll < 35
        ? 'full'
        : 'pair'
    )
  }


  /*
    1.70 and below

    15% full
    85% pair
  */

  return (
    roll < 15
      ? 'full'
      : 'pair'
  )
}


/* ---------------------------------------------------------
   MOBILE ROW BUILDER

   Maximum = TWO images per row.

   We preserve image order.

   A pair is made only when BOTH consecutive images
   are pair-eligible.

   Wide images can therefore never accidentally become
   small thumbnails.
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
      preparedImages[cursor]

    const currentClass =
      getMobileSizeClass(
        current
      )


    /*
      CURRENT IMAGE REQUIRES
      ITS OWN ROW
    */

    if (
      currentClass === 'full'
    ) {
      rows.push({
        type: 'full',
        images: [current]
      })

      cursor += 1

      continue
    }


    /*
      CURRENT IMAGE IS PAIR-ELIGIBLE.

      Look immediately at the next image.
    */

    const next =
      preparedImages[
        cursor + 1
      ]


    /*
      No next image yet.

      Render the final orphan full-width.
    */

    if (!next) {
      rows.push({
        type: 'full',
        images: [current]
      })

      cursor += 1

      continue
    }


    const nextClass =
      getMobileSizeClass(
        next
      )


    /*
      BOTH ARE PAIR-ELIGIBLE.

      Put exactly two images on this row.
    */

    if (
      nextClass === 'pair'
    ) {
      rows.push({
        type: 'pair',
        images: [
          current,
          next
        ]
      })

      cursor += 2

      continue
    }


    /*
      The next image requires full width.

      Don't reorder anything and don't force
      an inappropriate pairing.

      Current image gets its own row.
    */

    rows.push({
      type: 'full',
      images: [current]
    })

    cursor += 1
  }


  return rows
}


/* ---------------------------------------------------------
   SOLVE A MOBILE PAIR

   Both images have the same displayed height.

   Their native aspect ratios determine their widths.

   width = height × ratio

   Therefore:

   H =
     (container width - 10px gap)
     /
     (ratio1 + ratio2)

   This guarantees:

   - native AR for both
   - exactly 10px between them
   - row lands exactly on both outer edges
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
    images.map(image => ({
      ...image,

      _mobileWidth:
        height *
        image._meta.ratio
    }))


  return {
    height,
    images: solvedImages
  }
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

          /*
            FULL-WIDTH IMAGE
          */

          if (
            row.type === 'full'
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

                  {photo.src
                    ?.toLowerCase()
                    .includes(
                      '.webm'
                    ) ? (

                    <video
                      src={
                        photo.src
                      }
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster="/assets/transparent.png"
                      className="block w-full h-full object-contain"
                    />

                  ) : (

                    <img
                      alt={
                        photo.name
                      }
                      src={
                        photo.src
                      }
                      decoding="async"
                      className="block w-full h-full object-contain"
                    />

                  )}

                </div>

              </div>
            )
          }


          /*
            TWO-IMAGE ROW
          */

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

                    {photo.src
                      ?.toLowerCase()
                      .includes(
                        '.webm'
                      ) ? (

                      <video
                        src={
                          photo.src
                        }
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster="/assets/transparent.png"
                        className="block w-full h-full object-contain"
                      />

                    ) : (

                      <img
                        alt={
                          photo.name
                        }
                        src={
                          photo.src
                        }
                        decoding="async"
                        className="block w-full h-full object-contain"
                      />

                    )}

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

                        {photo.src
                          ?.toLowerCase()
                          .includes(
                            '.webm'
                          ) ? (

                          <video
                            src={
                              photo.src
                            }
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            poster="/assets/transparent.png"
                            className="block w-full h-full object-contain"
                          />

                        ) : (

                          <img
                            alt={
                              photo.name
                            }
                            src={
                              photo.src
                            }
                            decoding="async"
                            className="block w-full h-full object-contain"
                          />

                        )}

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

   < 768px:
     AR-aware mobile layout
     maximum 2 images per row

   >= 768px:
     existing Tetris layout
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
    if (!wallRef.current) {
      return
    }


    const measure = () => {
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
      ref={wallRef}
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


/* ---------------------------------------------------------
   PAGE
--------------------------------------------------------- */

export default function Tetris() {
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


  const wasCalled =
    useRef(false)

  const seenImageIds =
    useRef(new Set())


  /* -------------------------------------------------------
     LIGHTBOX SLIDES
  ------------------------------------------------------- */

  const slides =
    useMemo(
      () =>
        Images.map(photo => {
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
              .includes('.webm')
          ) {
            return {
              type: 'video',

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
              `${photo.caption}`,

            description:
              photo.dimensions,

            director:
              photo.director ||
              null,

            year:
              photo.year
          }
        }),
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
        __loader(true)
      }


      try {
        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
            {
              method: 'GET',

              headers: {
                'Content-Type':
                  'application/json'
              }
            }
          )


        if (response.ok) {
          const data =
            await response.json()

          const images =
            data.images


          const uniqueImages =
            images.filter(
              img =>
                !seenImageIds
                  .current
                  .has(img.id)
            )


          uniqueImages.forEach(
            img =>
              seenImageIds
                .current
                .add(img.id)
          )


          setImages(
            prev => [
              ...prev,
              ...uniqueImages
            ]
          )

        } else {
          console.error(
            'Failed to get files'
          )
        }

      } catch (error) {
        console.log(error)

      } finally {
        __loader(false)
      }
    }


  /* -------------------------------------------------------
     SHUFFLE
  ------------------------------------------------------- */

  const getRandmImages =
    async () => {

      __loader(true)

      setImages([])

      seenImageIds.current =
        new Set()


      try {
        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
            {
              method: 'GET',

              headers: {
                'Content-Type':
                  'application/json'
              }
            }
          )


        if (response.ok) {
          const data =
            await response.json()

          const images =
            data.images


          images.forEach(
            img =>
              seenImageIds
                .current
                .add(img.id)
          )


          setImages(images)

        } else {
          console.error(
            'Failed to get files'
          )
        }

      } catch (error) {
        console.log(error)

      } finally {
        __loader(false)
      }
    }


  /* -------------------------------------------------------
     LIGHTBOX
  ------------------------------------------------------- */

  const handleCloseLightbox =
    () => {
      setIndex(-1)
    }


  const handleImageClick =
    imageId => {

      const idx =
        Images.findIndex(
          img =>
            img.id ===
            imageId
        )


      if (idx !== -1) {
        setIndex(idx)
      }
    }


  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      wasCalled.current
    ) {
      return
    }


    wasCalled.current =
      true


    getImages()
  }, [])


  /* -------------------------------------------------------
     REMOVE LIGHTBOX CLOSE TITLE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!slides.length) {
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
  }, [slides])


  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <RootLayout>

      <div className="px-4 lg:px-16 pb-10">

        {/* Navigation */}

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


              <Link href="/scrl">

                <RxDoubleArrowUp
                  className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle"
                />

              </Link>


              <IoMdShuffle
                onClick={
                  getRandmImages
                }
                className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle ml-[3.75px]"
              />

            </div>

          </div>

        </div>


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
            hasMore={true}
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
                      "lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content",

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
                        "!space-y-0",

                        slide.director &&
                          "!mb-5"
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


      {!loader && (
        <Footer />
      )}

    </RootLayout>
  )
}
