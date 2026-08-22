"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";

import RootLayout from "../../layout";
import Loader from "../../../components/loader/loader";


/* ---------------------------------------------------------
   MEDIA TYPE
--------------------------------------------------------- */

function isWebm(file) {
  return (
    file?.name
      ?.toLowerCase()
      .endsWith(".webm") ||
    file?.src
      ?.toLowerCase()
      .includes(".webm") ||
    false
  );
}


/* ---------------------------------------------------------
   IMAGE METADATA

   Mirrors the working lightbox geometry used on the
   existing pages.
--------------------------------------------------------- */

function parseImageMeta(dimensions) {
  const parts =
    dimensions
      ?.split("|")
      .map(
        part =>
          part.trim()
      ) ?? [];

  const declaredRatio =
    parseFloat(
      parts[0]
    );

  const dimensionMatch =
    parts[1]?.match(
      /(\d+)\s*[×x]\s*(\d+)/i
    );

  const width =
    dimensionMatch
      ? Number(
          dimensionMatch[1]
        )
      : null;

  const height =
    dimensionMatch
      ? Number(
          dimensionMatch[2]
        )
      : null;

  const intrinsicRatio =
    width &&
    height
      ? width / height
      : null;

  return {
    width,
    height,

    ratio:
      Number.isFinite(
        declaredRatio
      )
        ? declaredRatio
        : intrinsicRatio ||
          16 / 9,
  };
}


/* ---------------------------------------------------------
   WEBM LIGHTBOX RENDERER

   Same fixed-geometry approach used by the existing pages.
--------------------------------------------------------- */

function LightboxWebm({
  slide,
  rect,
}) {
  const ratio =
    slide.width &&
    slide.height
      ? slide.width /
        slide.height
      : 16 / 9;

  const isDesktop =
    rect.width >= 768;

  const maxWidth =
    rect.width *
    (
      isDesktop
        ? 0.96
        : 1
    );

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
        );

  let width =
    maxWidth;

  let height =
    width /
    ratio;

  if (
    height >
    maxHeight
  ) {
    height =
      maxHeight;

    width =
      height *
      ratio;
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
          "0 0 auto",

        position:
          "relative",

        margin:
          isDesktop
            ? "26px auto 0"
            : "0 auto",
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
  );
}


/* ---------------------------------------------------------
   CREATE ONE YARL SLIDE
--------------------------------------------------------- */

function createSlide(file) {
  const meta =
    parseImageMeta(
      file.dimensions
    );

  const width =
    meta.width ||
    1920;

  const height =
    meta.height ||
    Math.round(
      width /
      meta.ratio
    );

  if (
    isWebm(file)
  ) {
    return {
      type:
        "tndr-webm",

      width,

      height,

      title:
        file.caption,

      description:
        file.dimensions,

      director:
        file.director ||
        null,

      year:
        file.year,

      sources: [
        {
          src:
            file.src,

          type:
            "video/webm",
        },
      ],

      poster:
        "/assets/transparent.png",

      autoPlay:
        true,

      muted:
        true,

      loop:
        true,

      controls:
        false,
    };
  }

  return {
    type:
      "image",

    src:
      file.src,

    width,

    height,

    title:
      file.caption,

    description:
      file.dimensions,

    director:
      file.director ||
      null,

    year:
      file.year,
  };
}


/* ---------------------------------------------------------
   PAGE
--------------------------------------------------------- */

export default function ViewPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const filename =
    typeof params?.filename ===
    "string"
      ? params.filename
      : "";

  const [
    files,
    setFiles,
  ] = useState([]);

  const [
    index,
    setIndex,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const beforeCursorRef =
    useRef(null);

  const afterCursorRef =
    useRef(null);

  const hasMoreBeforeRef =
    useRef(true);

  const hasMoreAfterRef =
    useRef(true);

  const beforeFetchInFlightRef =
    useRef(false);

  const afterFetchInFlightRef =
    useRef(false);

  const slides =
    useMemo(
      () =>
        files.map(
          createSlide
        ),
      [files]
    );

  const [
    failed,
    setFailed,
  ] = useState(false);


  /* -------------------------------------------------------
     CLOSE

     A standalone /view/ visit has no genuine page beneath
     it. Closing therefore goes directly to the homepage.
  ------------------------------------------------------- */

  const handleClose =
    () => {
      router.push("/");
    };


  /* -------------------------------------------------------
     DIRECT FILE + BIDIRECTIONAL WINDOW
  ------------------------------------------------------- */

  const fetchWindow =
    async (
      cursor,
      direction,
      pageSize = 30
    ) => {
      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-images`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                pageSize,
                lastVisibleDocId:
                  cursor,
                direction,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `Failed to fetch ${direction} view batch`
        );
      }

      return response.json();
    };


  const prependPreviousBatch =
    async () => {
      if (
        beforeFetchInFlightRef.current ||
        !hasMoreBeforeRef.current ||
        !beforeCursorRef.current
      ) {
        return;
      }

      beforeFetchInFlightRef.current =
        true;

      try {
        const data =
          await fetchWindow(
            beforeCursorRef.current,
            "before"
          );

        const incoming =
          Array.isArray(
            data?.images
          )
            ? data.images
            : [];

        if (
          !incoming.length
        ) {
          hasMoreBeforeRef.current =
            false;
          return;
        }

        setFiles(
          current => {
            const existing =
              new Set(
                current.map(
                  file =>
                    file.name
                )
              );

            const uniqueIncoming =
              incoming.filter(
                file =>
                  !existing.has(
                    file.name
                  )
              );

            if (
              !uniqueIncoming.length
            ) {
              hasMoreBeforeRef.current =
                false;
              return current;
            }

            setIndex(
              currentIndex =>
                currentIndex +
                uniqueIncoming.length
            );

            return [
              ...uniqueIncoming,
              ...current,
            ];
          }
        );

        beforeCursorRef.current =
          incoming[0]?.id ||
          null;

        if (
          incoming.length <
          30
        ) {
          hasMoreBeforeRef.current =
            false;
        }
      } catch (error) {
        console.error(
          "Failed to prepend /view/ images:",
          error
        );
      } finally {
        beforeFetchInFlightRef.current =
          false;
      }
    };


  const appendNextBatch =
    async () => {
      if (
        afterFetchInFlightRef.current ||
        !hasMoreAfterRef.current ||
        !afterCursorRef.current
      ) {
        return;
      }

      afterFetchInFlightRef.current =
        true;

      try {
        const data =
          await fetchWindow(
            afterCursorRef.current,
            "after"
          );

        const incoming =
          Array.isArray(
            data?.images
          )
            ? data.images
            : [];

        if (
          !incoming.length
        ) {
          hasMoreAfterRef.current =
            false;
          return;
        }

        setFiles(
          current => {
            const existing =
              new Set(
                current.map(
                  file =>
                    file.name
                )
              );

            const uniqueIncoming =
              incoming.filter(
                file =>
                  !existing.has(
                    file.name
                  )
              );

            if (
              !uniqueIncoming.length
            ) {
              hasMoreAfterRef.current =
                false;
              return current;
            }

            return [
              ...current,
              ...uniqueIncoming,
            ];
          }
        );

        afterCursorRef.current =
          incoming[
            incoming.length - 1
          ]?.id ||
          null;

        if (
          incoming.length <
          30
        ) {
          hasMoreAfterRef.current =
            false;
        }
      } catch (error) {
        console.error(
          "Failed to append /view/ images:",
          error
        );
      } finally {
        afterFetchInFlightRef.current =
          false;
      }
    };


  useEffect(
    () => {
      if (
        !filename
      ) {
        setFailed(true);
        setLoading(false);
        return;
      }

      let cancelled =
        false;

      const loadFile =
        async () => {
          try {
            const response =
              await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-view-image`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      file:
                        filename,
                    }),
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                "Image not found"
              );
            }

            const data =
              await response.json();

            if (
              cancelled
            ) {
              return;
            }

            if (
              !data?.file?.src ||
              !data?.file?.id
            ) {
              throw new Error(
                "Invalid image response"
              );
            }

            const directFile =
              data.file;

            beforeCursorRef.current =
              directFile.id;

            afterCursorRef.current =
              directFile.id;

            hasMoreBeforeRef.current =
              true;

            hasMoreAfterRef.current =
              true;

            const [
              beforeData,
              afterData,
            ] =
              await Promise.all([
                fetchWindow(
                  directFile.id,
                  "before"
                ),

                fetchWindow(
                  directFile.id,
                  "after"
                ),
              ]);

            if (
              cancelled
            ) {
              return;
            }

            const beforeFiles =
              Array.isArray(
                beforeData?.images
              )
                ? beforeData.images
                : [];

            const afterFiles =
              Array.isArray(
                afterData?.images
              )
                ? afterData.images
                : [];

            setFiles([
              ...beforeFiles,
              directFile,
              ...afterFiles,
            ]);

            setIndex(
              beforeFiles.length
            );

            beforeCursorRef.current =
              beforeFiles[0]?.id ||
              directFile.id;

            afterCursorRef.current =
              afterFiles[
                afterFiles.length - 1
              ]?.id ||
              directFile.id;

            hasMoreBeforeRef.current =
              beforeFiles.length >=
              30;

            hasMoreAfterRef.current =
              afterFiles.length >=
              30;

            setLoading(
              false
            );
          } catch (error) {
            if (
              !cancelled
            ) {
              console.error(
                "Failed to load /view/ image:",
                error
              );

              setFailed(
                true
              );

              setLoading(
                false
              );
            }
          }
        };

      loadFile();

      return () => {
        cancelled =
          true;
      };
    },
    [filename]
  );


  const handleView =
    ({
      index:
        nextIndex,
    }) => {
      setIndex(
        nextIndex
      );

      const file =
        files[nextIndex];

      if (
        file?.name
      ) {
        History.prototype.replaceState.call(
          window.history,
          window.history.state,
          "",
          `/view/${encodeURIComponent(
            file.name
          )}`
        );
      }

      const EDGE_THRESHOLD =
        10;

      if (
        nextIndex <=
        EDGE_THRESHOLD
      ) {
        prependPreviousBatch();
      }

      if (
        nextIndex >=
        files.length -
          1 -
          EDGE_THRESHOLD
      ) {
        appendNextBatch();
      }
    };

  /* -------------------------------------------------------
     REMOVE YARL CLOSE TITLE

     Preserves the existing site's lightbox treatment.
  ------------------------------------------------------- */

  useEffect(
    () => {
      if (
        !slides.length
      ) {
        return;
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
                  button.removeAttribute(
                    "title"
                  );
                }
              );
          }
        );

      observer.observe(
        document.body,
        {
          childList:
            true,

          subtree:
            true,
        }
      );

      return () => {
        observer.disconnect();
      };
    },
    [slides.length]
  );


  /* -------------------------------------------------------
     LEFT-CLICK OUTSIDE CONTENT CLOSES

     Mirrors the current homepage behavior.
  ------------------------------------------------------- */

  useEffect(
    () => {
      if (
        !slides.length
      ) {
        return;
      }

      const handleLightboxClick =
        event => {
          if (
            event.button !== 0
          ) {
            return;
          }

          const target =
            event.target;

          if (
            !(
              target instanceof
              Element
            )
          ) {
            return;
          }

          const lightbox =
            target.closest(
              ".yarl__root"
            );

          if (
            !lightbox
          ) {
            return;
          }

          if (
            target.closest(
              ".yarl-slide-content, " +
              ".yarl__slide_title, " +
              ".yarl__slide_description, " +
              "button, a, input, textarea, select, " +
              '[role="button"], [contenteditable="true"]'
            )
          ) {
            return;
          }

          handleClose();
        };

      document.addEventListener(
        "click",
        handleLightboxClick,
        true
      );

      return () => {
        document.removeEventListener(
          "click",
          handleLightboxClick,
          true
        );
      };
    },
    [slides.length]
  );


  /* -------------------------------------------------------
     LOADING

     Use the site's normal page background while the
     single image is being retrieved. The black lightbox
     does not appear until the slide is ready.
  ------------------------------------------------------- */

  if (
    loading
  ) {
    return (
      <RootLayout>
        <div className="fixed inset-0">
          <Loader />
        </div>
      </RootLayout>
    );
  }


  /* -------------------------------------------------------
     FAILURE
  ------------------------------------------------------- */

  if (
    failed ||
    !slides.length
  ) {
    return (
      <RootLayout>
        <div
          className="fixed inset-0 bg-black cursor-pointer"
          onClick={
            handleClose
          }
        />
      </RootLayout>
    );
  }


  /* -------------------------------------------------------
     STANDALONE VIEWER
  ------------------------------------------------------- */

  return (
    <RootLayout>
      <div className="fixed inset-0">

        <style jsx global>{`

          .yarl__slide .tndr-lightbox-webm-box {
            box-sizing:
              border-box;
          }

          .yarl__slide video.tndr-lightbox-webm {
            position:
              absolute !important;

            inset:
              0 !important;

            width:
              100% !important;

            max-width:
              100% !important;

            height:
              100% !important;

            max-height:
              100% !important;

            object-fit:
              contain !important;

            display:
              block !important;

            margin:
              0 !important;
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
            true
          }

          close={
            handleClose
          }

          on={{
            view:
              handleView
          }}

          plugins={[
            Video
          ]}

          carousel={{
            finite:
              true,
          }}

          render={{

            slide:
              ({
                slide,
                rect,
              }) =>
                slide.type ===
                "tndr-webm"
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
              ({
                slide,
              }) => (

                <div
                  className={
                    "lg:!w-[96%] text-left text-sm space-y-1 " +
                    "lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] " +
                    "text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] " +
                    "lg:pr-[3rem] yarl-slide-content select-text " +
                    (
                      slide.type ===
                      "tndr-webm"
                        ? "relative top-auto bottom-unset"
                        : ""
                    )
                  }
                >

                  {slide.title && (

                    <div className="yarl__slide_title">
                      {slide.title}
                    </div>

                  )}


                  <div
                    className={
                      "!space-y-0 " +
                      (
                        slide.director
                          ? "!mb-5"
                          : ""
                      )
                    }
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
              ),
          }}
        />

      </div>
    </RootLayout>
  );
}
