"use client";

import { useState, useEffect, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Link from "next/link";
import { IoMdList, IoMdShuffle } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import Loader from "../../components/loader/loader";
import Footer from "../../components/Footer";
import RootLayout from "../layout";
import { AiOutlinePlus } from "react-icons/ai";
import { IKImage } from 'imagekitio-react';


export default function Random() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [skeleton, setSkeleton] = useState(false);
  const [Images, setImages] = useState([]);
  const wasCalled = useRef(false);

  const getImages = async (token) => {
    setSkeleton(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
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
      setSkeleton(false);
    }
  };

  function randomizeArraysInSync(array1, array2) {
    if (array1.length !== array2.length) {
      throw new Error("Arrays must have the same length.");
    }

    let currentIndex = array1.length;

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array1[currentIndex], array1[randomIndex]] = [
        array1[randomIndex],
        array1[currentIndex],
      ];
      [array2[currentIndex], array2[randomIndex]] = [
        array2[randomIndex],
        array2[currentIndex],
      ];
    }
    console.log("shuffled");
    return { array1, array2 };
  }

  const randomizeSequence = () => {
    // Shuffle the arrays
    const shuffledImages = [...Images];
    const shuffledSlides = [...slides];
    randomizeArraysInSync(shuffledImages, shuffledSlides);

    // Update state with shuffled arrays
    setImages(shuffledImages);
    const newSlides = shuffledImages.map((photo) => {
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
    setSlides(newSlides);
  };

  const handleCloseLightbox = () => {
    setIndex(-1);
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
  }, []);

  return (
    <RootLayout>
      <div className="px-4 lg:px-16 pb-10">
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
              <Link href={"/indx"}>
                <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
              </Link>

              <Link href={"/ordr"}>
                <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
              </Link>

              <IoMdShuffle
                onClick={randomizeSequence}
                className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
              />
            </div>
          </div>
        </div>

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

        {skeleton && <Loader />}

        {slides && (
          <Lightbox
            plugins={[Captions]}
            index={index}
            slides={slides}
            open={index >= 0}
            close={handleCloseLightbox}
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
