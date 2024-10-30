"use client";

import { useState, useEffect, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Link from "next/link";
import { IoMdList, IoMdShuffle } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import Footer from "../../components/Footer";
import RootLayout from "../layout";
import { IKImage } from "imagekitio-react";
import MoreImageLoader from "../../components/MoreImageLoader";
import Loader from "../../components/loader/loader";
// import { errorToast, successToast } from "../../utils/toast";

export default function Random() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const [loader, __loader] = useState(false);
  const [loaded, setLoaded] = useState([]); // Track load state of each image
  const wasCalled = useRef(false);

  // const handleImageLoad = (index) => {
  //   const newLoaded = [...loaded];
  //   newLoaded[index] = true; // Mark image as loaded
  //   console.log(newLoaded);

  //   setLoaded(newLoaded);
  // };

  const getImages = async () => {
    __loader((t) => true);
    setImages((i) => []);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        setImages((prevImages) => [...images]);
        setLoaded(Array(images.length).fill(false));

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

        setSlides((prevSlides) => [...newSlides]);
        __loader((t) => false);
        // successToast("Images fetched successfuly!");
      } else {
        console.error("Failed to get files");
        errorToast("Failed to get files");
        __loader((t) => false);
      }
    } catch (error) {
      // errorToast("Failed to get files");
      __loader((t) => false);
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

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    getImages();
  });

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
                // onClick={randomizeSequence}
                onClick={getImages}
                className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
              />
            </div>
          </div>
        </div>

        {loader && <Loader />}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
          {Images.map((photo, i) => (
            <div key={i} className="relative">
              {/* {!loaded[i] && (
                <span className="text-white font-bold h-[330px] bg-gray-700 animate-pulse flex items-center justify-center">
                  Loading...
                </span>
              )} */}

              <img
                alt={photo.name}
                data-src={photo.src}
                src={photo.src}
                onClick={() => setIndex(i)}
                // onLoad={() => handleImageLoad(i)}
                className="aspect-[16/9] cursor-zoom-in object-cover"
                // ${loaded[i] ? "opacity-100" : "opacity-0"}
                loading="lazy"
              />
            </div>
          ))}
        </div>

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

      <Footer />
    </RootLayout>
  );
}
