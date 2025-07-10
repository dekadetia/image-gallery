"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";

import Footer from "../../components/Footer";

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
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions,
            director: photo.director || null,
            year: photo.year
          };
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

  // ✅ Filtered images based on search input
  import Fuse from 'fuse.js';

const fuse = useMemo(() => new Fuse(Images, {
  keys: ['caption', 'alphaname', 'year', 'director'], // searchable fields
  threshold: 0.3,                                      // adjust fuzziness
  includeScore: true                                   // optional: relevance scores
}), [Images]);

const filteredImages = searchQuery
  ? fuse.search(searchQuery).map(result => result.item)
  : Images;

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;

    __loader(true);
    getImages(nextPageToken);
  }, []);

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
                      type="text"
                      placeholder=""
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
            render={{
              slideFooter: ({ slide }) => (
                <div className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content">
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
