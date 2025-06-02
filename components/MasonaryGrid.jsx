"use client";
import { useState, useEffect, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";

import Footer from "./Footer";
import MoreImageLoader from "../components/MoreImageLoader/index";

import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "./loader/loader";
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function MasonaryGrid() {
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);

  const [Images, setImages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);

  const [hasMore, setHasMore] = useState(true);
  const [loader, __loader] = useState(true);

  const wasCalled = useRef(false);

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-images`,
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
        console.log(images)
        if (images.length === 0) {
          setHasMore(false); // Stop fetching if no more data
          return;
        }

        if (!data.nextPageToken) {
          setHasMore(false);
          setNextPageToken(null);
          return;
        } else {
          setImages((prevImages) => {
            const existingNames = new Set(prevImages.map((img) => img.name));
            const newImages = images.filter(
              (img) => !existingNames.has(img.name)
            );
            return [...prevImages, ...newImages];
          });
          setNextPageToken(data.nextPageToken);
        }

        const newSlides = images.map((photo) => {
          const width = 1080 * 4;
          const height = 1620 * 4;
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions,
            director: photo.director || null,
            year: photo.year
          };
        });

        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
      }
    } catch (error) {
      console.log(error);
      // errorToast("Error fetching files");
    }

    __loader(false);
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;

    __loader(true);
    getImages(nextPageToken);
  });

  return (
    <>
      {loader ? (
        <Loader />
      ) : (
        <div className="px-4 lg:px-16 pb-10">
          {/* Images */}
          <InfiniteScroll
            dataLength={Images.length}
            next={() => getImages(nextPageToken)}
            hasMore={hasMore}
            loader={<MoreImageLoader />}
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
              index={index}
              slides={slides}
              open={index >= 0}
              close={() => setIndex(-1)}
              render={{
                slideFooter: ({ slide }) => (
                  <div className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content">
                    {slide.title && (
                      <div className="yarl__slide_title">{slide.title}</div>
                    )}
                    <div className={cn("!space-y-0", slide.director && "!mb-5")}>
                      {slide.director && (
                        <div className="yarl__slide_description !text-[#99AABB]">
                          <span className="font-medium">{slide.director}</span>
                        </div>
                      )}
                      {slide.description && (
                        <div className="yarl__slide_description">{slide.description}</div>
                      )}
                    </div>
                  </div>
                )
              }}
            />
          )}
        </div>
      )}

      {!loader && <Footer />}
    </>
  );
}
