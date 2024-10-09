"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Footer from "../../components/Footer";
import Loader from "../../components/loader/loader";

import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import { TbClockUp } from "react-icons/tb";
import { IoMdList } from "react-icons/io";
import { successToast, errorToast } from "../../utils/toast";
import RootLayout from "../layout";
import { AiOutlinePlus } from "react-icons/ai";

export default function Index() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [skeleton, setSkeleton] = useState(false);
  const [Images, setImages] = useState([]);
  const wasCalled = useRef(false);
  const [nextPageToken, setNextPageToken] = useState(null);

  const getImages = async (token) => {
    setSkeleton(true);

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
        setImages((prevImages) => [...prevImages, ...images]);

        setSkeleton(false);
        successToast('Detais fetched successfully!');
      } else {
        errorToast('Failed to get files')
        setSkeleton(false);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      errorToast('Failed to get files')
      setSkeleton(false);
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
    setSlides(
      sortedImages.map((photo) => {
        const width = 1080 * 4;
        const height = 1620 * 4;
        return {
          src: photo.src,
          width,
          height,
          title: `${photo.caption}`,
          description: photo.dimensions,
        };
      })
    );
  };

  const sortImagesOldestFirst = () => {
    const sortedImages = [...Images].sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearA - yearB; // ascending order Sort (oldest first)
    });

    setSorted(false);
    setImages(sortedImages);
    setSlides(
      sortedImages.map((photo) => {
        const width = 1080 * 4;
        const height = 1620 * 4;
        return {
          src: photo.src,
          width,
          height,
          title: `${photo.caption}`,
          description: photo.dimensions,
        };
      })
    );
  };

  const sortImagesAlphabetically = () => {
    const sortedImages = [...Images].sort((a, b) => {
      const nameA = a.alphaname.toLowerCase(); // Convert to lowercase for case-insensitive sorting
      const nameB = b.alphaname.toLowerCase();
      return nameA.localeCompare(nameB); // Sort alphabetically (A to Z)
    });

    setImages(sortedImages);
    setSlides(
      sortedImages.map((photo) => {
        const width = 1080 * 4;
        const height = 1620 * 4;
        return {
          src: photo.src,
          width,
          height,
          title: `${photo.caption}`,
          description: photo.dimensions,
        };
      })
    );
  };

  const getFile = async (file, index) => {

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-single-image`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ file: file.name })
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
          }
        ];

        setSlides(newSlides);
        setIndex(index);
      } else {
        errorToast('Failed to get file')
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      errorToast('Failed to get file')
    }
  }

  const moreImagesLoadHandler = () => {
    if (nextPageToken) {
      getImages(nextPageToken);
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

        {/* Skeleton */}
        {skeleton && <Loader />}

        {/* Lightbox Component */}
        {slides && (
          <Lightbox
            plugins={[Captions]}
            index={index}
            slides={slides}
            open={index >= 0}
            close={() => setIndex(-1)}
            captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
            render={{
              buttonPrev: () => null,
              buttonNext: () => null,
            }}
          />
        )}
      </div>

      <div
        className="grid place-items-center text-[24px] my-10"
        onClick={moreImagesLoadHandler}
      >
        <AiOutlinePlus className="cursor-pointer transition-all duration-300 hover:opacity-80 text-white hover:bg-gray-500" />
      </div>

      {!skeleton && <Footer />}
    </RootLayout>
  );
}
