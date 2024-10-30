"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Footer from "../../components/Footer";

import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import { TbClockUp } from "react-icons/tb";
import { IoMdList } from "react-icons/io";
// import { successToast, errorToast } from "../../utils/toast";
import RootLayout from "../layout";
import MoreImageLoader from "../../components/MoreImageLoader";
import InfiniteScroll from "react-infinite-scroll-component";

export default function Index() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const [loader, __loader] = useState(false);
  const wasCalled = useRef(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const getImages = async (token) => {
    try {
      __loader(true);
      // const response = await fetch(
      //   `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-sorted-images`,
      //   {
      //     method: "GET",
      //   }
      // );

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
          setHasMore(false); // Stop fetching if no more data
          return;
        }

        setNextPageToken(data.nextPageToken);
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
          };
        });

        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
        successToast("Detais fetched successfully!");
      } else {
        errorToast("Failed to get files");
      }

      __loader(false);
    } catch (error) {
      console.error("Error fetching files:", error);
      __loader(false);
      // errorToast("Failed to get files");
    }
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
      }, 1500);
    }
  };

  const sortImagesOldestFirst = async () => {
    try {
      __loader(true); // Show loader

      // Wrap sorting in a Promise to simulate async behavior
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
    } catch (error) {
      console.error("Error sorting images:", error); // Handle errors gracefully
    } finally {
      setTimeout(() => {
        __loader(false);
      }, 1500);
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
      }, 1500);
    }
  };

  const getFile = async (file, index) => {
    setIndex(index);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-single-image`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ file: file.name }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newSlides = [
          {
            src: data.file.src,
            width: 1080 * 4,
            height: 1620 * 4,
            title: data.file.caption,
            description: data.file.dimensions,
          },
        ];

        setSlides(newSlides);
        setIndex(index);
      } else {
        errorToast("Failed to get file");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      errorToast("Failed to get file");
    }
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    getImages(nextPageToken);
  }, []);

  return (
    <RootLayout>
      {/* Navigation */}
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center space-y-[1.65rem]">
          <Link href={"/"}>
            <img
              src="/assets/logo.svg"
              className="object-contain w-40"
              alt=""
            />
          </Link>

          <div className="flex gap-[2.225rem] items-center">
            <BsSortAlphaDown
              className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
              onClick={sortImagesAlphabetically}
            />

            <Link href={"/indx"}>
              <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
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

      <div className="px-4 lg:px-16 pb-10">
        {/* <InfiniteScroll
          dataLength={Images.length}
          next={() => getImages(nextPageToken)}
          hasMore={hasMore}
          loader={<MoreImageLoader />}
          endMessage={<p>You have seen it all!</p>}
        > */}
          {!loader ? (
            <div className="w-full columns-2 md:columns-3 lg:columns-4 space-y-3">
              {Images.map((photo, i) => {
                return (
                  <div
                    className="cursor-pointer text-sm space-x-1"
                    key={i}
                    onClick={() => setIndex(i)}
                  >
                    <h2 className="w-fit inline transition-all duration-200 hover:text-[#def] text-[#9ab]">
                      {photo.caption}
                    </h2>
                    <p className="inline w-fit text-[#678]">{photo.year}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <MoreImageLoader />
          )}
        {/* </InfiniteScroll> */}

        {/* Lightbox Component */}
        {slides && (
          <div>
            <Lightbox
              plugins={[Captions]}
              index={index}
              slides={slides}
              open={index >= 0}
              close={() => setIndex(-1)}
              captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
            />
          </div>
        )}
      </div>

      <Footer />
    </RootLayout>
  );
}
