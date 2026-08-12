'use client'

import {
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react'

import {
  motion,
  AnimatePresence
} from 'framer-motion'

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
   DECLARED AR KEY

   Individual Fade slot replacements must match this
   EXACT declared category.

   Examples:

   1.33
   1.37
   1.85
   2.39
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

  /*
    Fallback only for malformed metadata.
  */

  return String(
    Number(
      meta.ratio
    ).toFixed(2)
  )
}


/* =========================================================
   EXACT OLD-FADE STAGE HEIGHT

   Original desktop Fade:

   3 columns
   3 rows
   16:9 cells
   10px gaps

   Width remains responsive exactly as old Fade did.

   Height is derived from that width and NEVER from the
   current Tetris geometry.
========================================================= */

function getFadeStageHeight(
  width
) {
  if (!width) {
    return 0
  }


  const tileWidth =
    (
      width -
      GAP * 2
    ) /
    3


  const tileHeight =
    tileWidth /
    (16 / 9)


  return (
    tileHeight * 3 +
    GAP * 2
  )
}


/* =========================================================
   WALL CONFIGURATIONS

   Every configuration consumes exactly 9 slots.
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


  return {
    height:
      bandHeight,

    columns:
      solvedColumns
  }
}


/* =========================================================
   BUILD NATURAL TETRIS GEOMETRY

   This geometry always consumes full WIDTH.

   Its natural HEIGHT may be larger or smaller than the
   fixed old-Fade stage. We do NOT globally scale it.
========================================================= */

function buildWallLayout(
  wall,
  containerWidth
) {
  if (
    !wall ||
    !containerWidth ||
    wall.slots.length !== 9
  ) {
    return {
      rects: [],
      height: 0
    }
  }


  const rects =
    Array(9).fill(null)


  let slotCursor = 0
  let currentY = 0


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
              index
            ) => ({
              slotIndex:
                slotCursor +
                index,

              frameRatio:
                slot.frameRatio
            })
          )


      const solved =
        solveBand(
          bandItems,
          pattern,
          containerWidth
        )


      if (!solved) {
        return
      }


      let currentX = 0


      solved.columns.forEach(
        column => {

          let columnY =
            currentY


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


      currentY +=
        solved.height


      if (
        bandIndex <
        wall.configuration
          .length -
          1
      ) {
        currentY += GAP
      }


      slotCursor +=
        count
    }
  )


  return {
    rects,
    height:
      currentY
  }
}


/* =========================================================
   CREATE WALL OBJECT

   Each slot records the declared AR of the image that
   establishes its geometry.

   Future individual replacements MUST match ratioKey.
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
   WALL LAYER

   The natural Tetris gets centered vertically inside the
   invariant old-Fade stage.

   If taller than the stage, the excess is clipped equally
   from top and bottom.

   If shorter, blank stage space is shared top and bottom.

   WIDTH IS NEVER SCALED.
   HEIGHT IS NEVER SCALED.
========================================================= */

function WallLayer({
  wall,
  containerWidth,
  stageHeight,
  onImageClick
}) {
  const layout =
    useMemo(
      () =>
        buildWallLayout(
          wall,
          containerWidth
        ),
      [
        wall,
        containerWidth
      ]
    )


  if (
    !wall ||
    !containerWidth ||
    !stageHeight
  ) {
    return null
  }


  const offsetY =
    (
      stageHeight -
      layout.height
    ) /
    2


  return (
    <div
      className="absolute inset-0 overflow-hidden"
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


          if (!rect) {
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
                  `${
                    rect.y +
                    offsetY
                  }px`,

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

              <FadeSlot
                image={
                  slot.image
                }
              />

            </div>
          )
        }
      )}

    </div>
  )
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function FadeGallery() {

  const [
    activeWall,
    setActiveWall
  ] = useState(null)


  const [
    outgoingWall,
    setOutgoingWall
  ] = useState(null)


  const poolRef =
    useRef([])


  /*
    WebMs arriving too soon wait here.
  */

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


  const wallFadeCleanupRef =
    useRef(null)


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
     STAGE MEASUREMENT
  ------------------------------------------------------- */

  const galleryRef =
    useRef(null)


  const [
    containerWidth,
    setContainerWidth
  ] = useState(0)


  useEffect(() => {

    const element =
      galleryRef.current


    if (!element) {
      return
    }


    const measure =
      () => {

        const width =
          element
            .getBoundingClientRect()
            .width


        if (
          width > 0
        ) {
          setContainerWidth(
            width
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

  }, [
    loader,
    blackMode
  ])


  const stageHeight =
    useMemo(
      () =>
        getFadeStageHeight(
          containerWidth
        ),
      [
        containerWidth
      ]
    )


  /* =======================================================
     FETCH RAW IMAGES
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

        const res =
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-fade-images`
          )


        const data =
          await res.json()


        const images =
          data.images ||
          []


        if (
          images.length
        ) {

          poolRef.current.push(
            ...images
          )


          /*
            Lightbox inventory gets every fetched image.
          */

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

      } catch (err) {

        console.error(
          'Failed to fetch fade images:',
          err
        )

      } finally {

        loadingRef.current =
          false

      }
    }


  /* =======================================================
     WEBM-SPACED STREAM
  ======================================================= */

  const pullNextImage =
    () => {

      /*
        Eligible queued WebM gets first priority.
      */

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
     PULL IMAGE OF A PARTICULAR AR

     This is the key slot-swap fix.

     We search the pool for an image with exactly the same
     declared AR category as the slot.

     Other images remain available for future use.
  ======================================================= */

  const pullMatchingImage =
    async ratioKey => {

      /*
        We may need more than one fetch if the requested
        AR happens to be sparse in the current pool.
      */

      for (
        let attempt = 0;
        attempt < 6;
        attempt++
      ) {

        /*
          First scan existing raw pool.

          We deliberately DON'T call pullNextImage here,
          because that would consume unrelated ARs.
        */

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


          /*
            Respect WebM spacing.
          */

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

              /*
                Don't use this WebM yet.
                Keep searching for a still of this AR.
              */

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


          /*
            Matching still.
          */

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


        /*
          Nothing appropriate in current pool.
        */

        await fetchImages()
      }


      return null
    }


  /* =======================================================
     GET N STREAM IMAGES FOR A FRESH WALL
  ======================================================= */

  const getImagesForWall =
    async count => {

      const result = []


      let attempts = 0


      while (
        result.length <
          count &&
        attempts <
          30
      ) {

        let image =
          pullNextImage()


        if (!image) {

          await fetchImages()


          image =
            pullNextImage()
        }


        if (image) {

          result.push(
            image
          )
        }


        attempts++
      }


      return result
    }


  /* =======================================================
     CONFIGURATION CHOICE
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
     CREATE WHOLE NEW TETRIS
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

          setActiveWall(
            wall
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
     SLOT SELECTION
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

     SAME AR ONLY.
========================================================= */

  useEffect(() => {

    if (!activeWall) {
      return
    }


    slotTimerRef.current =
      setInterval(
        async () => {

          const slotIndex =
            pickSlot()


          /*
            Read current slot's frozen ratio category.
          */

          const currentSlot =
            activeWall.slots[
              slotIndex
            ]


          if (!currentSlot) {
            return
          }


          const replacement =
            await pullMatchingImage(
              currentSlot.ratioKey
            )


          if (!replacement) {

            /*
              Sparse AR category.
              Just skip this cycle rather than introducing
              the wrong geometry.
            */

            return
          }


          setActiveWall(
            previous => {

              if (!previous) {
                return previous
              }


              const slots =
                previous.slots.map(
                  (
                    slot,
                    index
                  ) => {

                    if (
                      index !==
                      slotIndex
                    ) {
                      return slot
                    }


                    /*
                      frameRatio + ratioKey remain unchanged.
                    */

                    return {
                      ...slot,

                      image:
                        replacement
                    }
                  }
                )


              return {
                ...previous,
                slots
              }
            }
          )

        },
        SLOT_CHANGE_INTERVAL
      )


    return () => {

      clearInterval(
        slotTimerRef.current
      )

    }

  }, [
    activeWall?.id
  ])


  /* =======================================================
     WHOLE WALL CHANGE

     New geometry is allowed ONLY here.

     Both old and new Tetris live inside exactly the same
     invariant old-Fade stage.
  ======================================================= */

  useEffect(() => {

    if (!activeWall) {
      return
    }


    wallTimerRef.current =
      setInterval(
        async () => {

          const newWall =
            await createNewWall()


          if (!newWall) {
            return
          }


          /*
            Snapshot outgoing wall.
          */

          setOutgoingWall(
            activeWall
          )


          /*
            Install next wall.
          */

          setActiveWall(
            newWall
          )


          clearTimeout(
            wallFadeCleanupRef
              .current
          )


          wallFadeCleanupRef
            .current =
            setTimeout(
              () => {

                setOutgoingWall(
                  null
                )

              },
              WALL_FADE_DURATION *
                1000 +
                250
            )

        },
        WALL_CHANGE_INTERVAL
      )


    return () => {

      clearInterval(
        wallTimerRef.current
      )

      clearTimeout(
        wallFadeCleanupRef
          .current
      )

    }

  }, [
    activeWall?.id
  ])


  /* =======================================================
     BLACK MODE
  ======================================================= */

  const toggleBlackMode =
    async () => {

      if (!blackMode) {

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

          } catch (err) {

            console.warn(
              'Fullscreen request failed:',
              err
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

          } catch (err) {

            console.warn(
              'Exiting fullscreen failed:',
              err
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


      activityTimerRef
        .current =
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

    if (!blackMode) {
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


        cursorTimerRef
          .current =
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

      } else {

        console.warn(
          'Image clicked but no slide found for:',
          imageSrc
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


      {/* X */}

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

            {/*

              THIS IS THE INVARIANT STAGE.

              Its width is exactly the width old Fade would use.

              Its height is exactly the height old Fade's
              3x3 16:9 grid would use at that width.

              It never changes because of Tetris geometry.

            */}

            <div
              ref={
                galleryRef
              }
              className="relative w-full overflow-hidden"
              style={{
                height:
                  `${stageHeight}px`
              }}
            >

              {/* Outgoing configuration */}

              <AnimatePresence>

                {outgoingWall && (

                  <motion.div
                    key={
                      `outgoing-${outgoingWall.id}`
                    }
                    className="absolute inset-0 overflow-hidden"
                    initial={{
                      opacity:
                        1
                    }}
                    animate={{
                      opacity:
                        0
                    }}
                    exit={{
                      opacity:
                        0
                    }}
                    transition={{
                      duration:
                        WALL_FADE_DURATION,

                      ease:
                        'easeInOut'
                    }}
                  >

                    <WallLayer
                      wall={
                        outgoingWall
                      }
                      containerWidth={
                        containerWidth
                      }
                      stageHeight={
                        stageHeight
                      }
                      onImageClick={
                        handleImageClick
                      }
                    />

                  </motion.div>

                )}

              </AnimatePresence>


              {/* Active configuration */}

              {activeWall && (

                <motion.div
                  key={
                    `active-${activeWall.id}`
                  }
                  className="absolute inset-0 overflow-hidden"
                  initial={{
                    opacity:
                      outgoingWall
                        ? 0
                        : 1
                  }}
                  animate={{
                    opacity:
                      1
                  }}
                  transition={{
                    duration:
                      outgoingWall
                        ? WALL_FADE_DURATION
                        : 0,

                    ease:
                      'easeInOut'
                  }}
                >

                  <WallLayer
                    wall={
                      activeWall
                    }
                    containerWidth={
                      containerWidth
                    }
                    stageHeight={
                      stageHeight
                    }
                    onImageClick={
                      handleImageClick
                    }
                  />

                </motion.div>

              )}

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


/* =========================================================
   INDIVIDUAL FADE SLOT
========================================================= */

function FadeSlot({
  image
}) {

  const [
    currentImage,
    setCurrentImage
  ] = useState(
    image
  )


  const [
    previousImage,
    setPreviousImage
  ] = useState(
    null
  )


  useEffect(() => {

    if (
      !image ||
      !image.src ||
      image.id ===
        currentImage?.id
    ) {
      return
    }


    if (
      isWebm(
        image
      )
    ) {

      const preload =
        document.createElement(
          'video'
        )


      preload.src =
        image.src


      preload.preload =
        'metadata'


      preload.muted =
        true


      preload.playsInline =
        true


      preload.onloadeddata =
        () => {

          setPreviousImage(
            currentImage
          )


          setCurrentImage(
            image
          )
        }

    } else {

      const preload =
        new Image()


      preload.src =
        image.src


      preload.onload =
        () => {

          setPreviousImage(
            currentImage
          )


          setCurrentImage(
            image
          )
        }
    }

  }, [
    image?.id
  ])


  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* Outgoing */}

      {previousImage && (

        isWebm(
          previousImage
        ) ? (

          <motion.video
            key={
              `previous-${previousImage.id}`
            }
            src={
              previousImage.src
            }
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/transparent.png"
            initial={{
              opacity:
                1
            }}
            animate={{
              opacity:
                0
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />

        ) : (

          <motion.img
            key={
              `previous-${previousImage.id}`
            }
            src={
              previousImage.src
            }
            initial={{
              opacity:
                1
            }}
            animate={{
              opacity:
                0
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />

        )

      )}


      {/* Incoming */}

      {currentImage && (

        isWebm(
          currentImage
        ) ? (

          <motion.video
            key={
              `current-${currentImage.id}`
            }
            src={
              currentImage.src
            }
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/transparent.png"
            initial={{
              opacity:
                previousImage
                  ? 0
                  : 1
            }}
            animate={{
              opacity:
                1
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />

        ) : (

          <motion.img
            key={
              `current-${currentImage.id}`
            }
            src={
              currentImage.src
            }
            initial={{
              opacity:
                previousImage
                  ? 0
                  : 1
            }}
            animate={{
              opacity:
                1
            }}
            transition={{
              duration:
                SLOT_FADE_DURATION,

              ease:
                'easeInOut'
            }}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />

        )

      )}

    </div>
  )
}
