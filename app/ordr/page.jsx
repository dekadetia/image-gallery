"use client";

import { IKImage } from 'imagekitio-react';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { RxCaretSort } from "react-icons/rx";
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Footer from "../../components/Footer";
import Loader from "../../components/loader/loader";
import { TbClockUp } from "react-icons/tb";
import RootLayout from "../layout";
import { AiOutlinePlus } from "react-icons/ai";

export default function Order() {
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
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
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
        setSkeleton(false);
      } else {
        console.error("Failed to get files");
        setSkeleton(false);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setSkeleton(false);
    }
  };

  const sortImagesByYear = () => {
    const sortedImages = [...Images].sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearB - yearA;
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
      return yearA - yearB;
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
      const nameA = a.alphaname.toLowerCase();
      const nameB = b.alphaname.toLowerCase();
      return nameA.localeCompare(nameB);
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

  const moreImagesLoadHandler = () => {
    if (nextPageToken) {
      getImages(nextPageToken);
    }
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    getImages(nextPageToken);
    setSorted(true);
  }, []);

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

      <div className="px-4 lg:px-16 pb-10">


        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
          {Images.map((photo, i) => (
            <IKImage
              urlEndpoint={`${process.env.NEXT_PUBLIC_IMAGE_OPTIMIZE_URL}`}
              src={photo.src}
              transformation={[{ height: 100, width: 100, quality: 10 }]}
              lqip={{ active: true, quality: 10 }}
              onClick={() => setIndex(i)}
              className="aspect-[16/9] object-cover cursor-zoom-in"
            />
          ))}
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
