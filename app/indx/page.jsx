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
import { successToast, errorToast } from "../../utils/toast";
import RootLayout from "../layout";
import MoreImageLoader from "../../components/MoreImageLoader";

export default function Index() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const [loader, setLoader] = useState(false);
  const wasCalled = useRef(false);

  const getImages = async () => {
    setLoader(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-sorted-images`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        setImages(images);
        successToast("Detais fetched successfully!");
      } else {
        errorToast("Failed to get files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      errorToast("Failed to get files");
    }

    setLoader(false);
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
    getImages();
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
        {loader && <MoreImageLoader />}
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
