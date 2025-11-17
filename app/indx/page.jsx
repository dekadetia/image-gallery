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

/* ---------- 🔥 CENTRALIZED SLIDE CREATOR ---------- */

function createSlide(photo) {
  const isWebm = photo.src.toLowerCase().endsWith(".webm");

  if (isWebm) {
    return {
      type: "video",
      title: photo.caption,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year,
      sources: [{ src: photo.src, type: "video/webm" }],
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
    width: 1080 * 4,
    height: 1620 * 4,
    title: photo.caption,
    description: photo.dimensions,
    director: photo.director || null,
    year: photo.year,
  };
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
      if (slide.type === "video") {
        return slide.sources[0].src === photo.src;
      }
      return slide.src === photo.src;
    });

    if (matchedIndex !== -1) setIndex(matchedIndex);
  };

  /* ---------- SEARCH ---------- */

  const rawQuery = searchQuery.trim().toLowerCase();
  const queryParts = rawQuery.split(/\s+/);
  let filteredImages;

  if (!rawQuery) {
    filteredImages = Images;
  } else if (/^\d{4}$/.test(rawQuery)) {
    filteredImages = Images.filter((img) => String(img.year) === rawQuery);
  } else if (
    /^\d{3}$/.test(rawQuery) ||
    /^\d{3}x$/.test(rawQuery) ||
    /^\d{4}s$/.test(rawQuery)
  ) {
    const prefix = rawQuery.slice(0, 3);
    filteredImages = Images.filter((img) =>
      String(img.year).startsWith(prefix)
    );
  } else {
    const fuse = new Fuse(Images, {
      keys: [
        { name: "caption", weight: 0.6 },
        { name: "alphaname", weight: 0.4 },
      ],
      threshold: 0.3,
      distance: 200,
      includeScore: true,
    });

    const fuseResults = fuse.search(rawQuery).map((r) => r.item);

    const acResults = Images.filter((img) => {
      const dir = img.director?.toLowerCase() || "";
      const dim = img.dimensions?.slice(0, 6).toLowerCase() || "";
      return queryParts.every(
        (part) =>
          dir.split(/\s+/).some((w) => w.startsWith(part)) ||
          dim.startsWith(part)
      );
    });

    const seen = new Set();
    filteredImages = [...fuseResults, ...acResults].filter((img) => {
      if (seen.has(img.src)) return false;
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
          <Lightbox
            index={index}
            slides={slides}
            open={index >= 0}
            close={() => setIndex(-1)}
            plugins={[Video]}
            render={{
              slideFooter: ({ slide }) => (
                <div
                  className={cn(
                    "lg:w-[96%] text-left text-sm space-y-1 pb-[1rem] text-white lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content",
                    slide.type === "video" &&
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
        )}
      </div>

      {!loader && <Footer />}
    </RootLayout>
  );
}
