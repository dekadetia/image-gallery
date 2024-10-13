"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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

export default function Index() {
  const descriptionTextAlign = "end";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [skeleton, setSkeleton] = useState(false);
  const [Images, setImages] = useState([]);

  const getImages = async () => {
    setSkeleton(true);

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

        successToast("Detais fetched successfully!");
        setSlides(newSlides);
        setSkeleton(false);
      } else {
        errorToast("Failed to get files");
        setSkeleton(false);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      errorToast("Failed to get files");
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

  useEffect(() => {
    getImages();
  }, []);

  return (
    <RootLayout>
      <main>
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
            <InfiniteScroll
              dataLength={Images.length}
              next={() => getImages(nextPageToken)}
              hasMore={hasMore}
              loader={<Loader />}
              endMessage={<p>You have seen it all!</p>}
            >
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
            </InfiniteScroll>
          </div>

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

        <Footer />
      </main>
    </RootLayout>
  );
}
