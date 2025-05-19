"use client";
import { IKImage } from "imagekitio-react";
import { useState, useEffect, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Footer from "./Footer";
import MoreImageLoader from "../components/MoreImageLoader/index";

import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "./loader/loader";

// import { errorToast, successToast } from "../utils/toast";

export default function MasonaryGrid() {
  const descriptionTextAlign = "start";
  const descriptionMaxLines = 3;
  const isOpen = true;

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

          // successToast("All images have been loaded!");
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
          // endMessage={<p className="text-center py-4 font-bold">You have seen it all!</p>}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map((photo, i) => (
                <div key={i} className="relative group">
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className="aspect-[16/9] object-cover cursor-zoom-in"
                  />

                  {/* Mouse Over Overlay */}
                  <div className="absolute top-0 left-0 w-full h-full grid place-items-center transition-all duration-200 group-hover:opacity-100 opacity-0 bg-black/30 pointer-events-none">
                    {photo.caption} {photo.year}
                  </div>
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
      )}

      {!loader && <Footer />}
    </>
  );
}
