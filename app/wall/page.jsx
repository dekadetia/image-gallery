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
   PACKING PATTERNS

   Desktop rhythm:

   - mostly 3 columns
   - occasional 4-column dense bands
   - occasional 2-column large bands
   - very rare full-width hero

   Each number is the number of vertically stacked images
   in that structural column.
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


const MOBILE_PATTERNS = [
  [1, 2],
  [2, 1]
]


function getPatterns(containerWidth) {
  if (containerWidth < 640) {
    return MOBILE_PATTERNS
  }

  if (containerWidth < 1024) {
    return TABLET_PATTERNS
  }

  return DESKTOP_SEQUENCE
}


/* ---------------------------------------------------------
   BUILD ONE BAND

   Every column in a band ends at exactly the same height.

   For any image:

   height = width / ratio

   For a stack:

   total height =
     width / ratio1
     + width / ratio2
     + ...
     + vertical gaps

   We solve the shared band height while accounting for all
   10px gutters.
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
   BUILD WALL

   Completed bands remain stable as more images load.

   Rare [1] patterns become full-width hero frames only when
   the next image is at least 1.85:1.

   If the candidate is narrower than 1.85, that hero slot
   becomes a normal [1, 2, 1] band instead.
--------------------------------------------------------- */

function buildWall(
  images,
  containerWidth
) {
  if (
    !containerWidth ||
    !images.length
  ) {
    return []
  }


  const preparedImages =
    images.map(image => ({
      ...image,

      _meta:
        parseImageMeta(
          image.dimensions
        )
    }))


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
      HERO RULE
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


    /*
      Don't render an incomplete final band.

      The leftover images wait for the next InfiniteScroll
      batch, which keeps everything already above them stable.
    */

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
   TETRIS WALL
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

      setContainerWidth(width)
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
    <div
      ref={wallRef}
      className="w-full overflow-hidden"
    >
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
    })


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


        {/* Tetris wall */}

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
