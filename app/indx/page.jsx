"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Footer from "../../components/Footer";

import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown, TbClockUp } from "react-icons/tb";
import { RxCross1 } from "react-icons/rx";
import { FaMagnifyingGlass } from "react-icons/fa6";
import RootLayout from "../layout";
import Loader from "../../components/loader/loader";

export default function Index() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;
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
        setImages(images);

        const newSlides = images.map((photo) => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
        }));

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
  const filteredImages = Images.filter((photo) => {
    const query = searchQuery.toLowerCase();
    return (
      photo.caption?.toLowerCase().includes(query) ||
      photo.alphaname?.toLowerCase().includes(query) ||
      photo.year?.toString().includes(query)
    );
  });

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;

    __loader(true);
    getImages(nextPageToken);
  }, []);

  return (
    <RootLayout>
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center space-y-[1.65rem]">
          <Link href={"/"}>
            <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
          </Link>

          {
            searchOpen ? (
              // Showing Search Input
              <div className="w-[80%] lg:w-1/2 flex justify-center mt-2 mb-6 px-4">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Search by name, year, or caption..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-1.5 pr-10 py-2 border-b border-b-white focus:outline-none text-sm bg-transparent"
                  />
                  <div onClick={() => setSearchOpen(false)} className="cursor-pointer">
                    <RxCross1 className="absolute right-3 top-2.5 text-white" />
                  </div>
                </div>
              </div>
              // Closed Search && showing navigation panel
            ) :
              <div className="flex gap-[2.225rem] items-center">
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
            plugins={[Captions]}
            index={index}
            slides={slides}
            open={index >= 0}
            close={() => setIndex(-1)}
            captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
          />
        )}
      </div>

      {!loader && <Footer />}
    </RootLayout>
  );
}