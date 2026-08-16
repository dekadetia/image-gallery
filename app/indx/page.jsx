"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Footer from "../../components/Footer";
import Fuse from "fuse.js";
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown, TbClockUp } from "react-icons/tb";
import { RxCross1 } from "react-icons/rx";
import { FaMagnifyingGlass } from "react-icons/fa6";
import RootLayout from "../layout";
import Loader from "../../components/loader/loader";
import AnimatedLogo from "../../components/AnimatedLogo";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


/* ---------- LIGHTBOX GEOMETRY ---------- */

function parseImageMeta(dimensions) {
  const parts =
    dimensions
      ?.split("|")
      .map((part) => part.trim()) ?? [];

  const declaredRatio =
    parseFloat(parts[0]);

  const dimensionMatch =
    parts[1]?.match(
      /(\d+)\s*[×x]\s*(\d+)/i
    );

  const width =
    dimensionMatch
      ? Number(dimensionMatch[1])
      : null;

  const height =
    dimensionMatch
      ? Number(dimensionMatch[2])
      : null;

  const intrinsicRatio =
    width && height
      ? width / height
      : null;

  return {
    width,
    height,
    ratio:
      Number.isFinite(declaredRatio)
        ? declaredRatio
        : intrinsicRatio || 16 / 9,
  };
}


function LightboxWebm({
  slide,
  rect,
}) {
  const ratio =
    slide.width && slide.height
      ? slide.width / slide.height
      : 16 / 9;

  const isDesktop =
    rect.width >= 768;

  const maxWidth =
    rect.width *
    (isDesktop ? 0.96 : 1);

  const maxHeight =
    isDesktop
      ? Math.max(
          1,
          window.innerHeight - 160
        )
      : Math.max(
          1,
          rect.height
        );

  let width =
    maxWidth;

  let height =
    width / ratio;

  if (height > maxHeight) {
    height =
      maxHeight;

    width =
      height * ratio;
  }

  return (
    <div
      className="tndr-lightbox-webm-box"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        flex: "0 0 auto",
        position: "relative",
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


/* ---------- 🔥 CENTRALIZED SLIDE CREATOR ---------- */

function createSlide(photo) {
  const isWebm =
    photo.src
      .toLowerCase()
      .endsWith(".webm");

  const meta =
    parseImageMeta(
      photo.dimensions
    );

  const width =
    meta.width ||
    1920;

  const height =
    meta.height ||
    Math.round(
      width / meta.ratio
    );

  if (isWebm) {
    return {
      type: "tndr-webm",
      width,
      height,
      title: photo.caption,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year,
      sources: [
        {
          src: photo.src,
          type: "video/webm",
        },
      ],
      poster: "/assets/transparent.png",
      autoPlay: true,
      muted: true,
      loop: true,
      controls: false,
    };
  }

  return {
    type: "image",
    src: photo.src,
    width,
    height,
    title: photo.caption,
    description: photo.dimensions,
    director: photo.director || null,
    year: photo.year,
  };
}


function normalizeSearchText(value = "") {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/:/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export default function Index() {
  const searchInputRef = useRef(null);
  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const [loader, __loader] = useState(true);
  const wasCalled = useRef(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------- FETCH IMAGES ---------- */

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-sorted-images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastVisibleDocId: token }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        if (!images.length) {
          setHasMore(false);
          return;
        }

        setNextPageToken(data.nextPageToken);
        setImages(images);
        setSlides((prev) => [...prev, ...images.map(createSlide)]);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }

    __loader(false);
  };

  /* ---------- SORTING ---------- */

  const sortImagesByYear = async () => {
    try {
      __loader(true);
      const sorted = [...Images].sort(
        (a, b) => parseInt(b.year) - parseInt(a.year)
      );
      setSorted(true);
      setImages(sorted);
      setSlides(sorted.map(createSlide));
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const sortImagesOldestFirst = async () => {
    try {
      __loader(true);
      const sorted = [...Images].sort(
        (a, b) => parseInt(a.year) - parseInt(b.year)
      );
      setSorted(false);
      setImages(sorted);
      setSlides(sorted.map(createSlide));
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const sortImagesAlphabetically = async () => {
    try {
      __loader(true);
      const sorted = [...Images].sort((a, b) =>
        a.alphaname.toLowerCase().localeCompare(b.alphaname.toLowerCase())
      );
      setImages(sorted);
      setSlides(sorted.map(createSlide));
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  /* ---------- LIGHTBOX OPEN ---------- */

  const openLightboxByImage = (photo) => {
    const matchedIndex = slides.findIndex((slide) => {
      if (slide.type === "tndr-webm") {
        return slide.sources[0].src === photo.src;
      }
      return slide.src === photo.src;
    });

    if (matchedIndex !== -1) setIndex(matchedIndex);
  };

  /* ---------- SEARCH ---------- */

  const rawQuery =
    normalizeSearchText(
      searchQuery
    );

  const queryParts =
    rawQuery.split(/\s+/);

  let filteredImages;

  if (!rawQuery) {
    filteredImages =
      Images;
  } else if (/^\d{4}$/.test(rawQuery)) {
    filteredImages =
      Images.filter(
        (img) =>
          String(img.year) ===
          rawQuery
      );
  } else if (
    /^\d{3}$/.test(rawQuery) ||
    /^\d{3}x$/.test(rawQuery) ||
    /^\d{4}s$/.test(rawQuery)
  ) {
    const prefix =
      rawQuery.slice(0, 3);

    filteredImages =
      Images.filter((img) =>
        String(img.year)
          .startsWith(prefix)
      );
  } else {
    /*
      Keep /indx fully local.

      Fuse receives normalized shadow fields, but the original image
      objects are preserved and returned for rendering/lightbox use.
    */
    const searchableImages =
      Images.map((img) => ({
        ...img,
        _searchCaption:
          normalizeSearchText(
            img.caption
          ),
        _searchAlphaname:
          normalizeSearchText(
            img.alphaname
          ),
      }));

    const hasPlausibleTokenMatch =
      (text, part) => {
        const words =
          text.split(/\s+/);

        return words.some((word) => {
          if (
            word.startsWith(part) ||
            part.startsWith(word)
          ) {
            return true;
          }

          if (
            part.length < 4 ||
            word.length < 4
          ) {
            return false;
          }

          const maxDistance =
            part.length >= 7
              ? 2
              : 1;

          let previous =
            Array.from(
              { length: word.length + 1 },
              (_, i) => i
            );

          for (
            let i = 1;
            i <= part.length;
            i++
          ) {
            const current = [i];
            let rowMin = i;

            for (
              let j = 1;
              j <= word.length;
              j++
            ) {
              const cost =
                part[i - 1] ===
                word[j - 1]
                  ? 0
                  : 1;

              const value =
                Math.min(
                  current[j - 1] + 1,
                  previous[j] + 1,
                  previous[j - 1] + cost
                );

              current.push(value);
              rowMin =
                Math.min(
                  rowMin,
                  value
                );
            }

            if (rowMin > maxDistance) {
              return false;
            }

            previous = current;
          }

          return (
            previous[word.length] <=
            maxDistance
          );
        });
      };

    const plausibleImages =
      searchableImages.filter((img) => {
        const titleText =
          `${img._searchCaption} ${img._searchAlphaname}`.trim();

        return queryParts.every(
          (part) =>
            hasPlausibleTokenMatch(
              titleText,
              part
            )
        );
      });

    const fuse =
      new Fuse(
        plausibleImages,
        {
          keys: [
            {
              name:
                "_searchCaption",
              weight: 0.6,
            },
            {
              name:
                "_searchAlphaname",
              weight: 0.4,
            },
          ],
          threshold: 0.3,
          distance: 200,
          includeScore: true,
        }
      );

    const fuseResults =
      fuse
        .search(rawQuery)
        .map((r) => r.item);

    const acResults =
      Images.filter((img) => {
        const dir =
          normalizeSearchText(
            img.director
          );

        const dim =
          normalizeSearchText(
            img.dimensions
              ?.slice(0, 6) ||
            ""
          );

        return queryParts.every(
          (part) =>
            dir
              .split(/\s+/)
              .some(
                (w) =>
                  w.startsWith(
                    part
                  )
              ) ||
            dim.startsWith(part)
        );
      });

    const seen =
      new Set();

    filteredImages =
      [
        ...fuseResults,
        ...acResults,
      ].filter((img) => {
        if (seen.has(img.src)) {
          return false;
        }

        seen.add(img.src);
        return true;
      });
  }


  /* ---------- INITIAL FETCH ---------- */

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    __loader(true);
    getImages(nextPageToken);
  }, []);

  /* ---------- CLEANUP TITLE ATTRIBUTE ---------- */

  useEffect(() => {
    const obs = new MutationObserver(() => {
      document
        .querySelectorAll('.yarl__button[title="Close"]')
        .forEach((btn) => btn.removeAttribute("title"));
    });

    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  /* ---------- LIGHTBOX INTERACTION ---------- */

  useEffect(() => {
    if (index < 0) return;

    const handleLightboxClick = (event) => {
      if (event.button !== 0) return;

      const target =
        event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const lightbox =
        target.closest(
          ".yarl__root"
        );

      if (!lightbox) return;

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

      setIndex(-1);
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
  }, [index]);


  /* ---------- SEARCH AUTOFOCUS ---------- */

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 0);
    }
  }, [searchOpen]);

  /* ---------- RENDER ---------- */

  return (
    <RootLayout>
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center">
          <Link href="/">
            <div id="logo" className="w-40 h-auto cursor-pointer">
              <AnimatedLogo />
            </div>
          </Link>

          <div className="h-12 overflow-hidden w-full grid place-items-center mt-4 mb-0">
            {searchOpen ? (
              <div className="w-full lg:w-[32.1%] flex justify-center mt-2 mb-6 px-4">
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        searchInputRef.current.blur();
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    className="w-full pl-1.5 pr-10 pt-[.45rem] pb-[.5rem] border-b border-b-white focus:outline-none text-sm bg-transparent"
                  />
                  <div onClick={() => setSearchOpen(false)}>
                    <RxCross1 className="absolute right-3 top-2.5 text-white cursor-pointer" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-[2.3rem] items-center -mt-[2px]">
                <BsSortAlphaDown
                  className="cursor-pointer text-2xl"
                  onClick={sortImagesAlphabetically}
                />
                <FaMagnifyingGlass
                  className="cursor-pointer text-xl"
                  onClick={() => setSearchOpen(true)}
                />
                {!isSorted ? (
                  <TbClockDown
                    className="cursor-pointer text-2xl"
                    onClick={sortImagesByYear}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer text-2xl"
                    onClick={sortImagesOldestFirst}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-16 pb-10">
        {!loader ? (
          <div className="w-full columns-2 md:columns-3 lg:columns-4 space-y-3">
            {filteredImages.map((photo, i) => (
              <div
                key={i}
                className="cursor-pointer text-sm space-x-1"
                onClick={() => openLightboxByImage(photo)}
              >
                <h2 className="w-fit inline hover:text-[#def] text-[#9ab]">
                  {photo.caption}
                </h2>
                <p className="inline text-[#678]">{photo.year}</p>
              </div>
            ))}
          </div>
        ) : (
          <Loader />
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
              index={index}
              slides={slides}
              open={index >= 0}
              close={() => setIndex(-1)}
              plugins={[Video]}
              render={{
                slide: ({ slide, rect }) =>
                  slide.type === "tndr-webm" ? (
                    <LightboxWebm
                      slide={slide}
                      rect={rect}
                    />
                  ) : undefined,

                slideFooter: ({ slide }) => (
                  <div
                    className={cn(
                      "lg:w-[96%] text-left text-sm space-y-1 pb-[1rem] text-white lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content select-text",
                      slide.type === "tndr-webm" &&
                        "relative top-auto bottom-unset"
                    )}
                  >
                  {slide.title && (
                    <div className="yarl__slide_title">{slide.title}</div>
                  )}

                  <div className={cn("!space-y-0", slide.director && "!mb-5")}>
                    {slide.director && (
                      <div className="yarl__slide_description text-[#99AABB]">
                        <span className="font-medium">{slide.director}</span>
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
          </>
        )}
      </div>

      {!loader && <Footer />}
    </RootLayout>
  );
}
