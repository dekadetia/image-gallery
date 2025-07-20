"use client"; 

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";
import Video from 'yet-another-react-lightbox/plugins/video'
import Footer from "../../components/Footer";
import Fuse from 'fuse.js';
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown, TbClockUp } from "react-icons/tb";
import { RxCross1 } from "react-icons/rx";
import { FaMagnifyingGlass } from "react-icons/fa6";
import RootLayout from "../layout";
import Loader from "../../components/loader/loader";
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs) {
  return twMerge(clsx(inputs))
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
  // Search Input State
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-sorted-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lastVisibleDocId: token }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        if (images.length === 0) {
          setHasMore(false);
          return;
        }

        setNextPageToken(data.nextPageToken);
        console.log(images)
        setImages(images);

const newSlides = images.map((photo) => {
  const width = 1080 * 4;
  const height = 1620 * 4;

  if (photo.src.toLowerCase().includes('.webm')) {
    return {
      type: 'video',
      width,
      height,
      title: `${photo.caption}`,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year,
      sources: [{
        src: photo.src,
        type: 'video/webm'
      }],
      poster: '/assets/transparent.png',
      autoPlay: true,
      muted: true,
      loop: true,
      controls: false
    };
  } else {
    return {
      type: 'image',
      src: photo.src,
      width,
      height,
      title: `${photo.caption}`,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year
    };
  }
});


        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }

    __loader(false);
  };

  const sortImagesByYear = async () => {
    try {
      __loader(true);
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => parseInt(b.year) - parseInt(a.year));
        resolve(sorted);
      });

      setSorted(true);
      setImages(sortedImages);

      setSlides(sortedImages.map((photo) => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
      })));
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const sortImagesOldestFirst = async () => {
    try {
      __loader(true);
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => parseInt(a.year) - parseInt(b.year));
        resolve(sorted);
      });

      setSorted(false);
      setImages(sortedImages);

      setSlides(sortedImages.map((photo) => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
      })));
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const sortImagesAlphabetically = async () => {
    try {
      __loader(true);
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) =>
          a.alphaname.toLowerCase().localeCompare(b.alphaname.toLowerCase())
        );
        resolve(sorted);
      });

      setImages(sortedImages);

      setSlides(sortedImages.map((photo) => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
      })));
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  // Search Handling Functions
  const openLightboxByImage = (photo) => {
    const matchedIndex = slides.findIndex((slide) => slide.src === photo.src);
    if (matchedIndex !== -1) {
      setIndex(matchedIndex);
    }
  };

// 🔥 Strict years first, then hybrid search for others
const rawQuery = searchQuery.trim().toLowerCase();
const queryParts = rawQuery.split(/\s+/);

let filteredImages;

if (!rawQuery) {
  filteredImages = Images;
} else if (/^\d{4}$/.test(rawQuery)) {
  // 🎯 Exact 4-digit year (e.g., 1933)
  filteredImages = Images.filter(img => String(img.year) === rawQuery);
} else if (/^\d{3}$/.test(rawQuery) || /^\d{3}x$/.test(rawQuery) || /^\d{4}s$/.test(rawQuery)) {
  // 🎯 Decade queries (e.g., 193, 193x, 1930s → 1930–1939)
  const decadePrefix = rawQuery.slice(0, 3);
  filteredImages = Images.filter(img =>
    String(img.year).startsWith(decadePrefix)
  );
} else {
  // 🔥 Fuse for captions and alphaname
  const fuse = new Fuse(Images, {
    keys: [
      { name: 'caption', weight: 0.6 },
      { name: 'alphaname', weight: 0.4 }
    ],
    threshold: 0.3,
    distance: 200,
    includeScore: true
  });
  const fuseResults = fuse.search(rawQuery).map(r => r.item);

  // 🔥 Autocomplete for director and dimensions
  const autocompleteResults = Images.filter(img => {
    const dir = img.director?.toLowerCase() || '';
    const dim = img.dimensions?.slice(0, 6).toLowerCase() || '';

    return queryParts.every(part =>
      dir.split(/\s+/).some(word => word.startsWith(part)) ||
      dim.startsWith(part)
    );
  });

  // 🔥 Combine and deduplicate
  const seen = new Set();
  filteredImages = [...fuseResults, ...autocompleteResults].filter(img => {
    const key = img.src;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}




  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;

    __loader(true);
    getImages(nextPageToken);
  }, []);

// 🩹 MutationObserver to remove title="Close"
useEffect(() => {
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.yarl__button[title="Close"]').forEach(btn => {
            btn.removeAttribute('title');
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
}, []);
  
  // 🔥 Auto-focus search input when searchOpen becomes true
useEffect(() => {
  if (searchOpen && searchInputRef.current) {
    // Delay focus until after React has fully rendered the input
    setTimeout(() => {
      searchInputRef.current.focus();
    }, 0);
  }
}, [searchOpen]);

  return (
    <RootLayout>
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center">
          <Link href={"/"}>
            <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
          </Link>
          <div className="h-12 overflow-hidden w-full grid place-items-center !mt-[1rem] !mb-0">
            {
              searchOpen ? (
                // Showing Search Input
                <div className="w-full lg:w-[32.1%] flex justify-center mt-2 mb-6 px-4">
                  <div className="relative w-full">
<input
  ref={searchInputRef} // 👈 adds programmatic focus
  type="text"
  placeholder=""
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    // ⎋ Close search box on Escape key
    if (e.key === 'Escape') {
      searchInputRef.current.blur(); // optional: removes focus
      setSearchOpen(false);          // closes the search box
      setSearchQuery('');            // optional: clears text
    }
  }}
  className="w-full pl-1.5 pr-10 pt-[.45rem] pb-[.5rem] border-b border-b-white focus:outline-none text-sm bg-transparent"
/>

                    <div onClick={() => setSearchOpen(false)} className="cursor-pointer">
                      <RxCross1 className="absolute right-3 top-2.5 text-white" />
                    </div>
                  </div>
                </div>
                // Closed Search && showing navigation panel
              ) :
                <div className="flex gap-[2.3rem] items-center -mt-[2px]">
                  <BsSortAlphaDown
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                    onClick={sortImagesAlphabetically}
                  />

                  <div onClick={() => setSearchOpen(true)}>
                    <FaMagnifyingGlass className="cursor-pointer transition-all duration-200 hover:scale-105 text-xl" />
                  </div>

                  {!isSorted ? (
                    <TbClockDown
                      className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                      onClick={sortImagesByYear}
                    />
                  ) : (
                    <TbClockUp
                      className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                      onClick={sortImagesOldestFirst}
                    />
                  )}
                </div>
            }
          </div>
        </div>
      </div>

      {/* ✅ Search Bar */}
      <div className="px-4 lg:px-16 pb-10">
        {!loader ? (
          <div className="w-full columns-2 md:columns-3 lg:columns-4 space-y-3">
            {filteredImages.map((photo, i) => (
              <div
                className="cursor-pointer text-sm space-x-1"
                key={i}
                onClick={() => openLightboxByImage(photo)}
              >
                <h2 className="w-fit inline transition-all duration-200 hover:text-[#def] text-[#9ab]">
                  {photo.caption}
                </h2>
                <p className="inline w-fit text-[#678]">{photo.year}</p>
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
<div className={cn(
  "lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content",
  slide.type === 'video' && 'relative top-auto bottom-unset'
)}>
                  {slide.title && (
                    <div className="yarl__slide_title">{slide.title}</div>
                  )}
                  <div className={cn("!space-y-0", slide.director && "!mb-5")}>
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
              )
            }}
          />
        )}
      </div>

      {!loader && <Footer />}
    </RootLayout>
  );
}
