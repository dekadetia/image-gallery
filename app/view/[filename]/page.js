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

  const requestedFileRef =
    useRef(null);

  const slides =
    useMemo(
      () =>
        files.map(
          createSlide
        ),
      [files]
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

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
     LOAD DIRECT FILE + CANONICAL FILENAME-ORDERED CATALOG

     The exact requested file is still fetched directly so a
     standalone /view/ remains anchored to the URL target.

     In parallel, load the same canonical name-ascending
     catalog used by the site. Once available, locate the
     requested filename and hand the complete ordered sequence
     to YARL so navigation works naturally in both directions.
  ------------------------------------------------------- */

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

      requestedFileRef.current =
        filename;

      const loadView =
        async () => {
          try {
            const [
              exactResponse,
              catalogResponse,
            ] =
              await Promise.all([
                fetch(
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
                ),

                fetch(
                  `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images`,
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body:
                      JSON.stringify({}),
                  }
                ),
              ]);

            if (
              !exactResponse.ok
            ) {
              throw new Error(
                "Image not found"
              );
            }

            if (
              !catalogResponse.ok
            ) {
              throw new Error(
                "Catalog not found"
              );
            }

            const [
              exactData,
              catalogData,
            ] =
              await Promise.all([
                exactResponse.json(),
                catalogResponse.json(),
              ]);

            if (
              cancelled
            ) {
              return;
            }

            if (
              !exactData?.file?.src
            ) {
              throw new Error(
                "Invalid image response"
              );
            }

            const catalog =
              Array.isArray(
                catalogData?.images
              )
                ? catalogData.images
                : [];

            const requestedIndex =
              catalog.findIndex(
                file =>
                  file.name ===
                  filename
              );

            if (
              requestedIndex === -1
            ) {
              /*
                Defensive fallback: the direct file exists but
                is unexpectedly absent from the catalog response.
              */
              setFiles([
                exactData.file,
              ]);

              setIndex(0);
            } else {
              setFiles(
                catalog
              );

              setIndex(
                requestedIndex
              );
            }
          } catch (error) {
            if (
              !cancelled
            ) {
              console.error(
                "Failed to load /view/ image sequence:",
                error
              );

              setFailed(
                true
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
            }
          }
        };

      loadView();

      return () => {
        cancelled =
          true;
      };
    },
    [filename]
  );


  /* -------------------------------------------------------
     VIEW CHANGE

     Keep React synchronized with YARL and mirror the active
     filename in the address bar without asking Next to mount
     another standalone route.
  ------------------------------------------------------- */

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
        !file?.name
      ) {
        return;
      }

      requestedFileRef.current =
        file.name;

      window.history.replaceState(
        window.history.state,
        "",
        `/view/${encodeURIComponent(
          file.name
        )}`
      );
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
