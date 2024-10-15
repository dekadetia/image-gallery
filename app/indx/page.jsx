"use client";

import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Footer from "../../components/Footer";
import MoreImageLoader from "../../components/MoreImageLoader/index";

import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import { TbClockUp } from "react-icons/tb";
import { IoMdList } from "react-icons/io";
// import { successToast, errorToast } from "../../utils/toast";
import RootLayout from "../layout";


export default function Index() {
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

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-sorted-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pageToken: token }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        setNextPageToken(data.nextPageToken);
        if (!data.nextPageToken) {
          console.log('nul found ',data.nextPageToken )
          setHasMore(false);
          // successToast("All images have been loaded!");
          setNextPageToken(null);
          return;
        }else{
          setImages((prevImages) => {
            const existingNames = new Set(prevImages.map((img) => img.name));
            const newImages = images.filter(
              (img) => !existingNames.has(img.name)
            );
            return [...prevImages, ...newImages];
          });
          setNextPageToken(data.nextPageToken);
        }

        // successToast("Detais fetched successfully!");
        if (images.length === 0) {
          setHasMore(false);
          return;
        }
      } else {
        errorToast("Failed to get files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      // errorToast("Failed to get files");
    }
  };

  const sortImagesByYear = () => {
    const sortedImages = [...Images].sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearB - yearA; // descending order Sort (newest first)
    });
    setSorted(true);
    setImages(sortedImages);
  };

  const sortImagesOldestFirst = () => {
    const sortedImages = [...Images].sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearA - yearB; // ascending order Sort (oldest first)
    });

    setSorted(false);
    setImages(sortedImages);
  };

  const sortImagesAlphabetically = () => {
    const sortedImages = [...Images].sort((a, b) => {
      const nameA = a.alphaname.toLowerCase(); // Convert to lowercase for case-insensitive sorting
      const nameB = b.alphaname.toLowerCase();
      return nameA.localeCompare(nameB); // Sort alphabetically (A to Z)
    });

    setImages(sortedImages);
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
  });

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
        <InfiniteScroll
          dataLength={Images.length}
          next={() => getImages(nextPageToken)}
          hasMore={hasMore}
          loader={<MoreImageLoader />}
          endMessage={<p className="text-center bg-gray-600 p-2 mt-4">You have seen it all!</p>}
        >
          <div className="w-full columns-2 md:columns-3 lg:columns-4 space-y-3">
            {Images.map((photo, i) => {
              return (
                <div
                  className="cursor-pointer text-sm space-x-1"
                  key={i}
                  onClick={() => getFile(photo, i)}
                >
                  <h2 className="w-fit inline transition-all duration-200 hover:text-[#def] text-[#9ab]">
                    {photo.caption}
                  </h2>
                  <p className="inline w-fit text-[#678]">{photo.year}</p>
                </div>
              );
            })}
          </div>
        </InfiniteScroll>

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
