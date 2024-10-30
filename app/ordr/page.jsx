"use client";

import { IKImage } from "imagekitio-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { RxCaretSort } from "react-icons/rx";
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Footer from "../../components/Footer";
import MoreImageLoader from "../../components/MoreImageLoader/index";
import { TbClockUp } from "react-icons/tb";
import RootLayout from "../layout";
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../../components/loader/loader";

export default function Order() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const wasCalled = useRef(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loader, __loader] = useState(true);

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
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
          setHasMore(false); // Stop fetching if no more data
          return;
        }

        setNextPageToken(data.nextPageToken);
        setImages((prevImages) => [...prevImages, ...images]);
        const newSlides = images.map((photo) => {
          const width = 1080 * 4;
          const height = 1620 * 4;
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions,
          };
        });

        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
      } else {
        console.error("Failed to get files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
    __loader(false)
  };

  const sortImagesByYear = async () => {
    try {
      __loader(true); // Show loader

      // Wrap sorting in a Promise to simulate async behavior
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => {
          const yearA = parseInt(a.year);
          const yearB = parseInt(b.year);
          return yearB - yearA; // Sort descending by year
        });
        resolve(sorted);
      });

      setSorted(true); // Mark as sorted
      setImages(sortedImages); // Update state with sorted images

      // Update slides with sorted images
      setSlides(
        sortedImages.map((photo) => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
        }))
      );
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => {
        __loader(false);
      }, 3000);
    }
  };

  const sortImagesOldestFirst = async () => {
    try {
      __loader(true); // Show loader

      // Wrap sorting inside a Promise to simulate async behavior
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => {
          const yearA = parseInt(a.year);
          const yearB = parseInt(b.year);
          return yearA - yearB; // Sort in ascending order by year
        });
        resolve(sorted);
      });

      setSorted(false); // Mark as unsorted or sorted in oldest-first order
      setImages(sortedImages); // Update state with sorted images

      // Update slides with the sorted images
      setSlides(
        sortedImages.map((photo) => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
        }))
      );
    } catch (error) {
      console.error("Error sorting images:", error); // Handle errors gracefully
    } finally {
      setTimeout(() => {
        __loader(false);
      }, 3000);
    }
  };

  const sortImagesAlphabetically = async () => {
    try {
      __loader(true); // Show loader

      // Wrap sorting in a Promise to simulate async behavior
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => {
          const nameA = a.alphaname.toLowerCase();
          const nameB = b.alphaname.toLowerCase();
          return nameA.localeCompare(nameB); // Sort alphabetically
        });
        resolve(sorted);
      });

      setImages(sortedImages); // Update state with sorted images

      // Update slides with sorted images
      setSlides(
        sortedImages.map((photo) => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
        }))
      );
    } catch (error) {
      console.error("Error sorting images:", error); // Handle errors gracefully
    } finally {
      setTimeout(() => {
        __loader(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    
    __loader(true);
    getImages(nextPageToken);

    setSorted(true);
  });

  return (
    <RootLayout>
      {/* Navigation */}
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center space-y-6">
          <Link href={"/"}>
            <img
              src="/assets/logo.svg"
              className="object-contain w-40"
              alt=""
            />
          </Link>

          <div className="flex gap-8 items-center">
            <BsSortAlphaDown
              className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
              onClick={sortImagesAlphabetically}
            />

            <Link href={"/ordr"}>
              <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
            </Link>

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
        </div>
      </div>

      {!loader ? (
        <div className="px-4 lg:px-16 pb-10">
          <InfiniteScroll
            dataLength={Images.length}
            next={() => getImages(nextPageToken)}
            hasMore={hasMore}
            loader={<MoreImageLoader />}
            // endMessage={<p>You have seen it all!</p>}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map((photo, i) => (
                <div key={i}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className="aspect-[16/9] object-cover cursor-zoom-in"
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>

          {/* Lightbox Component */}
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
      ) : (
        <Loader />
      )}

      <Footer />
    </RootLayout>
  );
}
